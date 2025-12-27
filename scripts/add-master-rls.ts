import postgres from "postgres";
import "dotenv/config";

async function addMasterRLSPolicies() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const sql = postgres(databaseUrl);

  // First enable RLS on new tables
  const tablesToEnable = [
    "customers",
    "customer_contacts",
    "customer_addresses",
    "suppliers",
    "supplier_contacts",
    "items",
    "categories",
    "brands",
    "item_units",
  ];

  console.log("\n1. Enabling RLS on new tables...\n");

  for (const table of tablesToEnable) {
    try {
      await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      console.log(`✓ ${table} - RLS enabled`);
    } catch (err: any) {
      console.log(`⚠ ${table} - ${err.message?.substring(0, 40)}`);
    }
  }

  // Add simple policies - allow all for now (service role bypasses RLS)
  const policies = [
    // Customers
    { table: "customers", name: "customers_company_isolation", sql: `CREATE POLICY "customers_company_isolation" ON customers FOR ALL USING (true)` },
    { table: "customer_contacts", name: "customer_contacts_isolation", sql: `CREATE POLICY "customer_contacts_isolation" ON customer_contacts FOR ALL USING (true)` },
    { table: "customer_addresses", name: "customer_addresses_isolation", sql: `CREATE POLICY "customer_addresses_isolation" ON customer_addresses FOR ALL USING (true)` },
    
    // Suppliers
    { table: "suppliers", name: "suppliers_company_isolation", sql: `CREATE POLICY "suppliers_company_isolation" ON suppliers FOR ALL USING (true)` },
    { table: "supplier_contacts", name: "supplier_contacts_isolation", sql: `CREATE POLICY "supplier_contacts_isolation" ON supplier_contacts FOR ALL USING (true)` },
    
    // Items
    { table: "items", name: "items_company_isolation", sql: `CREATE POLICY "items_company_isolation" ON items FOR ALL USING (true)` },
    { table: "categories", name: "categories_company_isolation", sql: `CREATE POLICY "categories_company_isolation" ON categories FOR ALL USING (true)` },
    { table: "brands", name: "brands_company_isolation", sql: `CREATE POLICY "brands_company_isolation" ON brands FOR ALL USING (true)` },
    { table: "item_units", name: "item_units_isolation", sql: `CREATE POLICY "item_units_isolation" ON item_units FOR ALL USING (true)` },
  ];

  console.log("\n2. Adding RLS policies...\n");

  for (const { table, name, sql: policySql } of policies) {
    try {
      await sql.unsafe(policySql);
      console.log(`✓ ${table}.${name} - added`);
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(`⚠ ${table}.${name} - exists`);
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

  console.log("Table RLS Status:");
  console.log("─".repeat(40));
  for (const row of rlsStatus) {
    const status = row.rowsecurity ? "✅" : "❌";
    console.log(`${status} ${row.tablename}`);
  }

  await sql.end();
  console.log("\n✅ Done!");
}

addMasterRLSPolicies();
