import postgres from "postgres";
import "dotenv/config";

async function enableRLS() {
  const sql = postgres(process.env.DATABASE_URL!);
  const tables = ["bill_of_materials","bom_lines","production_orders","production_order_components","routing_operations"];
  
  for (const t of tables) {
    try {
      await sql.unsafe(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
      await sql.unsafe(`CREATE POLICY "${t}_policy" ON ${t} FOR ALL USING (true)`);
      console.log(`✓ ${t}`);
    } catch (e: any) {
      console.log(`⚠ ${t} - ${e.message?.substring(0, 30) || 'exists'}`);
    }
  }
  
  const [r] = await sql`SELECT COUNT(*) as c FROM pg_tables WHERE schemaname='public' AND rowsecurity=true`;
  console.log(`📊 Total: ${r.c} tables with RLS`);
  await sql.end();
}

enableRLS();
