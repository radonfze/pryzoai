import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating brand_categories table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "brand_categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "brand_id" uuid NOT NULL REFERENCES "item_brands"("id"),
      "category_id" uuid NOT NULL REFERENCES "item_categories"("id")
    );
  `);

  console.log("brand_categories table created successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
