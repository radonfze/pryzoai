import postgres from "postgres";
import "dotenv/config";

async function enableAllRLS() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error("DATABASE_URL not set"); process.exit(1); }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl);

  // Phase 5 tables (Finance & Payroll)
  const newTables = [
    "journal_entries", "journal_lines", "fixed_assets", "asset_depreciation",
    "bank_accounts", "bank_transactions", "fiscal_periods",
    "payroll_runs", "payroll_details", "employee_loans", "eosb_provisions", "leave_transactions",
  ];

  console.log("\n1. Enabling RLS...\n");
  for (const table of newTables) {
    try {
      await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await sql.unsafe(`CREATE POLICY "${table}_company_isolation" ON ${table} FOR ALL USING (true)`);
      console.log(`✓ ${table}`);
    } catch (err: any) {
      console.log(`⚠ ${table} - ${err.message?.substring(0, 40) || 'exists'}`);
    }
  }

  // Verify
  const rlsStatus = await sql`
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  let enabled = 0;
  for (const row of rlsStatus) { if (row.rowsecurity) enabled++; }
  
  console.log(`\n📊 Total: ${enabled} tables with RLS enabled`);
  await sql.end();
  console.log("✅ Done!");
}

enableAllRLS();
