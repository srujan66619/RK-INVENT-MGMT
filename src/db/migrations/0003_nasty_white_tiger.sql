ALTER TABLE "wa_logs" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "template_language" varchar(50);--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "notification_key" varchar(255);--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "failed_at" timestamp;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "wa_logs" ADD CONSTRAINT "wa_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;