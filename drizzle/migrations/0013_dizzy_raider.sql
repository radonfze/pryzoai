CREATE TYPE "public"."approval_rule_type" AS ENUM('AMOUNT_THRESHOLD', 'DOCUMENT_TYPE', 'DEPARTMENT', 'ALWAYS');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('draft', 'active', 'depreciating', 'fully_depreciated', 'disposed', 'sold', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('straight_line', 'declining_balance', 'double_declining', 'sum_of_years', 'units_of_production');--> statement-breakpoint
CREATE TYPE "public"."warranty_status" AS ENUM('received', 'inspected', 'approved_repair', 'approved_replace', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."ai_action" AS ENUM('create', 'read', 'update', 'delete', 'approve', 'reject');--> statement-breakpoint
CREATE TABLE "default_gl_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"mapping_key" varchar(50) NOT NULL,
	"account_id" uuid,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"transfer_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"uom" varchar(20) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"transfer_number" varchar(50) NOT NULL,
	"from_warehouse_id" uuid NOT NULL,
	"to_warehouse_id" uuid NOT NULL,
	"transfer_date" date NOT NULL,
	"reference" varchar(100),
	"notes" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "stock_transfers_transfer_number_unique" UNIQUE("transfer_number")
);
--> statement-breakpoint
CREATE TABLE "approval_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"step_id" uuid,
	"action_by" uuid,
	"action" text NOT NULL,
	"comments" text,
	"action_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"document_id" uuid NOT NULL,
	"document_number" varchar(50),
	"rule_id" uuid,
	"current_step" integer DEFAULT 1,
	"status" "approval_status" DEFAULT 'PENDING',
	"requested_by" uuid,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "approval_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"document_type" text NOT NULL,
	"rule_type" "approval_rule_type" NOT NULL,
	"min_amount" integer,
	"max_amount" integer,
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"approver_id" uuid,
	"role_name" varchar(100),
	"is_required" boolean DEFAULT true,
	"auto_approve_after_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "period_lockdown" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"locked_date" timestamp NOT NULL,
	"locked_by" uuid,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "brand_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_ar" varchar(150),
	"logo_url" text,
	"website" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_ar" varchar(150),
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"name_ar" varchar(200),
	"description" text,
	"specifications" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_ar" varchar(150),
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"asset_account_id" uuid,
	"accumulated_depreciation_account_id" uuid,
	"depreciation_expense_account_id" uuid,
	"depreciation_method" "depreciation_method" DEFAULT 'straight_line',
	"default_useful_life" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_depreciation_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"schedule_date" date NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"is_posted" boolean DEFAULT false,
	"journal_entry_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranty_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"customer_id" uuid NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"claim_date" timestamp DEFAULT now() NOT NULL,
	"invoice_id" uuid,
	"item_id" uuid NOT NULL,
	"serial_number" varchar(100),
	"issue_description" text NOT NULL,
	"photos" jsonb,
	"status" "warranty_status" DEFAULT 'received' NOT NULL,
	"decision" varchar(20),
	"decision_reason" text,
	"approved_by" uuid,
	"replacement_serial_number" varchar(100),
	"service_ticket_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "technician_job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"work_order_id" uuid,
	"task_id" uuid,
	"is_downloaded" boolean DEFAULT false,
	"last_synced_at" timestamp,
	"mobile_status" varchar(20),
	"mobile_notes" text,
	"mobile_signature" text,
	"is_dirty" boolean DEFAULT false,
	"scheduled_start" timestamp,
	"priority" varchar(10) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_ai_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"action_type" "ai_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(50),
	"prompt" text,
	"ai_response" text,
	"executed_code" text,
	"status" varchar(20) DEFAULT 'success',
	"blocked_reason" text,
	"performed_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copilot_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"policy_name" varchar(100) NOT NULL,
	"description" text,
	"module" varchar(50) NOT NULL,
	"action" "ai_action" NOT NULL,
	"requires_approval" boolean DEFAULT false,
	"approval_threshold" numeric(18, 2),
	"max_daily_actions" numeric(5, 0),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "sales_invoices" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sales_invoices" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "sales_quotations" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sales_quotations" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "sales_returns" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sales_returns" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."sales_status";--> statement-breakpoint
CREATE TYPE "public"."sales_status" AS ENUM('draft', 'sent', 'issued', 'partial', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "sales_invoices" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_invoices" ALTER COLUMN "status" SET DATA TYPE "public"."sales_status" USING "status"::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DATA TYPE "public"."sales_status" USING "status"::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_quotations" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_quotations" ALTER COLUMN "status" SET DATA TYPE "public"."sales_status" USING "status"::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_returns" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "sales_returns" ALTER COLUMN "status" SET DATA TYPE "public"."sales_status" USING "status"::"public"."sales_status";--> statement-breakpoint
ALTER TABLE "goods_receipts" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "goods_receipts" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "purchase_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "purchase_requests" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "purchase_returns" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "purchase_returns" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."purchase_status";--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('draft', 'sent', 'issued', 'partial', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "goods_receipts" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "goods_receipts" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_status" USING "status"::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_invoices" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_invoices" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_status" USING "status"::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_status" USING "status"::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_requests" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_requests" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_status" USING "status"::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_returns" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "purchase_returns" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_status" USING "status"::"public"."purchase_status";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD COLUMN "visit_frequency" varchar(20) DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD COLUMN "sla_response_time" integer DEFAULT 24;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD COLUMN "sla_resolution_time" integer DEFAULT 48;--> statement-breakpoint
ALTER TABLE "default_gl_accounts" ADD CONSTRAINT "default_gl_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "default_gl_accounts" ADD CONSTRAINT "default_gl_accounts_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_step_id_approval_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."approval_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_action_by_users_id_fk" FOREIGN KEY ("action_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_rule_id_approval_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."approval_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_rule_id_approval_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."approval_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_lockdown" ADD CONSTRAINT "period_lockdown_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_lockdown" ADD CONSTRAINT "period_lockdown_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_subcategories" ADD CONSTRAINT "brand_subcategories_brand_id_item_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."item_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_subcategories" ADD CONSTRAINT "brand_subcategories_subcategory_id_item_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."item_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_brands" ADD CONSTRAINT "item_brands_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_models" ADD CONSTRAINT "item_models_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_models" ADD CONSTRAINT "item_models_brand_id_item_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."item_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_models" ADD CONSTRAINT "item_models_subcategory_id_item_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."item_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_subcategories" ADD CONSTRAINT "item_subcategories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_subcategories" ADD CONSTRAINT "item_subcategories_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_asset_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_accumulated_depreciation_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("accumulated_depreciation_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_depreciation_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("depreciation_expense_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciation_schedule" ADD CONSTRAINT "asset_depreciation_schedule_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciation_schedule" ADD CONSTRAINT "asset_depreciation_schedule_asset_id_fixed_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."fixed_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_job_queue" ADD CONSTRAINT "technician_job_queue_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_job_queue" ADD CONSTRAINT "technician_job_queue_technician_id_employees_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_job_queue" ADD CONSTRAINT "technician_job_queue_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_job_queue" ADD CONSTRAINT "technician_job_queue_task_id_project_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_ai_actions" ADD CONSTRAINT "audit_ai_actions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_ai_actions" ADD CONSTRAINT "audit_ai_actions_performed_by_user_id_users_id_fk" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_policies" ADD CONSTRAINT "copilot_policies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;