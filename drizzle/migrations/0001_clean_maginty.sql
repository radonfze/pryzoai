CREATE TYPE "public"."customer_type" AS ENUM('individual', 'corporate', 'government', 'retail');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('local', 'international', 'manufacturer', 'distributor', 'service_provider');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('stock', 'service', 'expense', 'fixed_asset');--> statement-breakpoint
CREATE TYPE "public"."uom" AS ENUM('PCS', 'NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'HRS', 'DAYS');--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"address_type" varchar(20) DEFAULT 'billing',
	"label" varchar(50),
	"address" text NOT NULL,
	"city" varchar(100),
	"country" varchar(3) DEFAULT 'AE',
	"postal_code" varchar(20),
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"designation" varchar(100),
	"email" varchar(255),
	"phone" varchar(20),
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_ar" varchar(150),
	"customer_type" "customer_type" DEFAULT 'corporate' NOT NULL,
	"trn" varchar(15),
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"address" text,
	"city" varchar(100),
	"country" varchar(3) DEFAULT 'AE',
	"credit_limit" numeric(18, 2) DEFAULT '0',
	"payment_term_days" numeric(5, 0) DEFAULT '30',
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"default_currency" varchar(3) DEFAULT 'AED',
	"preferred_language" varchar(2) DEFAULT 'en',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "supplier_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"designation" varchar(100),
	"email" varchar(255),
	"phone" varchar(20),
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_ar" varchar(150),
	"supplier_type" "supplier_type" DEFAULT 'local' NOT NULL,
	"trn" varchar(15),
	"email" varchar(255),
	"phone" varchar(20),
	"mobile" varchar(20),
	"address" text,
	"city" varchar(100),
	"country" varchar(3) DEFAULT 'AE',
	"credit_limit" numeric(18, 2) DEFAULT '0',
	"payment_term_days" numeric(5, 0) DEFAULT '30',
	"withholding_tax_percent" numeric(5, 2) DEFAULT '0',
	"bank_name" varchar(100),
	"bank_account_no" varchar(50),
	"bank_iban" varchar(34),
	"bank_swift" varchar(11),
	"default_currency" varchar(3) DEFAULT 'AED',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"uom" "uom" NOT NULL,
	"conversion_factor" numeric(18, 6) DEFAULT '1',
	"barcode" varchar(50),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"barcode" varchar(50),
	"name" varchar(200) NOT NULL,
	"name_ar" varchar(200),
	"description" text,
	"item_type" "item_type" DEFAULT 'stock' NOT NULL,
	"category_id" uuid,
	"brand_id" uuid,
	"uom" "uom" DEFAULT 'PCS' NOT NULL,
	"cost_price" numeric(18, 2) DEFAULT '0',
	"selling_price" numeric(18, 2) DEFAULT '0',
	"min_selling_price" numeric(18, 2) DEFAULT '0',
	"tax_percent" numeric(5, 2) DEFAULT '5',
	"is_taxable" boolean DEFAULT true NOT NULL,
	"reorder_level" numeric(18, 3) DEFAULT '0',
	"reorder_qty" numeric(18, 3) DEFAULT '0',
	"has_serial_no" boolean DEFAULT false,
	"has_batch_no" boolean DEFAULT false,
	"has_expiry" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_units" ADD CONSTRAINT "item_units_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;