ALTER TABLE "sales_invoices" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD COLUMN "deleted_at" timestamp;