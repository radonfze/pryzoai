/**
 * Master & Document Code Configuration
 * 
 * Defines auto-numbering series for all master and document codes.
 */

export interface SeriesConfig {
  code: string;
  name: string;
  prefix: string;
  separator: string;
  numberLength: number;
  yearFormat: "yy" | "yyyy" | "none";
  resetRule: "yearly" | "monthly" | "never";
  scope: "company" | "branch" | "warehouse";
  startingNumber: number;
}

/**
 * Master Code Series Configuration
 */
export const MASTER_SERIES: SeriesConfig[] = [
  // Customers
  { code: "CUS", name: "Customer", prefix: "CUS", separator: "-", numberLength: 5, yearFormat: "none", resetRule: "never", scope: "company", startingNumber: 1 },
  // Suppliers
  { code: "SUP", name: "Supplier", prefix: "SUP", separator: "-", numberLength: 5, yearFormat: "none", resetRule: "never", scope: "company", startingNumber: 1 },
  // Items
  { code: "ITM", name: "Item", prefix: "ITM", separator: "-", numberLength: 5, yearFormat: "none", resetRule: "never", scope: "company", startingNumber: 1 },
  // Employees
  { code: "EMP", name: "Employee", prefix: "EMP", separator: "-", numberLength: 5, yearFormat: "none", resetRule: "never", scope: "company", startingNumber: 1 },
  // Categories
  { code: "CAT", name: "Category", prefix: "CAT", separator: "-", numberLength: 3, yearFormat: "none", resetRule: "never", scope: "company", startingNumber: 1 },
  // Brands
  { code: "BRD", name: "Brand", prefix: "BRD", separator: "-", numberLength: 3, yearFormat: "none", resetRule: "never", scope: "company", startingNumber: 1 },
];

/**
 * Document Code Series Configuration
 */
export const DOCUMENT_SERIES: SeriesConfig[] = [
  // Sales Documents
  { code: "QT", name: "Quotation", prefix: "QT", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "SO", name: "Sales Order", prefix: "SO", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "DN", name: "Delivery Note", prefix: "DN", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "branch", startingNumber: 1 },
  { code: "INV", name: "Sales Invoice", prefix: "INV", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "SR", name: "Sales Return", prefix: "SR", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  
  // Purchase Documents
  { code: "PR", name: "Purchase Request", prefix: "PR", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "PO", name: "Purchase Order", prefix: "PO", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "GRN", name: "Goods Receipt", prefix: "GRN", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "warehouse", startingNumber: 1 },
  { code: "PINV", name: "Purchase Invoice", prefix: "PINV", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "PRET", name: "Purchase Return", prefix: "PRET", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  
  // Inventory Documents
  { code: "ST", name: "Stock Transfer", prefix: "ST", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "SA", name: "Stock Adjustment", prefix: "SA", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "warehouse", startingNumber: 1 },
  { code: "PC", name: "Physical Count", prefix: "PC", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "warehouse", startingNumber: 1 },
  
  // Finance Documents
  { code: "RV", name: "Receipt Voucher", prefix: "RV", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "PV", name: "Payment Voucher", prefix: "PV", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "JV", name: "Journal Voucher", prefix: "JV", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "CN", name: "Credit Note", prefix: "CN", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "DN", name: "Debit Note", prefix: "DBN", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  
  // HR Documents
  { code: "LV", name: "Leave Request", prefix: "LV", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "EXP", name: "Expense Claim", prefix: "EXP", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  
  // Projects
  { code: "PRJ", name: "Project", prefix: "PRJ", separator: "-", numberLength: 4, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "AMC", name: "AMC Contract", prefix: "AMC", separator: "-", numberLength: 4, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
  { code: "WO", name: "Work Order", prefix: "WO", separator: "-", numberLength: 5, yearFormat: "yy", resetRule: "yearly", scope: "company", startingNumber: 1 },
];

/**
 * Get series config by code
 */
export function getSeriesConfig(code: string): SeriesConfig | undefined {
  return [...MASTER_SERIES, ...DOCUMENT_SERIES].find((s) => s.code === code);
}

/**
 * Get all series configs
 */
export function getAllSeriesConfigs(): SeriesConfig[] {
  return [...MASTER_SERIES, ...DOCUMENT_SERIES];
}

/**
 * Preview formatted number
 */
export function previewSeriesNumber(config: SeriesConfig, currentNumber: number, year?: number): string {
  let result = config.prefix;
  
  if (config.yearFormat !== "none") {
    const y = year || new Date().getFullYear();
    const yearStr = config.yearFormat === "yy" ? String(y).slice(-2) : String(y);
    result += config.separator + yearStr;
  }
  
  result += config.separator + String(currentNumber).padStart(config.numberLength, "0");
  
  return result;
}
