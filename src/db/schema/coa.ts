import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  decimal,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

// Account type enum
export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);

// Account group enum
export const accountGroupEnum = pgEnum("account_group", [
  // Assets
  "cash_bank",
  "accounts_receivable",
  "inventory",
  "fixed_assets",
  "other_assets",
  // Liabilities
  "accounts_payable",
  "customer_advance",
  "supplier_advance",
  "tax_payable",
  "other_liabilities",
  // Equity
  "capital",
  "retained_earnings",
  // Revenue
  "sales_revenue",
  "service_revenue",
  "other_income",
  // Expense
  "cost_of_goods",
  "operating_expense",
  "payroll_expense",
  "depreciation",
  "other_expense",
]);

// Chart of Accounts Master
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // e.g., 1100, 2100, 4100
  name: varchar("name", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }), // Arabic name
  accountType: accountTypeEnum("account_type").notNull(),
  accountGroup: accountGroupEnum("account_group").notNull(),
  parentId: uuid("parent_id"), // Self-reference for hierarchy
  level: integer("level").default(1).notNull(), // Hierarchy level
  
  // Balances (denormalized for performance)
  openingBalance: decimal("opening_balance", { precision: 18, scale: 2 }).default("0"),
  currentBalance: decimal("current_balance", { precision: 18, scale: 2 }).default("0"),
  
  // Control flags
  isControlAccount: boolean("is_control_account").default(false), // AR, AP, Inventory
  isSystemAccount: boolean("is_system_account").default(false), // Cannot be deleted
  isBankAccount: boolean("is_bank_account").default(false),
  isCashAccount: boolean("is_cash_account").default(false),
  allowManualEntry: boolean("allow_manual_entry").default(true),
  
  isActive: boolean("is_active").default(true).notNull(),
  version: integer("version").default(1),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// COA Relations
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [chartOfAccounts.companyId],
    references: [companies.id],
  }),
  parent: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentId],
    references: [chartOfAccounts.id],
    relationName: "children",
  }),
  children: many(chartOfAccounts, { relationName: "children" }),
}));
