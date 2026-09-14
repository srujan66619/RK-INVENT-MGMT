import { pgTable, uuid, varchar, timestamp, text, real, integer } from "drizzle-orm/pg-core";
import { profiles } from "./users";
import { customers, suppliers } from "./customers";
import { repairs } from "./repairs";
import { inventory } from "./inventory";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_no: varchar("invoice_no", { length: 50 }).notNull(),
  customer_id: uuid("customer_id").references(() => customers.id),
  repair_id: uuid("repair_id").references(() => repairs.id),
  subtotal: real("subtotal").notNull(),
  discount: real("discount"),
  tax_rate: real("tax_rate"),
  tax_amount: real("tax_amount"),
  total: real("total").notNull(),
  amount_paid: real("amount_paid"),
  payment_status: varchar("payment_status", { length: 50 }).notNull(), // "paid" | "unpaid" | "partial"
  payment_method: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  owner_id: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_id: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit_price: real("unit_price").notNull(),
  total_price: real("total_price").notNull(),
  warranty: varchar("warranty", { length: 100 }), // e.g. "3 months", "1 year", "No warranty"
  created_at: timestamp("created_at").defaultNow().notNull(),
});


export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  po_number: varchar("po_number", { length: 50 }).notNull(),
  supplier_id: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  total_amount: real("total_amount").notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull(), // "pending" | "received" | "cancelled"
  received_at: timestamp("received_at"),
  owner_id: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  po_id: uuid("po_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  item_id: uuid("item_id")
    .references(() => inventory.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unit_cost: real("unit_cost").notNull(),
  total_cost: real("total_cost").notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  expense_date: timestamp("expense_date").notNull(),
  date: varchar("date", { length: 50 }),
  owner_id: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
