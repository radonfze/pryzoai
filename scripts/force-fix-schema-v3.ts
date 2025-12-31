import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting Manual Schema Fix...");
    try {
        await db.execute(sql`
            -- Create UOMS
            CREATE TABLE IF NOT EXISTS "uoms" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "company_id" uuid NOT NULL,
                "code" varchar(20) NOT NULL,
                "name" varchar(50) NOT NULL,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            -- Create Hierarchy Tables if missing
            CREATE TABLE IF NOT EXISTS "item_categories" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "company_id" uuid NOT NULL,
                "code" varchar(20) NOT NULL,
                "name" varchar(150) NOT NULL,
                "name_ar" varchar(150),
                "description" text,
                "sort_order" integer DEFAULT 0,
                "default_uom_id" varchar(20),
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "item_subcategories" (
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

            CREATE TABLE IF NOT EXISTS "item_brands" (
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

            CREATE TABLE IF NOT EXISTS "item_models" (
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

            -- Create BOM
            CREATE TABLE IF NOT EXISTS "bom" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "company_id" uuid NOT NULL,
                "item_id" uuid NOT NULL,
                "name" varchar(100) NOT NULL,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            -- Create BOM LINES
            CREATE TABLE IF NOT EXISTS "bom_lines" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "company_id" uuid NOT NULL,
                "bom_id" uuid NOT NULL,
                "item_id" uuid NOT NULL,
                "quantity" numeric(18, 4) NOT NULL,
                "uom" varchar(20),
                "notes" text
            );

            -- Create STOCK COUNTS (if missing)
            CREATE TABLE IF NOT EXISTS "stock_counts" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "company_id" uuid NOT NULL,
                "branch_id" uuid,
                "warehouse_id" uuid NOT NULL,
                "count_number" varchar(50) NOT NULL,
                "count_date" date NOT NULL,
                "description" text,
                "status" varchar(50) DEFAULT 'draft' NOT NULL, 
                "is_posted" boolean DEFAULT false,
                "version" integer DEFAULT 1,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL,
                "created_by" uuid,
                "deleted_at" timestamp
            );
             CREATE TABLE IF NOT EXISTS "stock_count_lines" (
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

            -- Alter Items
            ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "tax_id" uuid;
            ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "sub_category_id" uuid;
            ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "model_id" uuid;
            
            -- Alter Items UOM type (Might fail if already exists with diff type, assume it works or is handled)
            -- We'll try to set default uom to PCS if missing
            -- ALTER TABLE "items" ALTER COLUMN "uom" TYPE varchar(20); -- This is risky if enum, let's skip unless needed

            -- Alter Sales Invoices
            ALTER TABLE "sales_invoices" ADD COLUMN IF NOT EXISTS "warehouse_id" uuid;

            -- Alter Item Categories
            ALTER TABLE "item_categories" ADD COLUMN IF NOT EXISTS "default_uom_id" varchar(20);

            -- Add brand_subcategories if missing
            CREATE TABLE IF NOT EXISTS "brand_subcategories" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "brand_id" uuid NOT NULL,
                "subcategory_id" uuid NOT NULL
            );

        `);
        console.log("Forced schema creation completed successfully.");
    } catch (e) {
        console.error("Manual Fix Failed:", e);
    }
    process.exit(0);
}

main();
