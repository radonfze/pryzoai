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
import { companies, warehouses } from "./companies";
import { items } from "./items";
import { projects } from "./projects";
import { customers } from "./customers";

// Stock transaction type enum
export const stockTransactionTypeEnum = pgEnum("stock_transaction_type", [
  "receipt",          // GRN, Opening Stock
  "issue",            // Sales, Consumption
  "transfer_out",     // Transfer to another warehouse
  "transfer_in",      // Transfer from another warehouse
  "adjustment_in",    // Stock adjustment (+)
  "adjustment_out",   // Stock adjustment (-)
  "return_in",        // Sales return
  "return_out",       // Purchase return
  "production_in",    // Manufacturing output
  "production_out",   // Manufacturing consumption
]);

// Stock Ledger (Running balance per item/warehouse)
export const stockLedger = pgTable("stock_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  
  // Current stock
  quantityOnHand: decimal("quantity_on_hand", { precision: 18, scale: 3 }).default("0").notNull(),
  quantityReserved: decimal("quantity_reserved", { precision: 18, scale: 3 }).default("0").notNull(),
  quantityAvailable: decimal("quantity_available", { precision: 18, scale: 3 }).default("0").notNull(), // OnHand - Reserved
  
  // Valuation
  averageCost: decimal("average_cost", { precision: 18, scale: 4 }).default("0"),
  totalValue: decimal("total_value", { precision: 18, scale: 2 }).default("0"),
  
  // Reorder
  reorderLevel: decimal("reorder_level", { precision: 18, scale: 3 }).default("0"),
  reorderQty: decimal("reorder_qty", { precision: 18, scale: 3 }).default("0"),
  lastPurchaseDate: timestamp("last_purchase_date"),
  lastSaleDate: timestamp("last_sale_date"),
  
  version: integer("version").default(1),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stock Transactions (All movements)
export const stockTransactions = pgTable("stock_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  
  transactionType: stockTransactionTypeEnum("transaction_type").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  
  // Document reference
  documentType: varchar("document_type", { length: 20 }), // GRN, INV, ST, SA, WO
  documentId: uuid("document_id"),
  documentNumber: varchar("document_number", { length: 50 }),
  
  // Project linkage (Phase 3 Enhancement)
  projectId: uuid("project_id").references(() => projects.id),
  
  // Quantities
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  
  // Valuation at transaction time
  unitCost: decimal("unit_cost", { precision: 18, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 18, scale: 2 }),
  
  // Running balance after transaction
  balanceAfter: decimal("balance_after", { precision: 18, scale: 3 }),
  
  // Batch/Serial reference
  batchId: uuid("batch_id"),
  serialId: uuid("serial_id"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  notes: text("notes"),
});

// Batch/Lot Tracking
export const stockBatches = pgTable("stock_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  
  batchNumber: varchar("batch_number", { length: 50 }).notNull(),
  manufacturingDate: date("manufacturing_date"),
  expiryDate: date("expiry_date"),
  
  // Quantities
  quantityReceived: decimal("quantity_received", { precision: 18, scale: 3 }).default("0"),
  quantityOnHand: decimal("quantity_on_hand", { precision: 18, scale: 3 }).default("0"),
  quantityReserved: decimal("quantity_reserved", { precision: 18, scale: 3 }).default("0"),
  
  // Cost for this batch
  unitCost: decimal("unit_cost", { precision: 18, scale: 4 }),
  
  // Source document
  sourceDocType: varchar("source_doc_type", { length: 20 }),
  sourceDocId: uuid("source_doc_id"),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Serial Number Tracking
export const stockSerials = pgTable("stock_serials", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  warehouseId: uuid("warehouse_id")
    .references(() => warehouses.id), // Null if sold
  batchId: uuid("batch_id"),
  
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  
  // Status
  status: varchar("status", { length: 20 }).default("available").notNull(), // available, reserved, sold, returned
  
  // Receipt info
  receivedDate: timestamp("received_date"),
  receiptDocType: varchar("receipt_doc_type", { length: 20 }),
  receiptDocId: uuid("receipt_doc_id"),
  
  // Sale info
  soldDate: timestamp("sold_date"),
  saleDocType: varchar("sale_doc_type", { length: 20 }),
  saleDocId: uuid("sale_doc_id"),
  customerId: uuid("customer_id"),
  
  // Warranty
  warrantyEndDate: date("warranty_end_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory Reservations (for Sales Orders, Projects, etc.)
export const inventoryReservations = pgTable("inventory_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  
  // Project & Customer linkage (Phase 2 Enhancement)
  projectId: uuid("project_id").references(() => projects.id),
  customerId: uuid("customer_id").references(() => customers.id),
  
  // Source document (Sales Order, Project Requisition, etc.)
  documentType: varchar("document_type", { length: 20 }).notNull(), // SO, PR, etc.
  documentId: uuid("document_id").notNull(),
  documentNumber: varchar("document_number", { length: 50 }),
  lineNumber: varchar("line_number", { length: 10 }),
  
  // Reservation details
  quantityReserved: decimal("quantity_reserved", { precision: 18, scale: 3 }).notNull(),
  quantityFulfilled: decimal("quantity_fulfilled", { precision: 18, scale: 3 }).default("0"),
  reservedPrice: decimal("reserved_price", { precision: 18, scale: 4 }), // Price at reservation time
  
  // Batch/Serial if specific
  batchId: uuid("batch_id"),
  serialId: uuid("serial_id"),
  
  // Status
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, fulfilled, released, expired
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
  company: one(companies, { fields: [stockLedger.companyId], references: [companies.id] }),
  warehouse: one(warehouses, { fields: [stockLedger.warehouseId], references: [warehouses.id] }),
  item: one(items, { fields: [stockLedger.itemId], references: [items.id] }),
}));

export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  company: one(companies, { fields: [stockTransactions.companyId], references: [companies.id] }),
  warehouse: one(warehouses, { fields: [stockTransactions.warehouseId], references: [warehouses.id] }),
  item: one(items, { fields: [stockTransactions.itemId], references: [items.id] }),
  project: one(projects, { fields: [stockTransactions.projectId], references: [projects.id] }),
}));

export const stockBatchesRelations = relations(stockBatches, ({ one }) => ({
  company: one(companies, { fields: [stockBatches.companyId], references: [companies.id] }),
  item: one(items, { fields: [stockBatches.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [stockBatches.warehouseId], references: [warehouses.id] }),
}));

export const stockSerialsRelations = relations(stockSerials, ({ one }) => ({
  company: one(companies, { fields: [stockSerials.companyId], references: [companies.id] }),
  item: one(items, { fields: [stockSerials.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [stockSerials.warehouseId], references: [warehouses.id] }),
}));

export const inventoryReservationsRelations = relations(inventoryReservations, ({ one }) => ({
  company: one(companies, { fields: [inventoryReservations.companyId], references: [companies.id] }),
  warehouse: one(warehouses, { fields: [inventoryReservations.warehouseId], references: [warehouses.id] }),
  item: one(items, { fields: [inventoryReservations.itemId], references: [items.id] }),
  project: one(projects, { fields: [inventoryReservations.projectId], references: [projects.id] }),
  customer: one(customers, { fields: [inventoryReservations.customerId], references: [customers.id] }),
}));

// Stock Adjustments (for physical count corrections / write-offs)
export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  
  adjustmentNumber: varchar("adjustment_number", { length: 50 }).notNull(),
  adjustmentDate: date("adjustment_date").notNull(),
  
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, posted
  isPosted: boolean("is_posted").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const stockAdjustmentLines = pgTable("stock_adjustment_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull(),
  adjustmentId: uuid("adjustment_id")
    .notNull()
    .references(() => stockAdjustments.id),
  
  lineNumber: integer("line_number").notNull(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  
  currentQty: decimal("current_qty", { precision: 18, scale: 3 }).default("0"),
  adjustedQty: decimal("adjusted_qty", { precision: 18, scale: 3 }).notNull(),
  variance: decimal("variance", { precision: 18, scale: 3 }).notNull(), // adjusted - current
  
  reason: text("reason"),
});

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one, many }) => ({
  company: one(companies, { fields: [stockAdjustments.companyId], references: [companies.id] }),
  lines: many(stockAdjustmentLines),
}));

export const stockAdjustmentLinesRelations = relations(stockAdjustmentLines, ({ one }) => ({
  adjustment: one(stockAdjustments, { fields: [stockAdjustmentLines.adjustmentId], references: [stockAdjustments.id] }),
  item: one(items, { fields: [stockAdjustmentLines.itemId], references: [items.id] }),
  warehouse: one(warehouses, { fields: [stockAdjustmentLines.warehouseId], references: [warehouses.id] }),
}));

// Stock Transfers (Inter-warehouse movements)
export const stockTransfers = pgTable("stock_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  
  transferNumber: varchar("transfer_number", { length: 50 }).notNull().unique(),
  fromWarehouseId: uuid("from_warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  toWarehouseId: uuid("to_warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  
  transferDate: date("transfer_date").notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, in_transit, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const stockTransferLines = pgTable("stock_transfer_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull(),
  transferId: uuid("transfer_id")
    .notNull()
    .references(() => stockTransfers.id),
  
  lineNumber: integer("line_number").notNull(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 20 }).notNull(),
  notes: text("notes"),
});

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
  company: one(companies, { fields: [stockTransfers.companyId], references: [companies.id] }),
  fromWarehouse: one(warehouses, { fields: [stockTransfers.fromWarehouseId], references: [warehouses.id] }),
  toWarehouse: one(warehouses, { fields: [stockTransfers.toWarehouseId], references: [warehouses.id] }),
  lines: many(stockTransferLines),
}));

export const stockTransferLinesRelations = relations(stockTransferLines, ({ one }) => ({
  transfer: one(stockTransfers, { fields: [stockTransferLines.transferId], references: [stockTransfers.id] }),
  item: one(items, { fields: [stockTransferLines.itemId], references: [items.id] }),
}));

// Stock Count (Physical Inventory)
export const stockCountStatusEnum = pgEnum("stock_count_status", [
  "draft",
  "in_progress",
  "completed",
  "cancelled",
]);

export const stockCounts = pgTable("stock_counts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => companies.id), // Assuming branch links to companies or branches table? Fixed to match script but cleaner if branches imported.
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id),
  
  countNumber: varchar("count_number", { length: 50 }).notNull(),
  countDate: date("count_date").notNull(),
  description: text("description"),
  
  status: stockCountStatusEnum("status").default("draft").notNull(),
  isPosted: boolean("is_posted").default(false),
  
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  deletedAt: timestamp("deleted_at"),
});

export const stockCountLines = pgTable("stock_count_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  countId: uuid("count_id").notNull().references(() => stockCounts.id),
  itemId: uuid("item_id").notNull().references(() => items.id),
  
  systemQty: decimal("system_qty", { precision: 18, scale: 3 }).default("0"),
  countedQty: decimal("counted_qty", { precision: 18, scale: 3 }).default("0"),
  varianceQty: decimal("variance_qty", { precision: 18, scale: 3 }).default("0"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockCountsRelations = relations(stockCounts, ({ one, many }) => ({
  company: one(companies, { fields: [stockCounts.companyId], references: [companies.id] }),
  warehouse: one(warehouses, { fields: [stockCounts.warehouseId], references: [warehouses.id] }),
  lines: many(stockCountLines),
}));

export const stockCountLinesRelations = relations(stockCountLines, ({ one }) => ({
  count: one(stockCounts, { fields: [stockCountLines.countId], references: [stockCounts.id] }),
  item: one(items, { fields: [stockCountLines.itemId], references: [items.id] }),
}));


