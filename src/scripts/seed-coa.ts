
import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

const standardCOA = [
  // Assets (1000 - 1999)
  { code: "1000", name: "Assets", type: "asset", group: "other_assets", parentId: null },
  { code: "1100", name: "Current Assets", type: "asset", group: "other_assets", parentId: "1000" },
  { code: "1110", name: "Cash on Hand", type: "asset", group: "cash_bank", parentId: "1100" },
  { code: "1120", name: "Bank Accounts", type: "asset", group: "cash_bank", parentId: "1100" },
  { code: "1130", name: "Accounts Receivable", type: "asset", group: "accounts_receivable", parentId: "1100" },
  { code: "1200", name: "Fixed Assets", type: "asset", group: "fixed_assets", parentId: "1000" },
  { code: "1210", name: "Furniture & Fixtures", type: "asset", group: "fixed_assets", parentId: "1200" },
  { code: "1220", name: "Computers & Equipment", type: "asset", group: "fixed_assets", parentId: "1200" },

  // Liabilities (2000 - 2999)
  { code: "2000", name: "Liabilities", type: "liability", group: "other_liabilities", parentId: null },
  { code: "2100", name: "Current Liabilities", type: "liability", group: "other_liabilities", parentId: "2000" },
  { code: "2110", name: "Accounts Payable", type: "liability", group: "accounts_payable", parentId: "2100" },
  { code: "2120", name: "VAT Payable", type: "liability", group: "tax_payable", parentId: "2100" },
  
  // Equity (3000 - 3999)
  { code: "3000", name: "Equity", type: "equity", group: "capital", parentId: null },
  { code: "3100", name: "Capital", type: "equity", group: "capital", parentId: "3000" },
  { code: "3200", name: "Retained Earnings", type: "equity", group: "retained_earnings", parentId: "3000" },

  // Income (4000 - 4999)
  { code: "4000", name: "Income", type: "revenue", group: "other_income", parentId: null }, // Changed type to revenue to match schema enum
  { code: "4100", name: "Sales Revenue", type: "revenue", group: "sales_revenue", parentId: "4000" },
  { code: "4200", name: "Other Income", type: "revenue", group: "other_income", parentId: "4000" },

  // Expenses (5000 - 5999)
  { code: "5000", name: "Expenses", type: "expense", group: "other_expense", parentId: null },
  { code: "5100", name: "Cost of Goods Sold", type: "expense", group: "cost_of_goods", parentId: "5000" },
  { code: "5200", name: "Operating Expenses", type: "expense", group: "operating_expense", parentId: "5000" },
  { code: "5210", name: "Rent Expense", type: "expense", group: "operating_expense", parentId: "5200" },
  { code: "5220", name: "Salary Expense", type: "expense", group: "payroll_expense", parentId: "5200" },
  { code: "5230", name: "Utilities", type: "expense", group: "operating_expense", parentId: "5200" },
];

async function seedCOA() {
  console.log("Seeding Chart of Accounts...");
  
  try {
    // 1. Clear existing for demo company
    await db.delete(chartOfAccounts).where(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID));

    // 2. Insert parent accounts first
    const parentMap = new Map();
    
    // Sort so parents come first (by code length primarily, then basic order)
    const sortedAccounts = [...standardCOA].sort((a, b) => a.code.length - b.code.length || a.code.localeCompare(b.code));

    for (const acc of sortedAccounts) {
      let parentUuid = null;
      if (acc.parentId) {
        parentUuid = parentMap.get(acc.parentId);
      }

      const [inserted] = await db.insert(chartOfAccounts).values({
        companyId: DEMO_COMPANY_ID,
        code: acc.code,
        name: acc.name,
        accountType: acc.type as any,
        accountGroup: acc.group as any, // Add this line
        parentId: parentUuid, // Use UUID for parent linkage
        isActive: true,
      }).returning();
      
      parentMap.set(acc.code, inserted.id);
    }

    console.log("Successfully seeded Chart of Accounts!");
  } catch (error) {
    console.error("Error seeding COA:", error);
  } finally {
    process.exit();
  }
}

seedCOA();
