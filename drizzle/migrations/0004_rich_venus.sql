CREATE TYPE "public"."document_module" AS ENUM('sales', 'purchase', 'inventory', 'finance', 'hr', 'project', 'asset');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_type_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"header_html" text,
	"body_html" text,
	"footer_html" text,
	"page_size" varchar(10) DEFAULT 'A4',
	"orientation" varchar(10) DEFAULT 'portrait',
	"margins" jsonb DEFAULT '{"top":20,"right":20,"bottom":20,"left":20}'::jsonb,
	"show_logo" boolean DEFAULT true,
	"show_trn" boolean DEFAULT true,
	"show_bank_details" boolean DEFAULT true,
	"show_terms" boolean DEFAULT true,
	"show_signature" boolean DEFAULT false,
	"language" varchar(2) DEFAULT 'en',
	"is_bilingual" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"module" "document_module" NOT NULL,
	"requires_approval" boolean DEFAULT false,
	"requires_attachment" boolean DEFAULT false,
	"allow_backdate" boolean DEFAULT false,
	"allow_future_date" boolean DEFAULT false,
	"allow_edit" boolean DEFAULT true,
	"allow_cancel" boolean DEFAULT true,
	"source_doc_types" text[],
	"target_doc_types" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terms_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"document_type_id" uuid,
	"content" text NOT NULL,
	"content_ar" text,
	"sequence" varchar(5) DEFAULT '1',
	"is_mandatory" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_conditions" ADD CONSTRAINT "terms_conditions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_conditions" ADD CONSTRAINT "terms_conditions_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;