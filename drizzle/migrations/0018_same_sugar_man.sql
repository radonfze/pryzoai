ALTER TABLE "purchase_invoices" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "version" integer DEFAULT 1;