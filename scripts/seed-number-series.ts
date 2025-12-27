import postgres from "postgres";
import "dotenv/config";
import { MASTER_SERIES, DOCUMENT_SERIES, SeriesConfig } from "../src/lib/numbering/series-config";

/**
 * Seed number series for a company
 */
async function seedNumberSeries() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const companyId = process.argv[2];
  if (!companyId) {
    console.error("Usage: npx tsx scripts/seed-number-series.ts <company-id>");
    process.exit(1);
  }

  console.log(`Seeding number series for company: ${companyId}\n`);
  const sql = postgres(databaseUrl);

  const allSeries = [...MASTER_SERIES, ...DOCUMENT_SERIES];
  let created = 0;
  let skipped = 0;

  for (const series of allSeries) {
    try {
      await sql`
        INSERT INTO number_series (
          company_id, code, name, prefix, separator,
          number_length, year_format, reset_rule, scope,
          starting_number, current_number, is_active
        ) VALUES (
          ${companyId}::uuid, ${series.code}, ${series.name}, ${series.prefix}, ${series.separator},
          ${series.numberLength}, ${series.yearFormat}, ${series.resetRule}, ${series.scope},
          ${series.startingNumber}, ${0}, ${true}
        )
        ON CONFLICT (company_id, code) DO NOTHING
      `;
      console.log(`✓ ${series.code} - ${series.name}`);
      created++;
    } catch (err: any) {
      if (err.message?.includes("violates unique constraint")) {
        console.log(`⚠ ${series.code} - already exists`);
        skipped++;
      } else {
        console.log(`✗ ${series.code} - ${err.message?.substring(0, 40)}`);
      }
    }
  }

  await sql.end();
  
  console.log(`\n========================================`);
  console.log(`✅ Created: ${created}`);
  console.log(`⚠️ Skipped: ${skipped}`);
  console.log(`📊 Total: ${allSeries.length}`);
  console.log(`========================================\n`);
}

seedNumberSeries();
