CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"variables" jsonb DEFAULT '[]',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "print_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"document_type" varchar(20) NOT NULL,
	"html_template" text NOT NULL,
	"css_styles" text,
	"settings" jsonb DEFAULT '{"paperSize":"A4","orientation":"portrait","margin":"20mm","includeLogo":true,"includeBankDetails":true,"includeSignature":true,"showSKU":false}',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "purchase_type" varchar(50) DEFAULT 'vat_item_wise';--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "payment_type" varchar(50) DEFAULT 'credit';--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "warehouse_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "shipping_address" text;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "bill_sundry" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "terms_and_conditions" text;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD COLUMN "task_id" uuid;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;