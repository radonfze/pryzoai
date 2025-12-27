CREATE TYPE "public"."bom_status" AS ENUM('draft', 'active', 'obsolete');--> statement-breakpoint
CREATE TABLE "bill_of_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bom_code" varchar(50) NOT NULL,
	"bom_name" varchar(200) NOT NULL,
	"finished_item_id" uuid NOT NULL,
	"output_quantity" numeric(18, 3) DEFAULT '1',
	"uom" varchar(10) NOT NULL,
	"version" integer DEFAULT 1,
	"effective_from" date,
	"effective_to" date,
	"labor_cost" numeric(18, 2) DEFAULT '0',
	"overhead_cost" numeric(18, 2) DEFAULT '0',
	"total_cost" numeric(18, 2) DEFAULT '0',
	"status" "bom_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "bom_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bom_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"component_item_id" uuid NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"uom" varchar(10) NOT NULL,
	"wastage_percent" numeric(5, 2) DEFAULT '0',
	"substitutes" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_order_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"production_order_id" uuid NOT NULL,
	"component_item_id" uuid NOT NULL,
	"required_quantity" numeric(18, 3) NOT NULL,
	"issued_quantity" numeric(18, 3) DEFAULT '0',
	"uom" varchar(10) NOT NULL,
	"batch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"warehouse_id" uuid,
	"order_number" varchar(50) NOT NULL,
	"order_date" date NOT NULL,
	"bom_id" uuid NOT NULL,
	"finished_item_id" uuid NOT NULL,
	"planned_quantity" numeric(18, 3) NOT NULL,
	"produced_quantity" numeric(18, 3) DEFAULT '0',
	"scrap_quantity" numeric(18, 3) DEFAULT '0',
	"planned_start_date" date,
	"planned_end_date" date,
	"actual_start_date" date,
	"actual_end_date" date,
	"planned_cost" numeric(18, 2) DEFAULT '0',
	"actual_cost" numeric(18, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "routing_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bom_id" uuid,
	"production_order_id" uuid,
	"operation_number" integer NOT NULL,
	"operation_name" varchar(100) NOT NULL,
	"work_center" varchar(50),
	"setup_time" numeric(8, 2) DEFAULT '0',
	"run_time" numeric(8, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'pending',
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_finished_item_id_items_id_fk" FOREIGN KEY ("finished_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bom_id_bill_of_materials_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bill_of_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_component_item_id_items_id_fk" FOREIGN KEY ("component_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_components" ADD CONSTRAINT "production_order_components_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_components" ADD CONSTRAINT "production_order_components_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_components" ADD CONSTRAINT "production_order_components_component_item_id_items_id_fk" FOREIGN KEY ("component_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_bom_id_bill_of_materials_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bill_of_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_finished_item_id_items_id_fk" FOREIGN KEY ("finished_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_bom_id_bill_of_materials_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bill_of_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;