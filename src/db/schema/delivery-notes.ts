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
import { companies, branches, warehouses } from "./companies";
import { customers } from "./customers";
import { items } from "./items";
import { salesOrders, salesLines } from "./sales";

// Delivery Notes (GDN - Goods Delivery Notes)
export const deliveryNotes = pgTable("delivery_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
  
  // Document info
  deliveryNoteNumber: varchar("delivery_note_number", { length: 50 }).notNull(),
  deliveryDate: date("delivery_date").notNull(),
  
  // Shipping info
  shippingAddress: text("shipping_address"),
  driverName: varchar("driver_name", { length: 100 }),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  
  // Proof of Delivery
  podSignature: text("pod_signature"), // Base64 or URL
  podPhoto: text("pod_photo"), // URL to photo
  receivedBy: varchar("received_by", { length: 100 }),
  receivedDate: timestamp("received_date"),
  
  // Notes
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  
  // Status: draft, dispatched, in_transit, delivered, cancelled
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  
  // Audit
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Delivery Note Lines
export const deliveryNoteLines = pgTable("delivery_note_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  deliveryNoteId: uuid("delivery_note_id").notNull().references(() => deliveryNotes.id),
  salesOrderLineId: uuid("sales_order_line_id").references(() => salesLines.id),
  
  // Line details
  lineNumber: integer("line_number").notNull(),
  itemId: uuid("item_id").references(() => items.id),
  description: text("description"),
  
  // Quantities
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 10 }).default("PCS").notNull(),
  
  // Serial/Batch tracking
  serialNumbers: text("serial_numbers"), // JSON array or comma-separated
  batchNumber: varchar("batch_number", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const deliveryNotesRelations = relations(deliveryNotes, ({ one, many }) => ({
  company: one(companies, { fields: [deliveryNotes.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [deliveryNotes.branchId], references: [branches.id] }),
  warehouse: one(warehouses, { fields: [deliveryNotes.warehouseId], references: [warehouses.id] }),
  customer: one(customers, { fields: [deliveryNotes.customerId], references: [customers.id] }),
  salesOrder: one(salesOrders, { fields: [deliveryNotes.salesOrderId], references: [salesOrders.id] }),
  lines: many(deliveryNoteLines),
}));

export const deliveryNoteLinesRelations = relations(deliveryNoteLines, ({ one }) => ({
  deliveryNote: one(deliveryNotes, { fields: [deliveryNoteLines.deliveryNoteId], references: [deliveryNotes.id] }),
  salesOrderLine: one(salesLines, { fields: [deliveryNoteLines.salesOrderLineId], references: [salesLines.id] }),
  item: one(items, { fields: [deliveryNoteLines.itemId], references: [items.id] }),
}));
