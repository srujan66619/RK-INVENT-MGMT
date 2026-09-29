"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../auth.server";

const consumePartSchema = z.object({
  repair_id: z.string(),
  item_id: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const consumeRepairPartFn = createServerFn({ method: "POST" })
  .validator((data) => consumePartSchema.parse(data))
  .handler(async ({ data }) => {
    const { session } = await requireAuth();
    const { repairPartsService } = await import("@/services/repair-parts.service");
    
    const part = await repairPartsService.consumePart({
      ...data,
      technician_id: session.user.id,
    });
    
    return { success: true, part };
  });

export const reverseRepairPartFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({ part_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairPartsService } = await import("@/services/repair-parts.service");
    
    await repairPartsService.reverseConsumption(data.part_id);
    
    return { success: true };
  });

export const getRepairPartsFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ repair_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairPartsService } = await import("@/services/repair-parts.service");
    
    return await repairPartsService.getRepairParts(data.repair_id);
  });

export const getRepairPartsByItemFn = createServerFn({ method: "GET" })
  .validator((data) => z.object({ item_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const { repairPartsService } = await import("@/services/repair-parts.service");
    
    return await repairPartsService.getRepairPartsByItemId(data.item_id);
  });
