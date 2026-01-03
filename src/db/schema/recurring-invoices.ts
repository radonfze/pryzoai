import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  decimal,
  date,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";
import { customers } from "./customers";
import { items } from "./items";
import { taxes, paymentTerms, currencies } from "./finance-masters";

// Frequency enum for recurring invoices
export const frequencyEnum = pgEnum("invoice_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "biannually",
  "yearly",
]);

// Recurring Invoice Templates
export const recurringInvoiceTemplates = pgTable("recurring_invoice_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  
  // Template info
  templateName: varchar("template_name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Frequency
  frequency: frequencyEnum("frequency").notNull(),
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly, quarterly, etc.
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  
  // Scheduling
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // Optional end date
  nextRunDate: date("next_run_date").notNull(),
  lastRunDate: date("last_run_date"),
  
  // Totals (template amounts)
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Options
  autoPost: boolean("auto_post").default(false), // Auto-post to GL
  autoSendEmail: boolean("auto_send_email").default(false),
  paymentTermsId: uuid("payment_terms_id").references(() => paymentTerms.id),
  currencyId: uuid("currency_id").references(() => currencies.id),
  notes: text("notes"),
  
  // Status
  isActive: boolean("is_active").default(true),
  invoicesGenerated: integer("invoices_generated").default(0),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Recurring Invoice Template Lines
export const recurringInvoiceLines = pgTable("recurring_invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  templateId: uuid("template_id").notNull().references(() => recurringInvoiceTemplates.id),
  
  // Line details
  lineNumber: integer("line_number").notNull(),
  itemId: uuid("item_id").references(() => items.id),
  description: text("description"),
  
  // Quantities
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 10 }).default("PCS").notNull(),
  
  // Pricing
  unitPrice: decimal("unit_price", { precision: 18, scale: 4 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  taxId: uuid("tax_id").references(() => taxes.id),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const recurringInvoiceTemplatesRelations = relations(recurringInvoiceTemplates, ({ one, many }) => ({
  company: one(companies, { fields: [recurringInvoiceTemplates.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [recurringInvoiceTemplates.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [recurringInvoiceTemplates.customerId], references: [customers.id] }),
  paymentTerms: one(paymentTerms, { fields: [recurringInvoiceTemplates.paymentTermsId], references: [paymentTerms.id] }),
  currency: one(currencies, { fields: [recurringInvoiceTemplates.currencyId], references: [currencies.id] }),
  lines: many(recurringInvoiceLines),
}));

export const recurringInvoiceLinesRelations = relations(recurringInvoiceLines, ({ one }) => ({
  template: one(recurringInvoiceTemplates, { fields: [recurringInvoiceLines.templateId], references: [recurringInvoiceTemplates.id] }),
  item: one(items, { fields: [recurringInvoiceLines.itemId], references: [items.id] }),
  tax: one(taxes, { fields: [recurringInvoiceLines.taxId], references: [taxes.id] }),
}));
