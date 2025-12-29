import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { salesInvoices, companies } from "../db/schema";
import { eq } from "drizzle-orm";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

async function runDiagnostics() {
  console.log("--- Starting System Diagnostics ---");

  // 1. Check Company Settings
  console.log("\n1. Checking Company Record...");
  try {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, DEMO_COMPANY_ID),
    });
    if (company) {
      console.log("✅ Company found:", company.name, "| ID:", company.id);
      console.log("   Address:", company.address);
      console.log("   TRN:", company.taxId);
    } else {
      console.error("❌ Company record NOT FOUND for ID:", DEMO_COMPANY_ID);
    }
  } catch (error) {
    console.error("❌ Error fetching company:", error);
  }

  // 2. Check Invoices & Relations
  console.log("\n2. Checking Invoices & Relations...");
  try {
    const invoiceCount = await db.query.salesInvoices.findMany({
       limit: 5,
       with: {
         customer: true
       }
    });
    console.log(`✅ Successfully fetched ${invoiceCount.length} invoices with customer relation.`);
    
    invoiceCount.forEach((inv: any) => {
        console.log(`   - Invoice: ${inv.invoiceNumber} | Customer: ${inv.customer ? inv.customer.name : 'MISSING'}`);
    });

  } catch (error) {
    console.error("❌ CRITICAL ERROR fetching invoices:", error);
  }

  console.log("\n--- Diagnostics Complete ---");
  process.exit(0);
}

runDiagnostics();
