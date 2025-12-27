CREATE TYPE "public"."journal_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'processing', 'approved', 'paid', 'cancelled');--> statement-breakpoint
CREATE TABLE "asset_depreciation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"period_date" date NOT NULL,
	"depreciation_amount" numeric(18, 2) NOT NULL,
	"accumulated_amount" numeric(18, 2) NOT NULL,
	"book_value" numeric(18, 2) NOT NULL,
	"is_posted" boolean DEFAULT false,
	"journal_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"iban" varchar(34),
	"swift_code" varchar(11),
	"routing_code" varchar(20),
	"currency" varchar(3) DEFAULT 'AED',
	"gl_account_id" uuid,
	"current_balance" numeric(18, 2) DEFAULT '0',
	"last_reconciled_at" timestamp,
	"last_reconciled_balance" numeric(18, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"value_date" date,
	"description" text,
	"reference" varchar(100),
	"debit" numeric(18, 2) DEFAULT '0',
	"credit" numeric(18, 2) DEFAULT '0',
	"balance" numeric(18, 2),
	"is_reconciled" boolean DEFAULT false,
	"reconciled_at" timestamp,
	"matched_journal_id" uuid,
	"import_batch_id" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"period_name" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"locked_at" timestamp,
	"locked_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixed_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"asset_code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(100),
	"subcategory" varchar(100),
	"location" varchar(200),
	"purchase_date" date NOT NULL,
	"purchase_value" numeric(18, 2) NOT NULL,
	"vendor_id" uuid,
	"invoice_number" varchar(50),
	"depreciation_method" varchar(20) DEFAULT 'straight_line',
	"useful_life_months" integer NOT NULL,
	"salvage_value" numeric(18, 2) DEFAULT '0',
	"depreciation_start_date" date,
	"accumulated_depreciation" numeric(18, 2) DEFAULT '0',
	"book_value" numeric(18, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"disposal_date" date,
	"disposal_value" numeric(18, 2),
	"asset_account_id" uuid,
	"depreciation_account_id" uuid,
	"accumulated_dep_account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"journal_number" varchar(50) NOT NULL,
	"journal_date" date NOT NULL,
	"source_doc_type" varchar(20),
	"source_doc_id" uuid,
	"source_doc_number" varchar(50),
	"description" text,
	"total_debit" numeric(18, 2) DEFAULT '0',
	"total_credit" numeric(18, 2) DEFAULT '0',
	"is_reversal" boolean DEFAULT false,
	"reversal_of_id" uuid,
	"status" "journal_status" DEFAULT 'draft' NOT NULL,
	"posted_at" timestamp,
	"posted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"journal_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text,
	"debit" numeric(18, 2) DEFAULT '0',
	"credit" numeric(18, 2) DEFAULT '0',
	"cost_center" varchar(50),
	"project" varchar(50),
	"department" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"loan_number" varchar(50) NOT NULL,
	"loan_date" date NOT NULL,
	"loan_amount" numeric(18, 2) NOT NULL,
	"monthly_deduction" numeric(18, 2) NOT NULL,
	"total_paid" numeric(18, 2) DEFAULT '0',
	"balance" numeric(18, 2) DEFAULT '0',
	"start_month" date NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "eosb_provisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"as_of_date" date NOT NULL,
	"years_of_service" numeric(5, 2) NOT NULL,
	"basic_salary" numeric(18, 2) NOT NULL,
	"eosb_amount" numeric(18, 2) NOT NULL,
	"resignation_type" varchar(20),
	"eosb_percentage" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"request_number" varchar(50) NOT NULL,
	"leave_type" varchar(20) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" numeric(5, 2) NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payroll_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"basic_salary" numeric(18, 2) DEFAULT '0',
	"housing_allowance" numeric(18, 2) DEFAULT '0',
	"transport_allowance" numeric(18, 2) DEFAULT '0',
	"other_allowance" numeric(18, 2) DEFAULT '0',
	"overtime" numeric(18, 2) DEFAULT '0',
	"bonus" numeric(18, 2) DEFAULT '0',
	"total_earnings" numeric(18, 2) DEFAULT '0',
	"absence_deduction" numeric(18, 2) DEFAULT '0',
	"loan_deduction" numeric(18, 2) DEFAULT '0',
	"advance_deduction" numeric(18, 2) DEFAULT '0',
	"other_deduction" numeric(18, 2) DEFAULT '0',
	"total_deductions" numeric(18, 2) DEFAULT '0',
	"net_pay" numeric(18, 2) DEFAULT '0',
	"payment_method" varchar(20),
	"is_paid" boolean DEFAULT false,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"run_number" varchar(50) NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"run_date" date NOT NULL,
	"total_employees" integer DEFAULT 0,
	"total_basic_salary" numeric(18, 2) DEFAULT '0',
	"total_allowances" numeric(18, 2) DEFAULT '0',
	"total_deductions" numeric(18, 2) DEFAULT '0',
	"total_net_pay" numeric(18, 2) DEFAULT '0',
	"wps_file_generated" boolean DEFAULT false,
	"wps_batch_number" varchar(50),
	"status" "payroll_status" DEFAULT 'draft' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "asset_depreciation" ADD CONSTRAINT "asset_depreciation_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciation" ADD CONSTRAINT "asset_depreciation_asset_id_fixed_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."fixed_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciation" ADD CONSTRAINT "asset_depreciation_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_gl_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_matched_journal_id_journal_entries_id_fk" FOREIGN KEY ("matched_journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_asset_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("asset_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_depreciation_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("depreciation_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_accumulated_dep_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("accumulated_dep_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eosb_provisions" ADD CONSTRAINT "eosb_provisions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eosb_provisions" ADD CONSTRAINT "eosb_provisions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;