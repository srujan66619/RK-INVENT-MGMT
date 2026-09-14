"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../auth.server";

const repairSchema = z.object({
  customer_id: z.string().nullable().optional(),
  device_type: z.string().nullable().optional(),
  device_brand: z.string().nullable().optional(),
  device_model: z.string().nullable().optional(),
  imei: z.string().nullable().optional(),
  issue: z.string().min(1),
  status: z.string(),
  technician_notes: z.string().nullable().optional(),
  estimated_completion: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
  estimated_cost: z.number().nullable().optional(),
  appointment_at: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
  ticket_no: z.string().optional(),
});


export const getRepairsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { session, user } = await requireAuth();
  const { repairService } = await import("@/services/repair.service");
  const { customerService } = await import("@/services/customer.service");
  
  if (user.role === "customer") {
    const customer = await customerService.getCustomerByProfileId(user.id);
    if (!customer) return [];
    return await repairService.getRepairs({ customerId: customer.id });
  }
  
  if (user.role === "technician") {
    return await repairService.getRepairs({ technicianId: user.id });
  }
  
  return await repairService.getRepairs();
});

export const createRepairFn = createServerFn({ method: "POST" })
  .validator((data) => repairSchema.parse(data))
  .handler(async ({ data }) => {
    const { session, user } = await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    const { customerService } = await import("@/services/customer.service");
    const { userService } = await import("@/services/user.service");
    const { whatsappService } = await import("@/services/whatsapp.service");

    const ticket_no = data.ticket_no || `TK-${Date.now().toString().slice(-6)}`;
    
    let assignedCustomerId = data.customer_id;
    if (user.role === "customer") {
      const customer = await customerService.getCustomerByProfileId(user.id);
      if (customer) {
        assignedCustomerId = customer.id;
      }
    }

    const repairData: any = {
      ...data,
      ticket_no,
      customer_id: assignedCustomerId,
      owner_id: session.user.id,
    };

    const repair = await repairService.createRepair(repairData);

    // Trigger WhatsApp notification for Repair Received
    if (repair.customer_id) {
      try {
        const customer = await customerService.getCustomerById(repair.customer_id);
        const profile = await userService.getProfileById(session.user.id);
        if (customer && profile?.auto_reminders) {
          whatsappService.sendRepairReceived(repair, customer, profile.shop_name || "RK Labs").catch(console.error);
        }
      } catch (e) {
        console.error("Failed to auto-send WhatsApp for new repair", e);
      }
    }

    return { id: repair.id, ticket_no, created_at: repair.created_at };
  });

export const updateRepairFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string(), data: repairSchema.partial() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    const { customerService } = await import("@/services/customer.service");
    const { userService } = await import("@/services/user.service");
    const { whatsappService } = await import("@/services/whatsapp.service");
    
    // Convert date strings to Date objects if present
    const updateData: any = { ...data.data };
    
    const oldRepair = await repairService.getRepairById(data.id);
    await repairService.updateRepair(data.id, updateData);
    const repair = await repairService.getRepairById(data.id);
    
    // Trigger auto status reminder if status changed
    if (repair && oldRepair && data.data.status && data.data.status !== oldRepair.status) {
      if (repair.customer_id) {
        try {
          const customer = await customerService.getCustomerById(repair.customer_id);
          const profile = await userService.getProfileById(repair.owner_id);
          if (customer && profile?.auto_reminders) {
            whatsappService.sendRepairStatusUpdate(repair, customer, profile.shop_name || "RK Labs", data.data.status).catch(console.error);
          }
        } catch (e) {
          console.error("Failed to auto-send WhatsApp for repair update", e);
        }
      }
    }

    return { id: data.id, ticket_no: repair?.ticket_no };
  });

export const deleteRepairFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    await repairService.deleteRepair(data);
    return { success: true };
  });

// Repair Notes
export const getRepairNotesFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ repair_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    return await repairService.getRepairNotes(data.repair_id);
  });

export const createRepairNoteFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({ repair_id: z.string(), note: z.string(), technician_name: z.string().optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    const note = await repairService.createRepairNote({
      ...data,
      task_done: false,
    });
    return { id: note.id };
  });

export const updateRepairNoteFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string(), data: z.any() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    await repairService.updateRepairNote(data.id, data.data);
    return { success: true };
  });

// Appointment Events
export const getAppointmentEventsFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ repair_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    const events = await repairService.getAppointmentEvents(data.repair_id);
    return events.map((e: any) => ({
      id: e.id,
      action: e.title,
      previous_at: e.start_time ? new Date(e.start_time).toISOString() : null,
      new_at: e.end_time ? new Date(e.end_time).toISOString() : null,
      note: e.notes,
      created_at: e.created_at ? new Date(e.created_at).toISOString() : null,
    }));
  });

export const createAppointmentEventFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        repair_id: z.string(),
        action: z.string(),
        previous_at: z.string().nullable(),
        new_at: z.string().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    const apt = await repairService.createAppointmentEvent({
      repair_id: data.repair_id,
      title: data.action,
      start_time: data.previous_at ? new Date(data.previous_at) : new Date(),
      end_time: data.new_at ? new Date(data.new_at) : new Date(),
      owner_id: session.user.id,
    });
    return { id: apt.id };
  });

export const getWaLogsFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ repair_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairService } = await import("@/services/repair.service");
    return await repairService.getWaLogs(data.repair_id);
  });
