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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, warehouses } from "./companies";
import { items } from "./items";

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
  documentType: varchar("document_type", { length: 20 }), // GRN, INV, ST, SA
  documentId: uuid("document_id"),
  documentNumber: varchar("document_number", { length: 50 }),
  
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

// Inventory Reservations (for Sales Orders)
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
  
  // Source document (Sales Order)
  documentType: varchar("document_type", { length: 20 }).notNull(), // SO
  documentId: uuid("document_id").notNull(),
  documentNumber: varchar("document_number", { length: 50 }),
  lineNumber: varchar("line_number", { length: 10 }),
  
  // Reservation details
  quantityReserved: decimal("quantity_reserved", { precision: 18, scale: 3 }).notNull(),
  quantityFulfilled: decimal("quantity_fulfilled", { precision: 18, scale: 3 }).default("0"),
  
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
}));
