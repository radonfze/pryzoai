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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";
import { customers } from "./customers";
import { items } from "./items";
import { salesInvoices, salesReturns } from "./sales";
import { taxes } from "./finance-masters";

// Credit Notes (standalone credit adjustments or linked to returns)
export const creditNotes = pgTable("credit_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  
  // Optional links
  originalInvoiceId: uuid("original_invoice_id").references(() => salesInvoices.id),
  salesReturnId: uuid("sales_return_id").references(() => salesReturns.id),
  
  // Document info
  creditNoteNumber: varchar("credit_note_number", { length: 50 }).notNull(),
  creditNoteDate: date("credit_note_date").notNull(),
  reference: varchar("reference", { length: 100 }),
  
  // Reason
  reasonCode: varchar("reason_code", { length: 20 }), // return, price_adjust, discount, damaged, other
  reason: text("reason"),
  
  // Amounts
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // UAE VAT
  taxableAmount: decimal("taxable_amount", { precision: 18, scale: 2 }).default("0"),
  vatAmount: decimal("vat_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Application
  appliedAmount: decimal("applied_amount", { precision: 18, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Notes
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  
  // Status: draft, issued, applied, cancelled
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  // Audit
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Credit Note Lines
export const creditNoteLines = pgTable("credit_note_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  creditNoteId: uuid("credit_note_id").notNull().references(() => creditNotes.id),
  
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
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxId: uuid("tax_id").references(() => taxes.id),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const creditNotesRelations = relations(creditNotes, ({ one, many }) => ({
  company: one(companies, { fields: [creditNotes.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [creditNotes.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [creditNotes.customerId], references: [customers.id] }),
  originalInvoice: one(salesInvoices, { fields: [creditNotes.originalInvoiceId], references: [salesInvoices.id] }),
  salesReturn: one(salesReturns, { fields: [creditNotes.salesReturnId], references: [salesReturns.id] }),
  lines: many(creditNoteLines),
}));

export const creditNoteLinesRelations = relations(creditNoteLines, ({ one }) => ({
  creditNote: one(creditNotes, { fields: [creditNoteLines.creditNoteId], references: [creditNotes.id] }),
  item: one(items, { fields: [creditNoteLines.itemId], references: [items.id] }),
  tax: one(taxes, { fields: [creditNoteLines.taxId], references: [taxes.id] }),
}));
