ALTER TYPE "public"."sales_status" ADD VALUE 'pending_approval' BEFORE 'issued';--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE 'pending_approval' BEFORE 'issued';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "currencies" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "currencies" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "payment_terms" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "payment_terms" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "price_lists" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "price_lists" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "bill_of_materials" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "kpi_master" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "kpi_master" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "vat_returns" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "vat_returns" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD COLUMN "version" integer DEFAULT 1;