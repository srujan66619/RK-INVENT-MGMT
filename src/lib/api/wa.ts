import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { waRepository } from "@/repositories/wa.repository";
import { requireAuth } from "../auth.server";

export const logWaMessageFn = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        repair_id: z.string().nullable().optional(),
        invoice_id: z.string().nullable().optional(),
        kind: z.string(),
        recipient_name: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        message: z.string(),
        status: z.enum(["sent", "blocked", "cancelled", "no_phone"]),
        error: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { session } = await requireAuth();

    await waRepository.create({
      owner_id: session.user.id,
      ...data,
    });

    return { success: true };
  });

export const getWaLogsFn = createServerFn({ method: "GET" })
  .validator((data) =>
    z
      .object({
        repair_id: z.string().optional(),
        invoice_id: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { session } = await requireAuth();

    const logs = await waRepository.getLogs(session.user.id, data.repair_id, data.invoice_id);

    return logs;
  });
