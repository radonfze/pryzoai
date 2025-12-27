import { db } from "../src/db";
import { companies, users, numberSeries, auditLogs } from "../src/db/schema";
import { sql } from "drizzle-orm";
import "dotenv/config";

async function verifySchema() {
  console.log("Verifying database schema...\n");

  try {
    // Check tables exist by querying them
    const tables = [
      { name: "companies", table: companies },
      { name: "users", table: users },
      { name: "number_series", table: numberSeries },
      { name: "audit_logs", table: auditLogs },
    ];

    for (const { name, table } of tables) {
      try {
        const result = await db.select().from(table).limit(1);
        console.log(`✓ ${name} table exists (${result.length} rows)`);
      } catch (err: any) {
        console.log(`✗ ${name} table error: ${err.message}`);
      }
    }

    // Get table count from information_schema
    const tableCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    console.log(`\n📊 Total tables in public schema: ${tableCount[0]?.count || "unknown"}`);
    console.log("\n✅ Schema verification complete!");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

verifySchema();
