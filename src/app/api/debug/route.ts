import postgres from "postgres";

export async function GET() {
  let sqlClient;
  try {
    // Create FRESH connection to bypass potential app-level pool issues
    // Force prepare: false for pgbouncer compatibility
    sqlClient = postgres(process.env.DATABASE_URL!, { prepare: false });
    
    // Test 1: Simple Select
    const result = await sqlClient`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices'
      ORDER BY ordinal_position
    `;
    
    await sqlClient.end();
    
    return NextResponse.json({ 
      success: true, 
      count: result.length,
      columns: result.map((r: any) => r.column_name),
      source: "Fresh Connection" 
    });
  } catch (e: any) {
    if (sqlClient) await sqlClient.end();
    return NextResponse.json({ 
      success: false, 
      error: e.message, 
      code: e.code,
      stack: e.stack,
      hint: "Fresh connection failed too."
    });
  }
}
