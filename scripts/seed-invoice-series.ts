import { db } from "@/db";
import { numberSeries, companies } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Seeds a default invoice number series for all companies that don't have one
 * Run with: npx tsx scripts/seed-invoice-series.ts
 */

async function seedInvoiceNumberSeries() {
  console.log("🔢 Seeding invoice number series...");

  try {
    const allCompanies = await db.select().from(companies);

    for (const company of allCompanies) {
      // Check if company already has an invoice series
      const existing = await db.select().from(numberSeries).where(
        eq(numberSeries.companyId, company.id)
      );

      const hasInvoiceSeries = existing.some(s => 
        s.moduleType === 'invoice' || s.documentType === 'INV'
      );

      if (!hasInvoiceSeries) {
        await db.insert(numberSeries).values({
          companyId: company.id,
          entityType: 'invoice',
          documentType: 'INV',
          prefix: 'INV',
          separator: '-',
          yearFormat: 'YYYY',
          currentValue: 0,
          resetRule: 'YEARLY',
          scope: 'COMPANY',
          isLocked: false,
          isActive: true,
        });

        console.log(`✅ Created INV series for company: ${company.name || company.id}`);
      } else {
        console.log(`⏭️  Company ${company.name || company.id} already has invoice series`);
      }
    }

    console.log("✅ Invoice number series seed completed!");
  } catch (error) {
    console.error("❌ Error seeding invoice number series:", error);
    process.exit(1);
  }
}

seedInvoiceNumberSeries()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
