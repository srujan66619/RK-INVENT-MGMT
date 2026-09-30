import { db } from "@/db";
import { repairs, repairNotes, appointments, waLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export class RepairRepository {
  async getAll(filters?: { customerId?: string; technicianId?: string }) {
    let query = db.select().from(repairs).$dynamic();
    
    if (filters?.customerId) {
      query = query.where(eq(repairs.customer_id, filters.customerId));
    }
    if (filters?.technicianId) {
      query = query.where(eq(repairs.technician_id, filters.technicianId));
    }
    
    return await query.orderBy(desc(repairs.created_at));
  }

  async getById(id: string) {
    const result = await db.select().from(repairs).where(eq(repairs.id, id));
    return result[0] || null;
  }

  async create(data: any) {
    const result = await db.insert(repairs).values(data).returning();
    return result[0];
  }

  async createWithParts(data: any, parts: { item_id: string; quantity: number }[], technician_id: string) {
    const { inventory, repairParts, stockMovements } = await import("@/db/schema");
    const { sql } = await import("drizzle-orm");

    return await db.transaction(async (tx) => {
      // 1. Create repair
      const [repair] = await tx.insert(repairs).values(data).returning();
      
      // 2. Consume parts
      for (const partReq of parts) {
        if (partReq.quantity <= 0 || !Number.isInteger(partReq.quantity)) {
          throw new Error("Invalid quantity");
        }
        
        const [item] = await tx
          .select()
          .from(inventory)
          .where(eq(inventory.id, partReq.item_id))
          .for("update");

        if (!item) throw new Error("Inventory item not found");
        if (item.stock_level < partReq.quantity) {
          throw new Error(`Insufficient stock. Only ${item.stock_level} available.`);
        }

        await tx.update(inventory).set({
          stock_level: sql`${inventory.stock_level} - ${partReq.quantity}`,
          quantity: sql`${inventory.quantity} - ${partReq.quantity}`,
        }).where(eq(inventory.id, partReq.item_id));

        const [part] = await tx.insert(repairParts).values({
          repair_id: repair.id,
          item_id: partReq.item_id,
          quantity: partReq.quantity,
          unit_cost: item.cost_price,
          technician_id: technician_id,
        }).returning();

        await tx.insert(stockMovements).values({
          item_id: partReq.item_id,
          type: "out",
          quantity: partReq.quantity,
          reference_id: repair.id,
          reference_type: "repair",
          notes: `Consumed for repair ${repair.ticket_no}`,
          owner_id: technician_id,
        });
      }
      
      return repair;
    });
  }

  async update(id: string, data: any) {
    const result = await db.update(repairs).set(data).where(eq(repairs.id, id)).returning();
    return result[0];
  }

  async delete(id: string) {
    // Also delete associated notes and appointments first to avoid FK constraints
    await db.delete(repairNotes).where(eq(repairNotes.repair_id, id));
    await db.delete(appointments).where(eq(appointments.repair_id, id));
    await db.delete(repairs).where(eq(repairs.id, id));
    return true;
  }

  // --- Repair Notes ---
  async getNotes(repairId: string) {
    return await db.select().from(repairNotes).where(eq(repairNotes.repair_id, repairId)).orderBy(desc(repairNotes.created_at));
  }

  async createNote(data: any) {
    const result = await db.insert(repairNotes).values(data).returning();
    return result[0];
  }

  async updateNote(id: string, data: any) {
    const result = await db.update(repairNotes).set(data).where(eq(repairNotes.id, id)).returning();
    return result[0];
  }

  // --- Appointments ---
  async getAppointments(repairId: string) {
    return await db.select().from(appointments).where(eq(appointments.repair_id, repairId)).orderBy(desc(appointments.created_at));
  }

  async createAppointment(data: any) {
    const result = await db.insert(appointments).values(data).returning();
    return result[0];
  }

  // --- WA Logs ---
  async getWaLogs(repairId: string) {
    return await db.select().from(waLogs).where(eq(waLogs.repair_id, repairId)).orderBy(desc(waLogs.created_at));
  }
}

export const repairRepository = new RepairRepository();
