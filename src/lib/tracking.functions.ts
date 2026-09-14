"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ ticket: z.string().trim().min(1).max(64) });

export const trackRepair = createServerFn({ method: "GET" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { repairService } = await import("@/services/repair.service");
    const { customerService } = await import("@/services/customer.service");
    const { db } = await import("@/db");
    const { repairNotes } = await import("@/db/schema/repairs");
    const { eq, desc } = await import("drizzle-orm");

    const ticket = data.ticket.toUpperCase();

    const repairs = await repairService.getRepairs(); // Alternatively fetch specifically by ticket, but this matches previous behavior
    const repair = repairs.find((r) => r.ticket_no === ticket);
    if (!repair) return { found: false as const };

    let customer = null;
    if (repair.customer_id) {
      const cust = await customerService.getCustomerById(repair.customer_id);
      if (cust) {
        customer = {
          name: cust.name,
          phone: cust.phone,
          whatsapp: cust.whatsapp,
          email: cust.email,
          address: cust.address,
        };
      }
    }

    const notes = await db.select().from(repairNotes).where(eq(repairNotes.repair_id, repair.id)).orderBy(desc(repairNotes.created_at));

    return {
      found: true as const,
      repair,
      customer,
      notes,
    };
  });
