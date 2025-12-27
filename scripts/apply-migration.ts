import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function applyMigration(migrationFile?: string) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  // Get migration file from args or use latest
  const migrationsDir = path.join(__dirname, "../drizzle/migrations");
  let migrationPath: string;
  
  if (migrationFile) {
    migrationPath = path.join(migrationsDir, migrationFile);
  } else {
    // Find the latest migration file
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error("No migration files found");
      process.exit(1);
    }
    
    migrationPath = path.join(migrationsDir, files[0]);
    console.log(`Using latest migration: ${files[0]}`);
  }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl);

  try {
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    // Split by statement breakpoint and execute each statement
    const statements = migrationSql
      .split("-->")
      .map((s) => s.replace("statement-breakpoint", "").trim())
      .filter((s) => s.length > 0);

    console.log(`Found ${statements.length} statements to execute`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          await sql.unsafe(stmt);
          console.log(`  ✓ Success`);
          success++;
        } catch (err: any) {
          if (err.message?.includes("already exists")) {
            console.log(`  ⚠ Skipped (already exists)`);
            skipped++;
          } else {
            console.error(`  ✗ Error: ${err.message}`);
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
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];
applyMigration(migrationFile);
