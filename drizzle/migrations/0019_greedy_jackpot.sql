ALTER TABLE "sales_invoices" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "version" integer DEFAULT 1;