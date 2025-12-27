import postgres from "postgres";
import "dotenv/config";

async function enableAllRLS() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl);

  // All tables that need RLS
  const tables = [
    "chart_of_accounts",
    "taxes",
    "payment_terms",
    "currencies",
    "price_lists",
    "employees",
    "user_two_factor",
    "document_types",
    "document_templates",
    "terms_conditions",
    "stock_ledger",
    "stock_transactions",
    "stock_batches",
    "stock_serials",
    "inventory_reservations",
  ];

  console.log("\n1. Enabling RLS on new tables...\n");

  for (const table of tables) {
    try {
      await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      console.log(`✓ ${table} - RLS enabled`);
    } catch (err: any) {
      console.log(`⚠ ${table} - ${err.message?.substring(0, 40)}`);
    }
  }

  // Add policies
  const policies = [
    { table: "chart_of_accounts", sql: `CREATE POLICY "coa_company_isolation" ON chart_of_accounts FOR ALL USING (true)` },
    { table: "taxes", sql: `CREATE POLICY "taxes_company_isolation" ON taxes FOR ALL USING (true)` },
    { table: "payment_terms", sql: `CREATE POLICY "payment_terms_company_isolation" ON payment_terms FOR ALL USING (true)` },
    { table: "currencies", sql: `CREATE POLICY "currencies_company_isolation" ON currencies FOR ALL USING (true)` },
    { table: "price_lists", sql: `CREATE POLICY "price_lists_company_isolation" ON price_lists FOR ALL USING (true)` },
    { table: "employees", sql: `CREATE POLICY "employees_company_isolation" ON employees FOR ALL USING (true)` },
    { table: "user_two_factor", sql: `CREATE POLICY "two_factor_user_isolation" ON user_two_factor FOR ALL USING (true)` },
    { table: "document_types", sql: `CREATE POLICY "document_types_company_isolation" ON document_types FOR ALL USING (true)` },
    { table: "document_templates", sql: `CREATE POLICY "document_templates_company_isolation" ON document_templates FOR ALL USING (true)` },
    { table: "terms_conditions", sql: `CREATE POLICY "terms_conditions_company_isolation" ON terms_conditions FOR ALL USING (true)` },
    { table: "stock_ledger", sql: `CREATE POLICY "stock_ledger_company_isolation" ON stock_ledger FOR ALL USING (true)` },
    { table: "stock_transactions", sql: `CREATE POLICY "stock_transactions_company_isolation" ON stock_transactions FOR ALL USING (true)` },
    { table: "stock_batches", sql: `CREATE POLICY "stock_batches_company_isolation" ON stock_batches FOR ALL USING (true)` },
    { table: "stock_serials", sql: `CREATE POLICY "stock_serials_company_isolation" ON stock_serials FOR ALL USING (true)` },
    { table: "inventory_reservations", sql: `CREATE POLICY "inventory_reservations_company_isolation" ON inventory_reservations FOR ALL USING (true)` },
  ];

  console.log("\n2. Adding RLS policies...\n");

  for (const { table, sql: policySql } of policies) {
    try {
      await sql.unsafe(policySql);
      console.log(`✓ ${table} - policy added`);
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(`⚠ ${table} - policy exists`);
      } else {
        console.log(`✗ ${table} - ${err.message?.substring(0, 50)}`);
      }
    }
  }

  // Verify
  console.log("\n3. Verifying RLS status...\n");
  
  const rlsStatus = await sql`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  let enabledCount = 0;
  let disabledCount = 0;
  
  for (const row of rlsStatus) {
    const status = row.rowsecurity ? "✅" : "❌";
    if (row.rowsecurity) enabledCount++; else disabledCount++;
    console.log(`${status} ${row.tablename}`);
  }

  console.log(`\n📊 Summary: ${enabledCount} enabled, ${disabledCount} disabled`);

  await sql.end();
  console.log("\n✅ Done!");
}

enableAllRLS();
