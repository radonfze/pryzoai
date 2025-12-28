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
import { companies, branches, warehouses } from "./companies";
import { customers } from "./customers";
import { items } from "./items";
import { taxes, paymentTerms, currencies } from "./finance-masters";

// Sales document status
export const salesStatusEnum = pgEnum("sales_status", [
  "draft",
  "sent",
  "issued",
  "partial",
  "completed",
  "cancelled",
]);

// Sales Quotations
export const salesQuotations = pgTable("sales_quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  
  // Document info
  quotationNumber: varchar("quotation_number", { length: 50 }).notNull(),
  quotationDate: date("quotation_date").notNull(),
  validUntil: date("valid_until"),
  reference: varchar("reference", { length: 100 }),
  
  // Pricing
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Terms
  paymentTermsId: uuid("payment_terms_id").references(() => paymentTerms.id),
  termsAndConditions: text("terms_and_conditions"),
  notes: text("notes"),
  
  // Status
  status: salesStatusEnum("status").default("draft").notNull(),
  convertedToSo: boolean("converted_to_so").default(false),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Sales Orders
export const salesOrders = pgTable("sales_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  quotationId: uuid("quotation_id").references(() => salesQuotations.id),
  
  // Document info
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  reference: varchar("reference", { length: 100 }),
  
  // Pricing
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Delivery tracking
  deliveredQty: decimal("delivered_qty", { precision: 18, scale: 3 }).default("0"),
  invoicedQty: decimal("invoiced_qty", { precision: 18, scale: 3 }).default("0"),
  
  // Terms
  paymentTermsId: uuid("payment_terms_id").references(() => paymentTerms.id),
  notes: text("notes"),
  
  // Status
  status: salesStatusEnum("status").default("draft").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Sales Invoices
export const salesInvoices = pgTable("sales_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
  
  // Document info
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  reference: varchar("reference", { length: 100 }),
  
  // Pricing
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Payment tracking
  paidAmount: decimal("paid_amount", { precision: 18, scale: 2 }).default("0"),
  balanceAmount: decimal("balance_amount", { precision: 18, scale: 2 }).default("0"),
  
  // UAE VAT
  taxableAmount: decimal("taxable_amount", { precision: 18, scale: 2 }).default("0"),
  vatAmount: decimal("vat_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Terms
  paymentTermsId: uuid("payment_terms_id").references(() => paymentTerms.id),
  notes: text("notes"),
  
  // Status
  status: salesStatusEnum("status").default("draft").notNull(),
  isPosted: boolean("is_posted").default(false), // Posted to COA
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Sales Returns (Credit Notes)
export const salesReturns = pgTable("sales_returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  originalInvoiceId: uuid("original_invoice_id").notNull().references(() => salesInvoices.id), // Mandatory link
  
  // Document info
  returnNumber: varchar("return_number", { length: 50 }).notNull(),
  returnDate: date("return_date").notNull(),
  reason: text("reason").notNull(),
  
  // Amounts
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Status
  status: salesStatusEnum("status").default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Sales Document Lines (shared structure)
export const salesLines = pgTable("sales_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Parent document (one of these will be set)
  quotationId: uuid("quotation_id").references(() => salesQuotations.id),
  salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
  invoiceId: uuid("invoice_id").references(() => salesInvoices.id),
  returnId: uuid("return_id").references(() => salesReturns.id),
  
  // Line details
  lineNumber: integer("line_number").notNull(),
  itemId: uuid("item_id").references(() => items.id),
  description: text("description"),
  
  // Quantities
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  
  // Pricing
  unitPrice: decimal("unit_price", { precision: 18, scale: 4 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxId: uuid("tax_id").references(() => taxes.id),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).notNull(),
  
  // Delivery tracking (for SO lines)
  deliveredQty: decimal("delivered_qty", { precision: 18, scale: 3 }).default("0"),
  invoicedQty: decimal("invoiced_qty", { precision: 18, scale: 3 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer Payments (Receipt Vouchers)
export const customerPayments = pgTable("customer_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  
  // Document info
  paymentNumber: varchar("payment_number", { length: 50 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  
  // Payment details
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(), // cash, bank, cheque, card
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  
  // Bank/Cheque details
  bankName: varchar("bank_name", { length: 100 }),
  chequeNumber: varchar("cheque_number", { length: 50 }),
  chequeDate: date("cheque_date"),
  
  // Allocation
  allocatedAmount: decimal("allocated_amount", { precision: 18, scale: 2 }).default("0"),
  unallocatedAmount: decimal("unallocated_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Reference
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  
  // Status
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Payment Allocations (link payments to invoices)
export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  paymentId: uuid("payment_id").notNull().references(() => customerPayments.id),
  invoiceId: uuid("invoice_id").notNull().references(() => salesInvoices.id),
  
  allocatedAmount: decimal("allocated_amount", { precision: 18, scale: 2 }).notNull(),
  allocationDate: date("allocation_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const salesQuotationsRelations = relations(salesQuotations, ({ one, many }) => ({
  company: one(companies, { fields: [salesQuotations.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [salesQuotations.customerId], references: [customers.id] }),
  lines: many(salesLines),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  company: one(companies, { fields: [salesOrders.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [salesOrders.customerId], references: [customers.id] }),
  quotation: one(salesQuotations, { fields: [salesOrders.quotationId], references: [salesQuotations.id] }),
  lines: many(salesLines),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
  company: one(companies, { fields: [salesInvoices.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [salesInvoices.customerId], references: [customers.id] }),
  salesOrder: one(salesOrders, { fields: [salesInvoices.salesOrderId], references: [salesOrders.id] }),
  lines: many(salesLines),
  allocations: many(paymentAllocations),
}));

export const salesReturnsRelations = relations(salesReturns, ({ one, many }) => ({
  company: one(companies, { fields: [salesReturns.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [salesReturns.customerId], references: [customers.id] }),
  originalInvoice: one(salesInvoices, { fields: [salesReturns.originalInvoiceId], references: [salesInvoices.id] }),
  lines: many(salesLines),
}));

export const customerPaymentsRelations = relations(customerPayments, ({ one, many }) => ({
  company: one(companies, { fields: [customerPayments.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [customerPayments.customerId], references: [customers.id] }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(customerPayments, { fields: [paymentAllocations.paymentId], references: [customerPayments.id] }),
  invoice: one(salesInvoices, { fields: [paymentAllocations.invoiceId], references: [salesInvoices.id] }),
}));
