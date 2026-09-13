CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"amount" real NOT NULL,
	"expense_date" timestamp NOT NULL,
	"date" varchar(50),
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" real NOT NULL,
	"total_price" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_no" varchar(50) NOT NULL,
	"customer_id" uuid,
	"repair_id" uuid,
	"subtotal" real NOT NULL,
	"discount" real,
	"tax_rate" real,
	"tax_amount" real,
	"total" real NOT NULL,
	"amount_paid" real,
	"payment_status" varchar(50) NOT NULL,
	"payment_method" varchar(50),
	"notes" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" real NOT NULL,
	"total_cost" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"total_amount" real NOT NULL,
	"notes" text,
	"status" varchar(50) NOT NULL,
	"received_at" timestamp,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"whatsapp" varchar(50),
	"email" varchar(255),
	"address" text,
	"notes" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"gst_number" varchar(100),
	"notes" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"requested_role" varchar(50) DEFAULT 'user' NOT NULL,
	"approval_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"approved_by" uuid,
	"rejection_reason" text,
	"shop_name" varchar(255),
	"shop_address" text,
	"shop_phone" varchar(50),
	"shop_logo" text,
	"gst_number" varchar(100),
	"gst_percent" integer,
	"wa_templates" jsonb,
	"auto_reminders" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"category" varchar(100),
	"cost_price" real NOT NULL,
	"selling_price" real NOT NULL,
	"stock_level" integer DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_stock_level" integer,
	"location" varchar(255),
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(100),
	"notes" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"notes" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_id" uuid NOT NULL,
	"note" text NOT NULL,
	"technician_name" varchar(255),
	"task_done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_no" varchar(50) NOT NULL,
	"customer_id" uuid,
	"device_type" varchar(100),
	"device_brand" varchar(100),
	"device_model" varchar(100),
	"imei" varchar(50),
	"issue" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"technician_notes" text,
	"estimated_completion" timestamp,
	"estimated_cost" real,
	"final_cost" real,
	"appointment_at" timestamp,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"repair_id" uuid,
	"invoice_id" uuid,
	"kind" varchar(50) NOT NULL,
	"recipient_name" varchar(255),
	"phone" varchar(50),
	"message" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_inventory_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_inventory_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_notes" ADD CONSTRAINT "repair_notes_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD CONSTRAINT "wa_logs_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD CONSTRAINT "wa_logs_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD CONSTRAINT "wa_logs_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;