CREATE TYPE "public"."kpi_frequency" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."tax_return_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'amended');--> statement-breakpoint
CREATE TABLE "kpi_actuals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"kpi_id" uuid NOT NULL,
	"target_id" uuid,
	"branch_id" uuid,
	"employee_id" uuid,
	"period_date" date NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_number" integer,
	"actual_value" numeric(18, 2) NOT NULL,
	"target_value" numeric(18, 2),
	"achievement_percent" numeric(8, 2),
	"score" numeric(5, 2),
	"rating" varchar(20),
	"source_doc_type" varchar(50),
	"source_doc_id" uuid,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"category_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"unit" varchar(20),
	"data_type" varchar(20) DEFAULT 'number',
	"frequency" "kpi_frequency" DEFAULT 'monthly',
	"target_direction" varchar(10) DEFAULT 'higher',
	"formula" text,
	"data_source" varchar(100),
	"weight" numeric(5, 2) DEFAULT '1',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_scorecards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"employee_id" uuid,
	"fiscal_year" integer NOT NULL,
	"period_number" integer,
	"total_score" numeric(8, 2),
	"weighted_score" numeric(8, 2),
	"overall_rating" varchar(20),
	"category_scores" jsonb,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"kpi_id" uuid NOT NULL,
	"branch_id" uuid,
	"employee_id" uuid,
	"fiscal_year" integer NOT NULL,
	"period_number" integer,
	"target_value" numeric(18, 2) NOT NULL,
	"min_value" numeric(18, 2),
	"max_value" numeric(18, 2),
	"excellent_threshold" numeric(18, 2),
	"good_threshold" numeric(18, 2),
	"poor_threshold" numeric(18, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_number" varchar(100),
	"issuing_authority" varchar(100),
	"issue_date" date,
	"expiry_date" date,
	"file_path" text,
	"file_name" varchar(200),
	"reminder_days" integer DEFAULT 30,
	"is_expired" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_tax_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"return_number" varchar(50) NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_from" date NOT NULL,
	"period_to" date NOT NULL,
	"due_date" date NOT NULL,
	"gross_revenue" numeric(18, 2) DEFAULT '0',
	"allowable_deductions" numeric(18, 2) DEFAULT '0',
	"taxable_income" numeric(18, 2) DEFAULT '0',
	"exempt_amount" numeric(18, 2) DEFAULT '375000',
	"taxable_above_exempt" numeric(18, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '9',
	"tax_payable" numeric(18, 2) DEFAULT '0',
	"status" "tax_return_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "einvoice_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_type" varchar(20) NOT NULL,
	"document_id" uuid NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"uuid" varchar(50),
	"qr_code" text,
	"hash" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp,
	"response" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "period_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"module" varchar(50) NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"lock_type" varchar(20) DEFAULT 'soft' NOT NULL,
	"locked_at" timestamp NOT NULL,
	"locked_by" uuid NOT NULL,
	"unlock_reason" text,
	"unlocked_at" timestamp,
	"unlocked_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vat_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"return_number" varchar(50) NOT NULL,
	"period_from" date NOT NULL,
	"period_to" date NOT NULL,
	"due_date" date NOT NULL,
	"standard_rated_sales" numeric(18, 2) DEFAULT '0',
	"standard_rated_vat" numeric(18, 2) DEFAULT '0',
	"zero_rated_sales" numeric(18, 2) DEFAULT '0',
	"exempt_sales" numeric(18, 2) DEFAULT '0',
	"standard_rated_purchases" numeric(18, 2) DEFAULT '0',
	"input_vat" numeric(18, 2) DEFAULT '0',
	"net_vat_due" numeric(18, 2) DEFAULT '0',
	"vat_refundable" numeric(18, 2) DEFAULT '0',
	"status" "tax_return_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"fta_reference_no" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "wps_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"payroll_run_id" uuid,
	"file_name" varchar(200) NOT NULL,
	"file_path" text,
	"file_format" varchar(10) DEFAULT 'SIF',
	"total_employees" integer DEFAULT 0,
	"total_amount" numeric(18, 2) DEFAULT '0',
	"bank_name" varchar(100),
	"reference_number" varchar(50),
	"submitted_at" timestamp,
	"status" varchar(20) DEFAULT 'generated' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kpi_actuals" ADD CONSTRAINT "kpi_actuals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_actuals" ADD CONSTRAINT "kpi_actuals_kpi_id_kpi_master_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpi_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_actuals" ADD CONSTRAINT "kpi_actuals_target_id_kpi_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."kpi_targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_actuals" ADD CONSTRAINT "kpi_actuals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_actuals" ADD CONSTRAINT "kpi_actuals_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_categories" ADD CONSTRAINT "kpi_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_master" ADD CONSTRAINT "kpi_master_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_master" ADD CONSTRAINT "kpi_master_category_id_kpi_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kpi_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scorecards" ADD CONSTRAINT "kpi_scorecards_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scorecards" ADD CONSTRAINT "kpi_scorecards_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scorecards" ADD CONSTRAINT "kpi_scorecards_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_kpi_id_kpi_master_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpi_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_tax_returns" ADD CONSTRAINT "corporate_tax_returns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "einvoice_log" ADD CONSTRAINT "einvoice_log_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_locks" ADD CONSTRAINT "period_locks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_locks" ADD CONSTRAINT "period_locks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vat_returns" ADD CONSTRAINT "vat_returns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wps_files" ADD CONSTRAINT "wps_files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;