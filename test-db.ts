
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Checking if warehouses table exists...");
    const resultW = await db.execute(sql`SELECT to_regclass('public.warehouses');`);
    console.log("Result W:", resultW);

    console.log("Checking if customers table exists...");
    const result = await db.execute(sql`SELECT to_regclass('public.customers');`);
    console.log("Result:", result);

  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

main();
