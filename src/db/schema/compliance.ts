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
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";

// Tax return status
export const taxReturnStatusEnum = pgEnum("tax_return_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "amended",
]);

// VAT Returns (UAE FTA)
export const vatReturns = pgTable("vat_returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  returnNumber: varchar("return_number", { length: 50 }).notNull(),
  
  // Period
  periodFrom: date("period_from").notNull(),
  periodTo: date("period_to").notNull(),
  dueDate: date("due_date").notNull(),
  
  // Box values (UAE VAT 201 form)
  standardRatedSales: decimal("standard_rated_sales", { precision: 18, scale: 2 }).default("0"),
  standardRatedVat: decimal("standard_rated_vat", { precision: 18, scale: 2 }).default("0"),
  zeroRatedSales: decimal("zero_rated_sales", { precision: 18, scale: 2 }).default("0"),
  exemptSales: decimal("exempt_sales", { precision: 18, scale: 2 }).default("0"),
  
  standardRatedPurchases: decimal("standard_rated_purchases", { precision: 18, scale: 2 }).default("0"),
  inputVat: decimal("input_vat", { precision: 18, scale: 2 }).default("0"),
  
  // Calculated
  netVatDue: decimal("net_vat_due", { precision: 18, scale: 2 }).default("0"),
  vatRefundable: decimal("vat_refundable", { precision: 18, scale: 2 }).default("0"),
  
  // Submission
  status: taxReturnStatusEnum("status").default("draft").notNull(),
  submittedAt: timestamp("submitted_at"),
  ftaReferenceNo: varchar("fta_reference_no", { length: 50 }),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Corporate Tax Returns (UAE)
export const corporateTaxReturns = pgTable("corporate_tax_returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  returnNumber: varchar("return_number", { length: 50 }).notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  
  // Period
  periodFrom: date("period_from").notNull(),
  periodTo: date("period_to").notNull(),
  dueDate: date("due_date").notNull(),
  
  // Amounts
  grossRevenue: decimal("gross_revenue", { precision: 18, scale: 2 }).default("0"),
  allowableDeductions: decimal("allowable_deductions", { precision: 18, scale: 2 }).default("0"),
  taxableIncome: decimal("taxable_income", { precision: 18, scale: 2 }).default("0"),
  
  // UAE rates (0% up to 375K, 9% above)
  exemptAmount: decimal("exempt_amount", { precision: 18, scale: 2 }).default("375000"),
  taxableAboveExempt: decimal("taxable_above_exempt", { precision: 18, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("9"),
  taxPayable: decimal("tax_payable", { precision: 18, scale: 2 }).default("0"),
  
  status: taxReturnStatusEnum("status").default("draft").notNull(),
  submittedAt: timestamp("submitted_at"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Compliance Documents (for auditors)
export const complianceDocuments = pgTable("compliance_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  documentType: varchar("document_type", { length: 50 }).notNull(), // trade_license, vat_certificate, etc.
  documentNumber: varchar("document_number", { length: 100 }),
  issuingAuthority: varchar("issuing_authority", { length: 100 }),
  
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  
  // File storage
  filePath: text("file_path"),
  fileName: varchar("file_name", { length: 200 }),
  
  // Alerts
  reminderDays: integer("reminder_days").default(30),
  isExpired: boolean("is_expired").default(false),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Period Locks (prevent edits to closed periods)
export const periodLocks = pgTable("period_locks", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  
  module: varchar("module", { length: 50 }).notNull(), // sales, purchase, inventory, payroll, gl
  fiscalYear: integer("fiscal_year").notNull(),
  periodMonth: integer("period_month").notNull(), // 1-12
  
  lockType: varchar("lock_type", { length: 20 }).default("soft").notNull(), // soft, hard
  lockedAt: timestamp("locked_at").notNull(),
  lockedBy: uuid("locked_by").notNull(),
  
  unlockReason: text("unlock_reason"),
  unlockedAt: timestamp("unlocked_at"),
  unlockedBy: uuid("unlocked_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// E-Invoice Log (for digital invoicing compliance)
export const einvoiceLog = pgTable("einvoice_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  documentType: varchar("document_type", { length: 20 }).notNull(), // invoice, credit_note
  documentId: uuid("document_id").notNull(),
  documentNumber: varchar("document_number", { length: 50 }).notNull(),
  
  // E-Invoice details
  uuid: varchar("uuid", { length: 50 }), // Unique invoice identifier
  qrCode: text("qr_code"),
  hash: varchar("hash", { length: 100 }),
  
  // Submission status
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, submitted, accepted, rejected
  submittedAt: timestamp("submitted_at"),
  response: jsonb("response"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WPS Files (UAE Wage Protection System)
export const wpsFiles = pgTable("wps_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  payrollRunId: uuid("payroll_run_id"),
  
  fileName: varchar("file_name", { length: 200 }).notNull(),
  filePath: text("file_path"),
  fileFormat: varchar("file_format", { length: 10 }).default("SIF"), // SIF format
  
  // Summary
  totalEmployees: integer("total_employees").default(0),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Submission
  bankName: varchar("bank_name", { length: 100 }),
  referenceNumber: varchar("reference_number", { length: 50 }),
  submittedAt: timestamp("submitted_at"),
  status: varchar("status", { length: 20 }).default("generated").notNull(), // generated, submitted, processed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const vatReturnsRelations = relations(vatReturns, ({ one }) => ({
  company: one(companies, { fields: [vatReturns.companyId], references: [companies.id] }),
}));

export const periodLocksRelations = relations(periodLocks, ({ one }) => ({
  company: one(companies, { fields: [periodLocks.companyId], references: [companies.id] }),
}));
