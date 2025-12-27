CREATE TYPE "public"."account_group" AS ENUM('cash_bank', 'accounts_receivable', 'inventory', 'fixed_assets', 'other_assets', 'accounts_payable', 'customer_advance', 'supplier_advance', 'tax_payable', 'other_liabilities', 'capital', 'retained_earnings', 'sales_revenue', 'service_revenue', 'other_income', 'cost_of_goods', 'operating_expense', 'payroll_expense', 'depreciation', 'other_expense');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('standard', 'zero_rated', 'exempt', 'out_of_scope', 'reverse_charge');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'on_leave', 'resigned', 'terminated', 'probation');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_ar" varchar(150),
	"account_type" "account_type" NOT NULL,
	"account_group" "account_group" NOT NULL,
	"parent_id" uuid,
	"level" integer DEFAULT 1 NOT NULL,
	"opening_balance" numeric(18, 2) DEFAULT '0',
	"current_balance" numeric(18, 2) DEFAULT '0',
	"is_control_account" boolean DEFAULT false,
	"is_system_account" boolean DEFAULT false,
	"is_bank_account" boolean DEFAULT false,
	"is_cash_account" boolean DEFAULT false,
	"allow_manual_entry" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(50) NOT NULL,
	"symbol" varchar(5) NOT NULL,
	"exchange_rate" numeric(18, 6) DEFAULT '1',
	"is_base_currency" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"days" numeric(5, 0) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"discount_days" numeric(5, 0) DEFAULT '0',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency_id" uuid,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"markup_percent" numeric(5, 2) DEFAULT '0',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"tax_type" "tax_type" NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"fta_code" varchar(10),
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"code" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"first_name_ar" varchar(100),
	"last_name_ar" varchar(100),
	"gender" "gender",
	"date_of_birth" date,
	"nationality" varchar(50),
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"address" text,
	"designation" varchar(100),
	"department" varchar(100),
	"joining_date" date NOT NULL,
	"probation_end_date" date,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"emirates_id" varchar(18),
	"passport_no" varchar(20),
	"passport_expiry" date,
	"visa_no" varchar(30),
	"visa_expiry" date,
	"labor_card_no" varchar(30),
	"labor_card_expiry" date,
	"basic_salary" numeric(18, 2) DEFAULT '0',
	"housing_allowance" numeric(18, 2) DEFAULT '0',
	"transport_allowance" numeric(18, 2) DEFAULT '0',
	"other_allowance" numeric(18, 2) DEFAULT '0',
	"bank_name" varchar(100),
	"bank_account_no" varchar(50),
	"bank_iban" varchar(34),
	"routing_code" varchar(20),
	"annual_leave_balance" numeric(5, 2) DEFAULT '0',
	"sick_leave_balance" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_terms" ADD CONSTRAINT "payment_terms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;