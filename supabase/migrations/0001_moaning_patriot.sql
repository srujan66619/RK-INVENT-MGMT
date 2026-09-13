ALTER TABLE "customers" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "repairs" ADD COLUMN "technician_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_technician_id_profiles_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;