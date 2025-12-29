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
import { suppliers } from "./suppliers";
import { items } from "./items";
import { taxes, paymentTerms, currencies } from "./finance-masters";

// Purchase document status
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "draft",
  "sent",
  "pending_approval",
  "issued",
  "partial",
  "completed",
  "cancelled",
]);

// Purchase Requests
export const purchaseRequests = pgTable("purchase_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  
  requestNumber: varchar("request_number", { length: 50 }).notNull(),
  requestDate: date("request_date").notNull(),
  requiredDate: date("required_date"),
  requestedBy: uuid("requested_by"),
  department: varchar("department", { length: 100 }),
  
  notes: text("notes"),
  status: purchaseStatusEnum("status").default("draft").notNull(),
  
  version: integer("version").default(1),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  requestId: uuid("request_id").references(() => purchaseRequests.id),
  
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  reference: varchar("reference", { length: 100 }),
  
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  receivedQty: decimal("received_qty", { precision: 18, scale: 3 }).default("0"),
  invoicedQty: decimal("invoiced_qty", { precision: 18, scale: 3 }).default("0"),
  
  paymentTermsId: uuid("payment_terms_id").references(() => paymentTerms.id),
  notes: text("notes"),
  status: purchaseStatusEnum("status").default("draft").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Goods Receipt Notes (GRN)
export const goodsReceipts = pgTable("goods_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  
  grnNumber: varchar("grn_number", { length: 50 }).notNull(),
  grnDate: date("grn_date").notNull(),
  supplierDocNumber: varchar("supplier_doc_number", { length: 50 }),
  
  totalQuantity: decimal("total_quantity", { precision: 18, scale: 3 }).default("0"),
  totalValue: decimal("total_value", { precision: 18, scale: 2 }).default("0"),
  
  notes: text("notes"),
  status: purchaseStatusEnum("status").default("draft").notNull(),
  
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Purchase Invoices
export const purchaseInvoices = pgTable("purchase_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  grnId: uuid("grn_id").references(() => goodsReceipts.id),
  
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  invoiceDate: date("invoice_date").notNull(),
  supplierInvoiceNo: varchar("supplier_invoice_no", { length: 50 }),
  dueDate: date("due_date").notNull(),
  
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  paidAmount: decimal("paid_amount", { precision: 18, scale: 2 }).default("0"),
  balanceAmount: decimal("balance_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Withholding tax (UAE)
  withholdingTaxAmount: decimal("withholding_tax_amount", { precision: 18, scale: 2 }).default("0"),
  
  paymentTermsId: uuid("payment_terms_id").references(() => paymentTerms.id),
  notes: text("notes"),
  status: purchaseStatusEnum("status").default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Purchase Returns
export const purchaseReturns = pgTable("purchase_returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  originalInvoiceId: uuid("original_invoice_id").notNull().references(() => purchaseInvoices.id),
  
  returnNumber: varchar("return_number", { length: 50 }).notNull(),
  returnDate: date("return_date").notNull(),
  reason: text("reason").notNull(),
  
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  
  status: purchaseStatusEnum("status").default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Purchase Lines (shared structure)
export const purchaseLines = pgTable("purchase_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  requestId: uuid("request_id").references(() => purchaseRequests.id),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  grnId: uuid("grn_id").references(() => goodsReceipts.id),
  invoiceId: uuid("invoice_id").references(() => purchaseInvoices.id),
  returnId: uuid("return_id").references(() => purchaseReturns.id),
  
  lineNumber: integer("line_number").notNull(),
  itemId: uuid("item_id").references(() => items.id),
  description: text("description"),
  
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  
  unitPrice: decimal("unit_price", { precision: 18, scale: 4 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxId: uuid("tax_id").references(() => taxes.id),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).notNull(),
  
  receivedQty: decimal("received_qty", { precision: 18, scale: 3 }).default("0"),
  invoicedQty: decimal("invoiced_qty", { precision: 18, scale: 3 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier Payments
export const supplierPayments = pgTable("supplier_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  
  paymentNumber: varchar("payment_number", { length: 50 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currencyId: uuid("currency_id").references(() => currencies.id),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"),
  
  bankName: varchar("bank_name", { length: 100 }),
  chequeNumber: varchar("cheque_number", { length: 50 }),
  chequeDate: date("cheque_date"),
  
  allocatedAmount: decimal("allocated_amount", { precision: 18, scale: 2 }).default("0"),
  unallocatedAmount: decimal("unallocated_amount", { precision: 18, scale: 2 }).default("0"),
  
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Supplier Payment Allocations
export const supplierPaymentAllocations = pgTable("supplier_payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  paymentId: uuid("payment_id").notNull().references(() => supplierPayments.id),
  invoiceId: uuid("invoice_id").notNull().references(() => purchaseInvoices.id),
  
  allocatedAmount: decimal("allocated_amount", { precision: 18, scale: 2 }).notNull(),
  allocationDate: date("allocation_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  company: one(companies, { fields: [purchaseOrders.companyId], references: [companies.id] }),
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  lines: many(purchaseLines),
}));

export const goodsReceiptsRelations = relations(goodsReceipts, ({ one, many }) => ({
  company: one(companies, { fields: [goodsReceipts.companyId], references: [companies.id] }),
  supplier: one(suppliers, { fields: [goodsReceipts.supplierId], references: [suppliers.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [goodsReceipts.purchaseOrderId], references: [purchaseOrders.id] }),
  lines: many(purchaseLines),
}));

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one, many }) => ({
  company: one(companies, { fields: [purchaseInvoices.companyId], references: [companies.id] }),
  supplier: one(suppliers, { fields: [purchaseInvoices.supplierId], references: [suppliers.id] }),
  lines: many(purchaseLines),
  allocations: many(supplierPaymentAllocations),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one, many }) => ({
  company: one(companies, { fields: [supplierPayments.companyId], references: [companies.id] }),
  supplier: one(suppliers, { fields: [supplierPayments.supplierId], references: [suppliers.id] }),
  allocations: many(supplierPaymentAllocations),
}));
