"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { repairs } from "@/db/schema/repairs";
import { customers } from "@/db/schema/customers";
import { ilike, or, desc } from "drizzle-orm";
import { getSession } from "../auth.server";

export const globalSearchFn = createServerFn({ method: "GET" })
  .validator((d: string) => z.string().parse(d))
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    if (!data || data.trim().length < 2) {
      return { repairs: [], customers: [] };
    }

    const q = `%${data.trim()}%`;

    const matchedRepairs = await db
      .select()
      .from(repairs)
      .where(
        or(
          ilike(repairs.ticket_no, q),
          ilike(repairs.device_brand, q),
          ilike(repairs.device_model, q),
          ilike(repairs.imei, q),
          ilike(repairs.issue, q)
        )
      )
      .orderBy(desc(repairs.created_at))
      .limit(5);

    const matchedCustomers = await db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.name, q),
          ilike(customers.email, q),
          ilike(customers.phone, q)
        )
      )
      .orderBy(desc(customers.created_at))
      .limit(5);

    return {
      repairs: matchedRepairs,
      customers: matchedCustomers,
    };
  });
