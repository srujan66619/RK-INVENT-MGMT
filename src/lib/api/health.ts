"use server";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const getHealthFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // Execute a simple query to verify connection
    await db.execute(sql`SELECT 1`);
    return {
      status: "ok",
      database: "connected",
    };
  } catch (err) {
    console.error("Database connection failed:", err);
    return {
      status: "error",
      database: "disconnected",
    };
  }
});
