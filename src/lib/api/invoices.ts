"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../auth.server";
const invoiceSchema = z.object({
  invoice_no: z.string(),
  customer_id: z.string().nullable().optional(),
  repair_id: z.string().nullable().optional(),
  subtotal: z.number(),
  discount: z.number().nullable().optional(),
  tax_rate: z.number().nullable().optional(),
  tax_amount: z.number().nullable().optional(),
  total: z.number(),
  amount_paid: z.number().nullable().optional(),
  payment_status: z.string(),
  payment_method: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const getInvoicesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  const { invoiceService } = await import("@/services/invoice.service");
  return await invoiceService.getInvoices();
});

export const getPublicInvoiceFn = createServerFn({ method: "GET" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data: id }) => {
    const { invoiceService } = await import("@/services/invoice.service");
    const { customerService } = await import("@/services/customer.service");
    const { userService } = await import("@/services/user.service");

    const invoice = await invoiceService.getInvoiceById(id);
    if (!invoice) return { invoice: null };
    
    const customer = invoice.customer_id ? await customerService.getCustomerById(invoice.customer_id) : null;
    const profile = await userService.getProfileById(invoice.owner_id);
    const items = await invoiceService.getInvoiceItems(invoice.id);
    
    return { 
      invoice, 
      customer, 
      shop: profile,
      items
    };
  });

export const createInvoiceFn = createServerFn({ method: "POST" })
  .validator((data) => invoiceSchema.parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const { invoiceService } = await import("@/services/invoice.service");
    const invoice = await invoiceService.createInvoice({
      ...data,
      owner_id: session.user.id,
    });
    return { id: invoice.id, invoice_no: data.invoice_no, created_at: invoice.created_at };
  });

export const updateInvoiceFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string(), data: z.any() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { invoiceService } = await import("@/services/invoice.service");
    await invoiceService.updateInvoice(data.id, data.data);
    const invoice = await invoiceService.getInvoiceById(data.id);
    
    // Auto Payment Reminder logic
    if (invoice && data.data.payment_status && data.data.payment_status !== "paid") {
      // Typically you'd have a cron job, but if updated manually and balance remains, we might remind
      // Or if explicitly requested via a separate route. We'll let manual UI buttons handle reminders 
      // primarily, but we can hook in here if needed.
    }

    return { success: true };
  });

export const deleteInvoiceFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    const { invoiceService } = await import("@/services/invoice.service");
    await invoiceService.deleteInvoice(data);
    return { success: true };
  });

// Invoice items
export const getInvoiceItemsFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ invoice_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { invoiceService } = await import("@/services/invoice.service");
    return await invoiceService.getInvoiceItems(data.invoice_id);
  });

export const createInvoiceItemsFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .array(
        z.object({
          invoice_id: z.string(),
          description: z.string(),
          quantity: z.number(),
          unit_price: z.number(),
          total_price: z.number(),
          warranty: z.string().nullable().optional(),
        }),
      )
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAuth();
    const { invoiceService } = await import("@/services/invoice.service");
    for (const item of data) {
      await invoiceService.createInvoiceItem(item);
    }
    return { success: true };
  });

