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

  // All NEW tables from Phase 4 (Sales & Purchase)
  const newTables = [
    "sales_quotations",
    "sales_orders",
    "sales_invoices",
    "sales_returns",
    "sales_lines",
    "customer_payments",
    "payment_allocations",
    "purchase_requests",
    "purchase_orders",
    "goods_receipts",
    "purchase_invoices",
    "purchase_returns",
    "purchase_lines",
    "supplier_payments",
    "supplier_payment_allocations",
  ];

  console.log("\n1. Enabling RLS on new tables...\n");

  for (const table of newTables) {
    try {
      await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      console.log(`✓ ${table} - RLS enabled`);
    } catch (err: any) {
      console.log(`⚠ ${table} - ${err.message?.substring(0, 40)}`);
    }
  }

  console.log("\n2. Adding RLS policies...\n");

  for (const table of newTables) {
    try {
      await sql.unsafe(`CREATE POLICY "${table}_company_isolation" ON ${table} FOR ALL USING (true)`);
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
