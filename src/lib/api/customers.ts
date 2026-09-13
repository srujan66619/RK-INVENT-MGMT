import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { customerService } from "@/services/customer.service";
import { requireAuth } from "../auth.server";

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const getCustomersFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  return await customerService.getCustomers();
});

export const createCustomerFn = createServerFn({ method: "POST" })
  .validator((data) => customerSchema.parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const customer = await customerService.createCustomer({
      ...data,
      owner_id: session.user.id,
    });
    return { id: customer.id };
  });

export const updateCustomerFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string(), data: customerSchema.partial() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    await customerService.updateCustomer(data.id, data.data);
    return { success: true };
  });

export const deleteCustomerFn = createServerFn({ method: "POST" })
  .validator((id: string) => z.string().parse(id))
  .handler(async ({ data }) => {
    await requireAuth();
    await customerService.deleteCustomer(data);
    return { success: true };
  });
