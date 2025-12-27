import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  decimal,
  date,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";
import { chartOfAccounts } from "./coa";
import { users } from "./users";

// Journal entry status
export const journalStatusEnum = pgEnum("journal_status", [
  "draft",
  "posted",
  "cancelled",
]);

// General Ledger Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  
  journalNumber: varchar("journal_number", { length: 50 }).notNull(),
  journalDate: date("journal_date").notNull(),
  
  // Source document
  sourceDocType: varchar("source_doc_type", { length: 20 }), // INV, PINV, RV, PV
  sourceDocId: uuid("source_doc_id"),
  sourceDocNumber: varchar("source_doc_number", { length: 50 }),
  
  description: text("description"),
  
  // Totals (must balance)
  totalDebit: decimal("total_debit", { precision: 18, scale: 2 }).default("0"),
  totalCredit: decimal("total_credit", { precision: 18, scale: 2 }).default("0"),
  
  // Reversal
  isReversal: boolean("is_reversal").default(false),
  reversalOfId: uuid("reversal_of_id"),
  
  status: journalStatusEnum("status").default("draft").notNull(),
  postedAt: timestamp("posted_at"),
  postedBy: uuid("posted_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Journal Entry Lines
export const journalLines = pgTable("journal_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  journalId: uuid("journal_id").notNull().references(() => journalEntries.id),
  
  lineNumber: integer("line_number").notNull(),
  accountId: uuid("account_id").notNull().references(() => chartOfAccounts.id),
  
  description: text("description"),
  debit: decimal("debit", { precision: 18, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 18, scale: 2 }).default("0"),
  
  // Dimensions
  costCenter: varchar("cost_center", { length: 50 }),
  project: varchar("project", { length: 50 }),
  department: varchar("department", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fixed Assets
export const fixedAssets = pgTable("fixed_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  
  assetCode: varchar("asset_code", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Category & Location
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  location: varchar("location", { length: 200 }),
  
  // Purchase info
  purchaseDate: date("purchase_date").notNull(),
  purchaseValue: decimal("purchase_value", { precision: 18, scale: 2 }).notNull(),
  vendorId: uuid("vendor_id"),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  
  // Depreciation
  depreciationMethod: varchar("depreciation_method", { length: 20 }).default("straight_line"), // straight_line, declining
  usefulLifeMonths: integer("useful_life_months").notNull(),
  salvageValue: decimal("salvage_value", { precision: 18, scale: 2 }).default("0"),
  depreciationStartDate: date("depreciation_start_date"),
  
  // Current values
  accumulatedDepreciation: decimal("accumulated_depreciation", { precision: 18, scale: 2 }).default("0"),
  bookValue: decimal("book_value", { precision: 18, scale: 2 }).default("0"),
  
  // Status
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, disposed, sold
  disposalDate: date("disposal_date"),
  disposalValue: decimal("disposal_value", { precision: 18, scale: 2 }),
  
  // COA links
  assetAccountId: uuid("asset_account_id").references(() => chartOfAccounts.id),
  depreciationAccountId: uuid("depreciation_account_id").references(() => chartOfAccounts.id),
  accumulatedDepAccountId: uuid("accumulated_dep_account_id").references(() => chartOfAccounts.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Asset Depreciation Schedule
export const assetDepreciation = pgTable("asset_depreciation", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  assetId: uuid("asset_id").notNull().references(() => fixedAssets.id),
  
  periodDate: date("period_date").notNull(), // Month-end date
  depreciationAmount: decimal("depreciation_amount", { precision: 18, scale: 2 }).notNull(),
  accumulatedAmount: decimal("accumulated_amount", { precision: 18, scale: 2 }).notNull(),
  bookValue: decimal("book_value", { precision: 18, scale: 2 }).notNull(),
  
  isPosted: boolean("is_posted").default(false),
  journalId: uuid("journal_id").references(() => journalEntries.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bank Accounts
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountName: varchar("account_name", { length: 200 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  iban: varchar("iban", { length: 34 }),
  swiftCode: varchar("swift_code", { length: 11 }),
  routingCode: varchar("routing_code", { length: 20 }),
  currency: varchar("currency", { length: 3 }).default("AED"),
  
  // COA link
  glAccountId: uuid("gl_account_id").references(() => chartOfAccounts.id),
  
  // Balance
  currentBalance: decimal("current_balance", { precision: 18, scale: 2 }).default("0"),
  lastReconciledAt: timestamp("last_reconciled_at"),
  lastReconciledBalance: decimal("last_reconciled_balance", { precision: 18, scale: 2 }),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bank Transactions (for reconciliation)
export const bankTransactions = pgTable("bank_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  bankAccountId: uuid("bank_account_id").notNull().references(() => bankAccounts.id),
  
  transactionDate: date("transaction_date").notNull(),
  valueDate: date("value_date"),
  description: text("description"),
  reference: varchar("reference", { length: 100 }),
  
  debit: decimal("debit", { precision: 18, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 18, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 18, scale: 2 }),
  
  // Reconciliation
  isReconciled: boolean("is_reconciled").default(false),
  reconciledAt: timestamp("reconciled_at"),
  matchedJournalId: uuid("matched_journal_id").references(() => journalEntries.id),
  
  // Import source
  importBatchId: varchar("import_batch_id", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fiscal Periods
export const fiscalPeriods = pgTable("fiscal_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  periodName: varchar("period_name", { length: 50 }).notNull(), // "Jan 2024", "Q1 2024"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  periodNumber: integer("period_number").notNull(), // 1-12 for monthly
  
  // Locking
  status: varchar("status", { length: 20 }).default("open").notNull(), // open, soft_locked, hard_locked
  lockedAt: timestamp("locked_at"),
  lockedBy: uuid("locked_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, { fields: [journalEntries.companyId], references: [companies.id] }),
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journal: one(journalEntries, { fields: [journalLines.journalId], references: [journalEntries.id] }),
  account: one(chartOfAccounts, { fields: [journalLines.accountId], references: [chartOfAccounts.id] }),
}));

export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
  company: one(companies, { fields: [fixedAssets.companyId], references: [companies.id] }),
  depreciationSchedule: many(assetDepreciation),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  company: one(companies, { fields: [bankAccounts.companyId], references: [companies.id] }),
  transactions: many(bankTransactions),
}));
