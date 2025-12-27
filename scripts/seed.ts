import "dotenv/config";
import { db } from "../src/db";
import {
  companies,
  branches,
  warehouses,
  users,
  chartOfAccounts,
  taxes,
  paymentTerms,
  currencies,
  categories,
  brands,
} from "../src/db/schema";

async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Create sample company
  console.log("Creating sample company...");
  const [company] = await db
    .insert(companies)
    .values({
      code: "DEMO-001",
      legalName: "PryzoAI Demo Company LLC",
      tradeName: "PryzoAI Demo",
      trn: "100123456789012", // Sample UAE TRN
      address: "Dubai, UAE",
      currency: "AED",
      isActive: true,
    })
    .returning();
  console.log(`✓ Company: ${company.legalName} (${company.id})`);

  // 2. Create branch
  console.log("\nCreating branch...");
  const [branch] = await db
    .insert(branches)
    .values({
      companyId: company.id,
      code: "HQ",
      name: "Head Office",
      address: "Sheikh Zayed Road, Dubai",
      isActive: true,
    })
    .returning();
  console.log(`✓ Branch: ${branch.name}`);

  // 3. Create warehouse
  console.log("\nCreating warehouse...");
  const [warehouse] = await db
    .insert(warehouses)
    .values({
      companyId: company.id,
      branchId: branch.id,
      code: "WH-MAIN",
      name: "Main Warehouse",
      address: "Jebel Ali, Dubai",
      isActive: true,
    })
    .returning();
  console.log(`✓ Warehouse: ${warehouse.name}`);

  // 4. Create admin user
  console.log("\nCreating admin user...");
  const [adminUser] = await db
    .insert(users)
    .values({
      companyId: company.id,
      email: "admin@pryzoai.com",
      name: "System Admin",
      role: "admin",
      isActive: true,
    })
    .returning();
  console.log(`✓ User: ${adminUser.email}`);

  // 5. Create UAE VAT codes
  console.log("\nCreating tax codes...");
  const taxData = [
    { code: "SR", name: "Standard Rate", nameAr: "المعدل القياسي", taxType: "standard" as const, rate: "5.00", ftaCode: "1", isDefault: true },
    { code: "ZR", name: "Zero Rated", nameAr: "صفر التصنيف", taxType: "zero_rated" as const, rate: "0.00", ftaCode: "2" },
    { code: "EX", name: "Exempt", nameAr: "معفى", taxType: "exempt" as const, rate: "0.00", ftaCode: "3" },
    { code: "OS", name: "Out of Scope", nameAr: "خارج النطاق", taxType: "out_of_scope" as const, rate: "0.00", ftaCode: "4" },
  ];
  for (const tax of taxData) {
    await db.insert(taxes).values({ companyId: company.id, ...tax });
  }
  console.log(`✓ Tax codes: ${taxData.length} created`);

  // 6. Create payment terms
  console.log("\nCreating payment terms...");
  const termsData = [
    { code: "COD", name: "Cash on Delivery", days: "0", isDefault: true },
    { code: "NET15", name: "Net 15 Days", days: "15" },
    { code: "NET30", name: "Net 30 Days", days: "30" },
    { code: "NET60", name: "Net 60 Days", days: "60" },
  ];
  for (const term of termsData) {
    await db.insert(paymentTerms).values({ companyId: company.id, ...term });
  }
  console.log(`✓ Payment terms: ${termsData.length} created`);

  // 7. Create currencies
  console.log("\nCreating currencies...");
  const currencyData = [
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", exchangeRate: "1.000000", isBaseCurrency: true },
    { code: "USD", name: "US Dollar", symbol: "$", exchangeRate: "3.672500" },
    { code: "EUR", name: "Euro", symbol: "€", exchangeRate: "4.010000" },
    { code: "GBP", name: "British Pound", symbol: "£", exchangeRate: "4.670000" },
    { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", exchangeRate: "0.979300" },
  ];
  for (const curr of currencyData) {
    await db.insert(currencies).values({ companyId: company.id, ...curr });
  }
  console.log(`✓ Currencies: ${currencyData.length} created`);

  // 8. Create Chart of Accounts (basic structure)
  console.log("\nCreating Chart of Accounts...");
  const coaData = [
    // Assets
    { code: "1000", name: "Assets", nameAr: "الأصول", accountType: "asset" as const, accountGroup: "other_assets" as const, level: 1 },
    { code: "1100", name: "Cash & Bank", nameAr: "النقد والبنك", accountType: "asset" as const, accountGroup: "cash_bank" as const, level: 2, isCashAccount: true },
    { code: "1200", name: "Accounts Receivable", nameAr: "الذمم المدينة", accountType: "asset" as const, accountGroup: "accounts_receivable" as const, level: 2, isControlAccount: true },
    { code: "1300", name: "Inventory", nameAr: "المخزون", accountType: "asset" as const, accountGroup: "inventory" as const, level: 2, isControlAccount: true },
    // Liabilities
    { code: "2000", name: "Liabilities", nameAr: "الخصوم", accountType: "liability" as const, accountGroup: "other_liabilities" as const, level: 1 },
    { code: "2100", name: "Accounts Payable", nameAr: "الذمم الدائنة", accountType: "liability" as const, accountGroup: "accounts_payable" as const, level: 2, isControlAccount: true },
    { code: "2200", name: "VAT Payable", nameAr: "ضريبة القيمة المضافة", accountType: "liability" as const, accountGroup: "tax_payable" as const, level: 2, isSystemAccount: true },
    { code: "2300", name: "Customer Advances", nameAr: "سلف العملاء", accountType: "liability" as const, accountGroup: "customer_advance" as const, level: 2 },
    // Equity
    { code: "3000", name: "Equity", nameAr: "حقوق الملكية", accountType: "equity" as const, accountGroup: "capital" as const, level: 1 },
    { code: "3100", name: "Capital", nameAr: "رأس المال", accountType: "equity" as const, accountGroup: "capital" as const, level: 2 },
    { code: "3200", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", accountType: "equity" as const, accountGroup: "retained_earnings" as const, level: 2 },
    // Revenue
    { code: "4000", name: "Revenue", nameAr: "الإيرادات", accountType: "revenue" as const, accountGroup: "sales_revenue" as const, level: 1 },
    { code: "4100", name: "Sales Revenue", nameAr: "إيرادات المبيعات", accountType: "revenue" as const, accountGroup: "sales_revenue" as const, level: 2 },
    { code: "4200", name: "Service Revenue", nameAr: "إيرادات الخدمات", accountType: "revenue" as const, accountGroup: "service_revenue" as const, level: 2 },
    // Expenses
    { code: "5000", name: "Expenses", nameAr: "المصروفات", accountType: "expense" as const, accountGroup: "operating_expense" as const, level: 1 },
    { code: "5100", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", accountType: "expense" as const, accountGroup: "cost_of_goods" as const, level: 2 },
    { code: "5200", name: "Operating Expenses", nameAr: "مصروفات التشغيل", accountType: "expense" as const, accountGroup: "operating_expense" as const, level: 2 },
  ];
  for (const account of coaData) {
    await db.insert(chartOfAccounts).values({ companyId: company.id, ...account });
  }
  console.log(`✓ Chart of Accounts: ${coaData.length} accounts created`);

  // 9. Create categories
  console.log("\nCreating item categories...");
  const categoryData = [
    { code: "CAT-001", name: "Electronics" },
    { code: "CAT-002", name: "Office Supplies" },
    { code: "CAT-003", name: "Services" },
  ];
  for (const cat of categoryData) {
    await db.insert(categories).values({ companyId: company.id, ...cat });
  }
  console.log(`✓ Categories: ${categoryData.length} created`);

  // 10. Create brands
  console.log("\nCreating brands...");
  const brandData = [
    { code: "BRD-001", name: "Generic" },
    { code: "BRD-002", name: "Premium" },
  ];
  for (const brand of brandData) {
    await db.insert(brands).values({ companyId: company.id, ...brand });
  }
  console.log(`✓ Brands: ${brandData.length} created`);

  console.log("\n========================================");
  console.log("✅ Seed completed successfully!");
  console.log(`📦 Company ID: ${company.id}`);
  console.log("========================================\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
