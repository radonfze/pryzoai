import postgres from "postgres";
import "dotenv/config";

async function addRLSPolicies() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl);

  const policies = [
    // Companies
    {
      name: "companies_select_own",
      table: "companies",
      sql: `CREATE POLICY "companies_select_own" ON companies FOR SELECT USING (id::text = coalesce(auth.jwt()->>'company_id', id::text))`
    },
    // Branches
    {
      name: "branches_company_isolation",
      table: "branches", 
      sql: `CREATE POLICY "branches_company_isolation" ON branches FOR ALL USING (company_id::text = coalesce(auth.jwt()->>'company_id', company_id::text))`
    },
    // Warehouses
    {
      name: "warehouses_company_isolation",
      table: "warehouses",
      sql: `CREATE POLICY "warehouses_company_isolation" ON warehouses FOR ALL USING (company_id::text = coalesce(auth.jwt()->>'company_id', company_id::text))`
    },
    // Users
    {
      name: "users_company_isolation",
      table: "users",
      sql: `CREATE POLICY "users_company_isolation" ON users FOR ALL USING (company_id::text = coalesce(auth.jwt()->>'company_id', company_id::text))`
    },
    // User Sessions
    {
      name: "sessions_company_isolation",
      table: "user_sessions",
      sql: `CREATE POLICY "sessions_company_isolation" ON user_sessions FOR ALL USING (true)` // Will refine later with user join
    },
    // Number Series
    {
      name: "number_series_company_isolation",
      table: "number_series",
      sql: `CREATE POLICY "number_series_company_isolation" ON number_series FOR ALL USING (company_id::text = coalesce(auth.jwt()->>'company_id', company_id::text))`
    },
    // Number Allocation Log
    {
      name: "allocation_log_company_isolation",
      table: "number_allocation_log",
      sql: `CREATE POLICY "allocation_log_company_isolation" ON number_allocation_log FOR ALL USING (company_id::text = coalesce(auth.jwt()->>'company_id', company_id::text))`
    },
    // Audit Logs (read-only for users)
    {
      name: "audit_logs_select",
      table: "audit_logs",
      sql: `CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (company_id::text = coalesce(auth.jwt()->>'company_id', company_id::text))`
    },
    {
      name: "audit_logs_insert",
      table: "audit_logs",
      sql: `CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true)`
    },
  ];

  console.log(`Adding ${policies.length} RLS policies...\n`);

  let success = 0;
  let skipped = 0;

  for (const policy of policies) {
    process.stdout.write(`${policy.table}.${policy.name}...`);
    try {
      await sql.unsafe(policy.sql);
      console.log(" ✓");
      success++;
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(" ⚠ (exists)");
        skipped++;
      } else {
        console.log(` ✗ ${err.message?.substring(0, 40)}`);
      }
    }
  }

  console.log(`\n✅ Policies added: ${success}`);
  console.log(`⚠️ Policies skipped: ${skipped}`);

  // Verify policies
  console.log("\nVerifying policies...");
  const policyList = await sql`
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;

  console.log("\nActive Policies:");
  console.log("─".repeat(60));
  for (const row of policyList) {
    console.log(`${row.tablename.padEnd(25)} ${row.policyname}`);
  }

  await sql.end();
}

addRLSPolicies();
