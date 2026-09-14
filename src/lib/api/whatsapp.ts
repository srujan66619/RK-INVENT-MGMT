"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../auth.server";

export const getWhatsappStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  const { whatsappService } = await import("@/services/whatsapp.service");
  return {
    isConfigured: whatsappService.isConfigured,
  };
});

export const sendManualWhatsappFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        kind: z.string(), // "repair_update", "invoice_delivery", "payment_reminder"
        target_id: z.string(), // repair_id or invoice_id
        link: z.string().optional(), // For invoices
        status_override: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const { userService } = await import("@/services/user.service");
    const { whatsappService } = await import("@/services/whatsapp.service");
    const { repairService } = await import("@/services/repair.service");
    const { customerService } = await import("@/services/customer.service");
    const { invoiceService } = await import("@/services/invoice.service");

    const profile = await userService.getProfileById(session.user.id);
    const shopName = profile?.shop_name || "RK Labs";

    if (!whatsappService.isConfigured) {
      throw new Error("WhatsApp API is not configured on the server.");
    }

    if (data.kind === "repair_update") {
      const repair = await repairService.getRepairById(data.target_id);
      if (!repair || !repair.customer_id) throw new Error("Repair or customer not found");
      const customer = await customerService.getCustomerById(repair.customer_id);
      
      const statusToSend = data.status_override || repair.status;
      const fakeRepair = { ...repair, status: statusToSend };
      
      await whatsappService.sendRepairStatusUpdate(fakeRepair, customer, shopName, statusToSend);
      return { success: true };
    } 
    
    if (data.kind === "invoice_delivery") {
      const invoice = await invoiceService.getInvoiceById(data.target_id);
      if (!invoice || !invoice.customer_id) throw new Error("Invoice or customer not found");
      const customer = await customerService.getCustomerById(invoice.customer_id);
      
      const baseUrl = process.env.PUBLIC_URL || "https://rklabs.syncailabs.in";
      const invoiceLink = `${baseUrl}/invoice/${invoice.id}`;
      
      await whatsappService.sendInvoice(invoice, customer, invoiceLink, shopName);
      return { success: true };
    }

    if (data.kind === "payment_reminder") {
      const invoice = await invoiceService.getInvoiceById(data.target_id);
      if (!invoice || !invoice.customer_id) throw new Error("Invoice or customer not found");
      if (invoice.payment_status === "paid" || invoice.amount_paid >= invoice.total) {
        throw new Error("Invoice is already fully paid.");
      }
      const customer = await customerService.getCustomerById(invoice.customer_id);
      
      await whatsappService.sendPaymentReminder(invoice, customer, shopName);
      return { success: true };
    }

    throw new Error("Unknown notification kind");
  });

export const sendTestWhatsappFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        phone: z.string(),
        template_name: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const { whatsappService } = await import("@/services/whatsapp.service");
    
    await whatsappService.sendTemplateMessage({
      phone: data.phone,
      templateName: data.template_name,
      kind: "test_message",
      recipientName: "Test User",
      ownerId: session.user.id,
      messageTextPreview: "Test Message",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Test User" }, // {{1}}
            { type: "text", text: "Test Device" }, // {{2}}
            { type: "text", text: "TK-TEST-001" }, // {{3}}
            { type: "text", text: "RK Labs" }, // {{4}}
          ],
        }
      ]
    });
    
    return { success: true };
  });
