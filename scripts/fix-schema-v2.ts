// Migration for Attendance and Stock Counts
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running Schema Refactor Migration...');
  
  try {
    // 1. Attendance: Check if exists, if so, nothing to do (it was just moved in code)
    // If not exists, create it.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "attendance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id"),
        "employee_id" uuid NOT NULL REFERENCES "employees"("id"),
        "attendance_date" date NOT NULL,
        "check_in" timestamp,
        "check_out" timestamp,
        "work_hours" numeric(5, 2) DEFAULT '0',
        "overtime_hours" numeric(5, 2) DEFAULT '0',
        "status" varchar(20) DEFAULT 'present' NOT NULL,
        "remarks" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Checked/Created attendance table');

    // 2. Stock Counts: Create if not exists
    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE "stock_count_status" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "stock_counts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id"),
        "branch_id" uuid REFERENCES "branches"("id"),
        "warehouse_id" uuid NOT NULL REFERENCES "warehouses"("id"),
        "count_number" varchar(50) NOT NULL,
        "count_date" date NOT NULL,
        "description" text,
        "status" "stock_count_status" DEFAULT 'draft' NOT NULL,
        "is_posted" boolean DEFAULT false,
        "version" integer DEFAULT 1,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "created_by" uuid,
        "deleted_at" timestamp
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "stock_count_lines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL REFERENCES "companies"("id"),
        "count_id" uuid NOT NULL REFERENCES "stock_counts"("id"),
        "item_id" uuid NOT NULL REFERENCES "items"("id"),
        "system_qty" numeric(18, 3) DEFAULT '0',
        "counted_qty" numeric(18, 3) DEFAULT '0',
        "variance_qty" numeric(18, 3) DEFAULT '0',
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Created stock_counts and lines tables');
    
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  }
  
  process.exit(0);
}

migrate();
