
import { db } from "@/db";
import { numberSeries, companies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

async function main() {
    console.log("Checking Invoice Configuration...");
    
    // 1. Get Company Context
    // Since this is a script, we mock or fetch first active
    const company = await db.query.companies.findFirst({
        where: eq(companies.active, true)
    });

    if (!company) {
        console.error("❌ No active company found.");
        process.exit(1);
    }
    console.log(`✅ Company Found: ${company.name} (${company.id})`);

    // 2. Check Number Series
    const series = await db.query.numberSeries.findFirst({
        where: and(
            eq(numberSeries.companyId, company.id),
            eq(numberSeries.entityType, "invoice")
        )
    });

    if (series) {
        console.log(`✅ Number Series Found: Prefix=${series.prefix}, Current=${series.currentValue}`);
    } else {
        console.warn("⚠️ No 'invoice' number series found. Creating default...");
        
        await db.insert(numberSeries).values({
            companyId: company.id,
            entityType: 'invoice',
            documentType: 'INV',
            prefix: 'INV',
            currentValue: 0,
            resetRule: 'YEARLY'
        });
        console.log("✅ Created default 'invoice' series (INV-YYYY-...)");
    }

    console.log("System is ready for Invoice creation.");
    process.exit(0);
}

main().catch(console.error);
