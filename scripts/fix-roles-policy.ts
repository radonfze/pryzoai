import postgres from "postgres";
import "dotenv/config";

async function fixRolesPolicy() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  try {
    await sql`CREATE POLICY "roles_allow_all" ON roles FOR ALL USING (true)`;
    console.log("✓ Policy added to roles table");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log("⚠ Policy already exists");
    } else {
      console.error("Error:", e.message);
    }
  } finally {
    await sql.end();
  }
}

fixRolesPolicy();
