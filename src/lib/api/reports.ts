"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../auth.server";


// === PNL DATA ===
export const getPnlDataFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAuth();

    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);

    const { invoiceService } = await import("@/services/invoice.service");
    const { inventoryService } = await import("@/services/inventory.service");
    const { purchaseorderService } = await import("@/services/purchaseorder.service");
    const { expenseRepository } = await import("@/repositories/expense.repository");

    const allInvoices = await invoiceService.getInvoices();
    const invoices = allInvoices.filter((i) => i.created_at && new Date(i.created_at) >= fromDate && new Date(i.created_at) < toDate);
    
    const inventory = await inventoryService.getInventoryItems();
    
    const allPurchaseOrders = await purchaseorderService.getPurchaseOrders();
    const purchaseOrders = allPurchaseOrders.filter(
      (p) => p.status === "received" && p.received_at && new Date(p.received_at) >= fromDate && new Date(p.received_at) < toDate,
    );
    
    const allExpenses = await expenseRepository.getAll();
    const expenses = allExpenses.filter((e) => {
      const eDate = e.expense_date || e.date;
      if (!eDate) return false;
      const d = new Date(eDate);
      return d >= fromDate && d < toDate;
    });

    let invoiceItems = [] as any[];
    for (const inv of invoices) {
      const items = await invoiceService.getInvoiceItems(inv.id);
      invoiceItems.push(...items);
    }

    return {
      invoices: invoices.map((i) => ({
        id: i.id || "",
        total: i.total,
        payment_status: i.payment_status,
        gst_amount: i.tax_amount,
        discount: i.discount,
        created_at: i.created_at ? new Date(i.created_at).toISOString() : null,
      })),
      invoiceItems: invoiceItems.map((i) => ({
        id: i.id,
        invoice_id: i.invoice_id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      inventory: inventory.map((i) => ({
        id: i.id,
        name: i.name,
        cost_price: i.cost_price,
        selling_price: i.selling_price,
      })),
      purchaseOrders: purchaseOrders.map((p) => ({
        id: p.id || "",
        total: p.total_amount,
      })),
      expenses: expenses.map((e) => ({
        id: e.id || "",
        category: e.category,
        description: e.description,
        amount: e.amount,
        expense_date: e.expense_date ? new Date(e.expense_date).toISOString() : (e.date || ""),
      })),
    };
  });

// === EXPENSES ===
export const createExpenseFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        category: z.string(),
        description: z.string().nullable().optional(),
        amount: z.number(),
        expense_date: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { session } = await requireAuth();

    const { expenseRepository } = await import("@/repositories/expense.repository");
    const expense = await expenseRepository.create({
      category: data.category,
      description: data.description || "",
      amount: data.amount,
      date: data.expense_date,
      expense_date: new Date(data.expense_date),
      owner_id: session.user.id,
    });
    return { id: expense.id };
  });

export const deleteExpenseFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    const { expenseRepository } = await import("@/repositories/expense.repository");
    await expenseRepository.delete(data);
    return { success: true };
  });

// === REPORTS DATA ===
export const getReportsDataFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        from: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAuth();

    const fromDate = new Date(data.from);

    const { invoiceService } = await import("@/services/invoice.service");
    const { repairService } = await import("@/services/repair.service");
    const { customerService } = await import("@/services/customer.service");

    const allInvoices = await invoiceService.getInvoices();
    const invoices = allInvoices.filter((i) => i.created_at && new Date(i.created_at) >= fromDate);
    
    const allRepairs = await repairService.getRepairs();
    const repairs = allRepairs.filter((r) => r.created_at && new Date(r.created_at) >= fromDate);
    
    const allCustomers = await customerService.getCustomers();
    const customers = allCustomers.map((c) => ({ id: c.id, name: c.name }));

    return {
      invoices: invoices.map((i) => ({
        id: i.id,
        invoice_no: i.invoice_no,
        customer_id: i.customer_id,
        total: i.total,
        gst_amount: i.tax_amount,
        payment_status: i.payment_status,
        payment_mode: i.payment_method,
        created_at: i.created_at ? new Date(i.created_at).toISOString() : null,
      })),
      repairs: repairs.map((r) => ({
        id: r.id,
        customer_id: r.customer_id,
        technician_name: "Technician", // Mock data logic for this
        status: r.status,
        estimated_cost: r.estimated_cost,
        final_cost: r.final_cost,
      })),
      customers,
    };
  });
