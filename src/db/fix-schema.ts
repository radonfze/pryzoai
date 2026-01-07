import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('Connecting to database for manual fix...');
  const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: { rejectUnauthorized: false } });

  try {
    console.log('1. Fixing Enums...');
    await sql`
      DO $$ BEGIN
        ALTER TYPE "public"."sales_status" ADD VALUE 'posted';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    await sql`
        DO $$ BEGIN
            ALTER TYPE "public"."purchase_status" ADD VALUE 'posted';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `;

    console.log('2. Adding Columns...');
    await sql`ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "is_group" boolean DEFAULT false`;
    await sql`ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "type" "item_type" DEFAULT 'stock' NOT NULL`;

    console.log('3. Migrating Data...');
    // We try to update 'type' from 'item_type'. 
    // If 'item_type' column doesn't exist (already dropped), this might fail, so wrap in try/catch check or just simple update (will fail if col missing)
    try {
        await sql`UPDATE "items" SET "type" = "item_type"`;
        console.log('   Data migrated successfully.');
    } catch (e) {
        console.log('   Warning: Could not migrate data (item_type might be missing):', e.message);
    }

    console.log('4. Dropping old column...');
    await sql`ALTER TABLE "items" DROP COLUMN IF EXISTS "item_type"`;

    console.log('Schema Fix Completed!');

  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await sql.end();
  }
}

fixSchema();
