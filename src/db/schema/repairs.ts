import { pgTable, uuid, varchar, text, timestamp, real, boolean, integer } from "drizzle-orm/pg-core";
import { profiles } from "./users";
import { customers } from "./customers";
import { inventory } from "./inventory";
export const repairs = pgTable("repairs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticket_no: varchar("ticket_no", { length: 50 }).notNull(),
  customer_id: uuid("customer_id").references(() => customers.id),
  device_type: varchar("device_type", { length: 100 }),
  device_brand: varchar("device_brand", { length: 100 }),
  device_model: varchar("device_model", { length: 100 }),
  imei: varchar("imei", { length: 50 }),
  issue: text("issue").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // "received" | "diagnosed" | "waiting_parts" | "in_progress" | "completed" | "delivered" | "cancelled"
  technician_notes: text("technician_notes"),
  estimated_completion: timestamp("estimated_completion"),
  estimated_cost: real("estimated_cost"),
  final_cost: real("final_cost"),
  appointment_at: timestamp("appointment_at"),
  owner_id: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  technician_id: uuid("technician_id").references(() => profiles.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const repairNotes = pgTable("repair_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  repair_id: uuid("repair_id")
    .references(() => repairs.id)
    .notNull(),
  note: text("note").notNull(),
  technician_name: varchar("technician_name", { length: 255 }),
  task_done: boolean("task_done").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  repair_id: uuid("repair_id")
    .references(() => repairs.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  notes: text("notes"),
  owner_id: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const repairParts = pgTable("repair_parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  repair_id: uuid("repair_id")
    .references(() => repairs.id)
    .notNull(),
  item_id: uuid("item_id").references(() => inventory.id).notNull(),
  quantity: integer("quantity").notNull(),
  unit_cost: real("unit_cost").notNull(),
  technician_id: uuid("technician_id").references(() => profiles.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
