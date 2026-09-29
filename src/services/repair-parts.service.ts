import { db } from "@/db";
import { repairParts, inventory, stockMovements } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class RepairPartsService {
  async consumePart(data: { repair_id: string; item_id: string; quantity: number; technician_id: string; notes?: string }) {
    if (data.quantity <= 0 || !Number.isInteger(data.quantity)) {
      throw new Error("Invalid quantity");
    }

    // Atomic consumption using transaction
    return await db.transaction(async (tx) => {
      // 1. Get current item and lock row
      const [item] = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.id, data.item_id))
        .for("update");

      if (!item) {
        throw new Error("Inventory item not found");
      }

      if (item.stock_level < data.quantity) {
        throw new Error(`Insufficient stock. Only ${item.stock_level} units are available.`);
      }

      // 2. Decrease stock level
      const [updatedItem] = await tx
        .update(inventory)
        .set({
          stock_level: sql`${inventory.stock_level} - ${data.quantity}`,
          quantity: sql`${inventory.quantity} - ${data.quantity}`, // keep synchronized
        })
        .where(eq(inventory.id, data.item_id))
        .returning();

      // 3. Create repair part
      const [part] = await tx
        .insert(repairParts)
        .values({
          repair_id: data.repair_id,
          item_id: data.item_id,
          quantity: data.quantity,
          unit_cost: item.cost_price,
          technician_id: data.technician_id,
        })
        .returning();

      // 4. Create stock movement
      await tx.insert(stockMovements).values({
        item_id: data.item_id,
        type: "out",
        quantity: data.quantity,
        reference_id: data.repair_id,
        reference_type: "repair",
        notes: data.notes || `Consumed for repair ${data.repair_id}`,
        owner_id: data.technician_id, // assuming technician_id is valid user
      });

      return part;
    });
  }

  async reverseConsumption(partId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get the consumed part
      const [part] = await tx
        .select()
        .from(repairParts)
        .where(eq(repairParts.id, partId))
        .for("update");

      if (!part) {
        throw new Error("Repair part not found");
      }

      // 2. Increase stock level
      await tx
        .update(inventory)
        .set({
          stock_level: sql`${inventory.stock_level} + ${part.quantity}`,
          quantity: sql`${inventory.quantity} + ${part.quantity}`,
        })
        .where(eq(inventory.id, part.item_id));

      // 3. Create stock movement (in)
      await tx.insert(stockMovements).values({
        item_id: part.item_id,
        type: "in",
        quantity: part.quantity,
        reference_id: part.repair_id,
        reference_type: "repair_reversal",
        notes: `Reversed consumption for repair ${part.repair_id}`,
        owner_id: part.technician_id || "",
      });

      // 4. Remove repair part record
      await tx.delete(repairParts).where(eq(repairParts.id, partId));

      return true;
    });
  }

  async getRepairParts(repairId: string) {
    return await db
      .select({
        id: repairParts.id,
        repair_id: repairParts.repair_id,
        item_id: repairParts.item_id,
        quantity: repairParts.quantity,
        unit_cost: repairParts.unit_cost,
        created_at: repairParts.created_at,
        item_name: inventory.name,
      })
      .from(repairParts)
      .leftJoin(inventory, eq(repairParts.item_id, inventory.id))
      .where(eq(repairParts.repair_id, repairId));
  }

  async getRepairPartsByItemId(itemId: string) {
    const { repairs } = await import("@/db/schema");
    const { customers } = await import("@/db/schema");
    return await db
      .select({
        id: repairParts.id,
        repair_id: repairParts.repair_id,
        quantity: repairParts.quantity,
        unit_cost: repairParts.unit_cost,
        created_at: repairParts.created_at,
        repair: {
          ticket_no: repairs.ticket_no,
          customer: {
            name: customers.name,
          }
        }
      })
      .from(repairParts)
      .leftJoin(repairs, eq(repairParts.repair_id, repairs.id))
      .leftJoin(customers, eq(repairs.customer_id, customers.id))
      .where(eq(repairParts.item_id, itemId));
  }

  async getAllRepairParts() {
    const { inventory } = await import("@/db/schema");
    return await db
      .select({
        id: repairParts.id,
        repair_id: repairParts.repair_id,
        item_id: repairParts.item_id,
        quantity: repairParts.quantity,
        unit_cost: repairParts.unit_cost,
        created_at: repairParts.created_at,
        item_name: inventory.name,
      })
      .from(repairParts)
      .leftJoin(inventory, eq(repairParts.item_id, inventory.id));
  }
}

export const repairPartsService = new RepairPartsService();
