import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { inventoryService } from "@/services/inventory.service";
import { supplierService } from "@/services/supplier.service";
import { purchaseorderService } from "@/services/purchaseorder.service";
import { requireAuth } from "../auth.server";

// === INVENTORY ITEMS ===
const inventoryItemSchema = z.object({
  name: z.string(),
  sku: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  cost_price: z.number(),
  selling_price: z.number(),
  stock_level: z.number(),
  min_stock_level: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const getInventoryItemsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  return await inventoryService.getInventoryItems();
});

export const createInventoryItemFn = createServerFn({ method: "POST" })
  .validator((data) => inventoryItemSchema.parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const item = await inventoryService.createInventoryItem({
      ...data,
      quantity: data.stock_level,
      owner_id: session.user.id,
    });
    return { id: item.id };
  });

export const updateInventoryItemFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({ id: z.string(), data: inventoryItemSchema.partial() }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAuth();
    await inventoryService.updateInventoryItem(data.id, data.data);
    return { success: true };
  });

export const deleteInventoryItemFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    await inventoryService.deleteInventoryItem(data);
    return { success: true };
  });

// === STOCK MOVEMENTS ===
const stockMovementSchema = z.object({
  item_id: z.string(),
  type: z.string(),
  quantity: z.number(),
  reference_id: z.string().nullable().optional(),
  reference_type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const getStockMovementsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  const movements = await inventoryService.getStockMovements();
  return movements.map((m: any) => ({
    id: m.id,
    item_id: m.item_id,
    item_name: "Item", // Note: A join or lookup would be better here for full item names
    movement_type: m.type,
    change: m.quantity,
    balance_after: 0,
    reference: m.reference_id,
    notes: m.notes,
    created_at: m.created_at,
  }));
});

export const createStockMovementFn = createServerFn({ method: "POST" })
  .validator((data) => stockMovementSchema.parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    await inventoryService.createStockMovement({
      ...data,
      owner_id: session.user.id,
    });
    
    // Update inventory quantity
    if (data.type === "in" || data.type === "out") {
      const modifier = data.type === "in" ? data.quantity : -data.quantity;
      const item = await inventoryService.getInventoryItemById(data.item_id);
      if (item) {
        await inventoryService.updateInventoryItem(data.item_id, {
          quantity: (item.quantity || 0) + modifier,
          stock_level: (item.stock_level || 0) + modifier,
        });
      }
    }
    return { success: true };
  });

// === SUPPLIERS ===
const supplierSchema = z.object({
  name: z.string(),
  contact_person: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  gst_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const getSuppliersFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  return await supplierService.getSuppliers();
});

export const createSupplierFn = createServerFn({ method: "POST" })
  .validator((data) => supplierSchema.parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const supplier = await supplierService.createSupplier({
      ...data,
      owner_id: session.user.id,
    });
    return { id: supplier.id };
  });

export const updateSupplierFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string(), data: supplierSchema.partial() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    await supplierService.updateSupplier(data.id, data.data);
    return { success: true };
  });

export const deleteSupplierFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    await supplierService.deleteSupplier(data);
    return { success: true };
  });

// === PURCHASE ORDERS ===
export const getPurchaseOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  const pos = await purchaseorderService.getPurchaseOrders();
  return pos.map((i: any) => ({
    id: i.id,
    po_no: i.po_number,
    supplier_id: i.supplier_id,
    status: i.status,
    total: i.total_amount,
    created_at: i.created_at,
    received_at: i.received_at,
    notes: i.notes,
  }));
});

export const getPurchaseOrderItemsFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ po_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    return await purchaseorderService.getPurchaseOrderItems(data.po_id);
  });

export const createPurchaseOrderFn = createServerFn({ method: "POST" })
  .validator((data) => z.any().parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const po = await purchaseorderService.createPurchaseOrder({
      po_number: poNumber,
      supplier_id: data.supplier_id,
      total_amount: data.total,
      notes: data.notes,
      status: "pending",
      owner_id: session.user.id,
    });

    if (data.lines && data.lines.length > 0) {
      for (const l of data.lines) {
        await purchaseorderService.createPurchaseOrderItem({
          po_id: po.id,
          item_id: l.item_id,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
          total_cost: l.quantity * l.unit_cost,
        });
      }
    }
    return { id: po.id, po_no: poNumber };
  });

export const updatePurchaseOrderFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string(), data: z.any() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    await purchaseorderService.updatePurchaseOrder(data.id, data.data);
    return { success: true };
  });

export const deletePurchaseOrderFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    await purchaseorderService.deletePurchaseOrder(data);
    return { success: true };
  });
