
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Forcing migration for stock_adjustments...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "stock_adjustments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "company_id" uuid NOT NULL,
        "adjustment_number" varchar(50) NOT NULL,
        "adjustment_date" date NOT NULL,
        "notes" text,
        "status" varchar(20) DEFAULT 'draft' NOT NULL,
        "is_posted" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "created_by" uuid
      );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "stock_adjustment_lines" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "company_id" uuid NOT NULL,
            "adjustment_id" uuid NOT NULL,
            "line_number" integer NOT NULL,
            "item_id" uuid NOT NULL,
            "warehouse_id" uuid NOT NULL,
            "current_qty" numeric(18, 3) DEFAULT '0',
            "adjusted_qty" numeric(18, 3) NOT NULL,
            "variance" numeric(18, 3) NOT NULL,
            "reason" text
        );
    `);
    
    // Add roles if missing too, just in case
    await db.execute(sql`
         CREATE TABLE IF NOT EXISTS "roles" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "company_id" uuid NOT NULL,
            "code" varchar(50) NOT NULL,
            "name" varchar(150) NOT NULL,
            "description" text,
            "permissions" jsonb DEFAULT '[]'::jsonb,
            "is_system_role" boolean DEFAULT false NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
        );
    `);
    
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "user_roles" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "user_id" uuid NOT NULL,
            "role_id" uuid NOT NULL,
            "assigned_at" timestamp DEFAULT now() NOT NULL,
            "assigned_by" uuid
        );
    `);

    console.log("Migration applied successfully (manual).");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

main();
