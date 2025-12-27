import postgres from "postgres";
import "dotenv/config";

async function enableRLS() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  // Phase 10 + 11 tables
  const tables = [
    "kpi_categories", "kpi_master", "kpi_targets", "kpi_actuals", "kpi_scorecards",
    "vat_returns", "corporate_tax_returns", "compliance_documents", "period_locks", "einvoice_log", "wps_files"
  ];
  
  for (const t of tables) {
    try {
      await sql.unsafe(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
      await sql.unsafe(`CREATE POLICY "${t}_policy" ON ${t} FOR ALL USING (true)`);
      console.log(`✓ ${t}`);
    } catch (e: any) {
      console.log(`⚠ ${t}`);
    }
  }
  
  const [r] = await sql`SELECT COUNT(*) as c FROM pg_tables WHERE schemaname='public' AND rowsecurity=true`;
  console.log(`\n📊 Total: ${r.c} tables with RLS`);
  await sql.end();
}

enableRLS();
