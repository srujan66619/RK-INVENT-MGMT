import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./users";
import { repairs } from "./repairs";
import { invoices } from "./billing";
import { customers } from "./customers";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  kind: varchar("kind", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const waLogs = pgTable("wa_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  owner_id: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  repair_id: uuid("repair_id").references(() => repairs.id),
  invoice_id: uuid("invoice_id").references(() => invoices.id),
  customer_id: uuid("customer_id").references(() => customers.id),
  kind: varchar("kind", { length: 50 }).notNull(),
  recipient_name: varchar("recipient_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // "pending" | "sent" | "delivered" | "read" | "failed"
  template_name: varchar("template_name", { length: 255 }),
  template_language: varchar("template_language", { length: 50 }),
  provider_message_id: varchar("provider_message_id", { length: 255 }),
  notification_key: varchar("notification_key", { length: 255 }),
  error: text("error"),
  sent_at: timestamp("sent_at"),
  delivered_at: timestamp("delivered_at"),
  read_at: timestamp("read_at"),
  failed_at: timestamp("failed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
});
