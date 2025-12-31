
CREATE TABLE "bom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_count_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"count_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"system_qty" numeric(18, 3) DEFAULT '0',
	"counted_qty" numeric(18, 3) DEFAULT '0',
	"variance_qty" numeric(18, 3) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"warehouse_id" uuid NOT NULL,
	"count_number" varchar(50) NOT NULL,
	"count_date" date NOT NULL,
	"description" text,
	"status" "stock_count_status" DEFAULT 'draft' NOT NULL,
	"is_posted" boolean DEFAULT false,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "brands" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attendance" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "brands" CASCADE;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
DROP TABLE "attendance" CASCADE;--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "bom_lines" DROP CONSTRAINT "bom_lines_bom_id_bill_of_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "bom_lines" DROP CONSTRAINT "bom_lines_component_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "item_units" ALTER COLUMN "uom" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "uom" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "uom" SET DEFAULT 'PCS';--> statement-breakpoint
ALTER TABLE "bom_lines" ALTER COLUMN "quantity" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "bom_lines" ALTER COLUMN "uom" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "bom_lines" ALTER COLUMN "uom" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_failed_login" timestamp;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "sub_category_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "model_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "tax_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "warehouse_id" uuid;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD COLUMN "item_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "item_categories" ADD COLUMN "default_uom_id" varchar(20);--> statement-breakpoint
ALTER TABLE "bom" ADD CONSTRAINT "bom_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom" ADD CONSTRAINT "bom_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uoms" ADD CONSTRAINT "uoms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_count_id_stock_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."stock_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_branch_id_companies_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_sub_category_id_item_subcategories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."item_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_brand_id_item_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."item_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_model_id_item_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."item_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_tax_id_taxes_id_fk" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bom_id_bom_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" DROP COLUMN "line_number";--> statement-breakpoint
ALTER TABLE "bom_lines" DROP COLUMN "component_item_id";--> statement-breakpoint
ALTER TABLE "bom_lines" DROP COLUMN "wastage_percent";--> statement-breakpoint
ALTER TABLE "bom_lines" DROP COLUMN "substitutes";--> statement-breakpoint
ALTER TABLE "bom_lines" DROP COLUMN "created_at";--> statement-breakpoint
DROP TYPE "public"."uom";