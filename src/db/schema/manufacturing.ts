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
import { companies, branches, warehouses } from "./companies";
import { items } from "./items";

// BOM Status
export const bomStatusEnum = pgEnum("bom_status", [
  "draft",
  "active",
  "obsolete",
]);

// Bill of Materials (BOM)
export const billOfMaterials = pgTable("bill_of_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  bomCode: varchar("bom_code", { length: 50 }).notNull(),
  bomName: varchar("bom_name", { length: 200 }).notNull(),
  
  // Finished product
  finishedItemId: uuid("finished_item_id").notNull().references(() => items.id),
  outputQuantity: decimal("output_quantity", { precision: 18, scale: 3 }).default("1"),
  uom: varchar("uom", { length: 10 }).notNull(),
  
  // Version control
  version: integer("version").default(1),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  
  // Costing
  laborCost: decimal("labor_cost", { precision: 18, scale: 2 }).default("0"),
  overheadCost: decimal("overhead_cost", { precision: 18, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 18, scale: 2 }).default("0"),
  
  status: bomStatusEnum("status").default("draft").notNull(),
  notes: text("notes"),
  
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// BOM Lines (Components)
export const bomLines = pgTable("bom_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  bomId: uuid("bom_id").notNull().references(() => billOfMaterials.id),
  
  lineNumber: integer("line_number").notNull(),
  componentItemId: uuid("component_item_id").notNull().references(() => items.id),
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  
  // Waste factor
  wastagePercent: decimal("wastage_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Substitute items (JSON array of item IDs)
  substitutes: jsonb("substitutes"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Production Orders
export const productionOrders = pgTable("production_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id),
  
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  orderDate: date("order_date").notNull(),
  
  // BOM reference
  bomId: uuid("bom_id").notNull().references(() => billOfMaterials.id),
  finishedItemId: uuid("finished_item_id").notNull().references(() => items.id),
  
  // Quantities
  plannedQuantity: decimal("planned_quantity", { precision: 18, scale: 3 }).notNull(),
  producedQuantity: decimal("produced_quantity", { precision: 18, scale: 3 }).default("0"),
  scrapQuantity: decimal("scrap_quantity", { precision: 18, scale: 3 }).default("0"),
  
  // Dates
  plannedStartDate: date("planned_start_date"),
  plannedEndDate: date("planned_end_date"),
  actualStartDate: date("actual_start_date"),
  actualEndDate: date("actual_end_date"),
  
  // Costing
  plannedCost: decimal("planned_cost", { precision: 18, scale: 2 }).default("0"),
  actualCost: decimal("actual_cost", { precision: 18, scale: 2 }).default("0"),
  
  // Status
  status: varchar("status", { length: 20 }).default("planned").notNull(), // planned, released, in_progress, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Production Order Components (Material consumption)
export const productionOrderComponents = pgTable("production_order_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  productionOrderId: uuid("production_order_id").notNull().references(() => productionOrders.id),
  
  componentItemId: uuid("component_item_id").notNull().references(() => items.id),
  requiredQuantity: decimal("required_quantity", { precision: 18, scale: 3 }).notNull(),
  issuedQuantity: decimal("issued_quantity", { precision: 18, scale: 3 }).default("0"),
  uom: varchar("uom", { length: 10 }).notNull(),
  
  // Batch/Serial tracking
  batchId: uuid("batch_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Routing Operations (Work centers)
export const routingOperations = pgTable("routing_operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  bomId: uuid("bom_id").references(() => billOfMaterials.id),
  productionOrderId: uuid("production_order_id").references(() => productionOrders.id),
  
  operationNumber: integer("operation_number").notNull(),
  operationName: varchar("operation_name", { length: 100 }).notNull(),
  workCenter: varchar("work_center", { length: 50 }),
  
  // Time
  setupTime: decimal("setup_time", { precision: 8, scale: 2 }).default("0"), // minutes
  runTime: decimal("run_time", { precision: 8, scale: 2 }).default("0"), // per unit
  
  // Status (for production orders)
  status: varchar("status", { length: 20 }).default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const billOfMaterialsRelations = relations(billOfMaterials, ({ one, many }) => ({
  company: one(companies, { fields: [billOfMaterials.companyId], references: [companies.id] }),
  finishedItem: one(items, { fields: [billOfMaterials.finishedItemId], references: [items.id] }),
  lines: many(bomLines),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  company: one(companies, { fields: [productionOrders.companyId], references: [companies.id] }),
  bom: one(billOfMaterials, { fields: [productionOrders.bomId], references: [billOfMaterials.id] }),
  components: many(productionOrderComponents),
  operations: many(routingOperations),
}));
