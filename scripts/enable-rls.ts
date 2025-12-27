import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function enableRLS() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl);

  try {
    // Read the RLS migration file
    const migrationPath = path.join(__dirname, "../drizzle/migrations/0001_enable_rls.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    // Split by semicolon and filter empty/comment-only statements
    const statements = migrationSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Found ${statements.length} statements to execute\n`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim() && !stmt.startsWith("--")) {
        const shortStmt = stmt.split("\n")[0].substring(0, 60);
        process.stdout.write(`[${i + 1}/${statements.length}] ${shortStmt}...`);
        
        try {
          await sql.unsafe(stmt);
          console.log(" ✓");
          success++;
        } catch (err: any) {
          if (err.message?.includes("already exists")) {
            console.log(" ⚠ (exists)");
            skipped++;
          } else {
            console.log(` ✗ ${err.message?.substring(0, 50)}`);
            failed++;
          }
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ Success: ${success}`);
    console.log(`⚠️ Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`========================================`);
    
    // Verify RLS status
    console.log("\nVerifying RLS status...");
    const rlsStatus = await sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log("\nTable RLS Status:");
    console.log("─".repeat(40));
    for (const row of rlsStatus) {
      const status = row.rowsecurity ? "✅ ENABLED" : "❌ DISABLED";
      console.log(`${row.tablename.padEnd(25)} ${status}`);
    }

  } catch (error) {
    console.error("RLS migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

enableRLS();
