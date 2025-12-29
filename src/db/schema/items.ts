import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

// Item type enum
export const itemTypeEnum = pgEnum("item_type", [
  "stock",      // Physical inventory item
  "service",    // Service item
  "expense",    // Expense item
  "fixed_asset", // Fixed asset
]);

// UOM enum (common units)
export const uomEnum = pgEnum("uom", [
  "PCS",   // Pieces
  "NOS",   // Numbers
  "KG",    // Kilogram
  "LTR",   // Liter
  "MTR",   // Meter
  "BOX",   // Box
  "SET",   // Set
  "HRS",   // Hours
  "DAYS",  // Days
]);

// Categories Master
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // CAT-001
  name: varchar("name", { length: 100 }).notNull(),
  parentId: uuid("parent_id"), // Self-reference for subcategories
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Brands Master
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // BRD-001
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Items Master
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 30 }).notNull(), // Auto: ITM-00001
  barcode: varchar("barcode", { length: 50 }),
  name: varchar("name", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }), // Arabic name
  description: text("description"),
  
  itemType: itemTypeEnum("item_type").default("stock").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  brandId: uuid("brand_id").references(() => brands.id),
  uom: uomEnum("uom").default("PCS").notNull(),
  
  // Pricing
  costPrice: decimal("cost_price", { precision: 18, scale: 2 }).default("0"),
  sellingPrice: decimal("selling_price", { precision: 18, scale: 2 }).default("0"),
  minSellingPrice: decimal("min_selling_price", { precision: 18, scale: 2 }).default("0"),
  
  // Tax
  taxPercent: decimal("tax_percent", { precision: 5, scale: 2 }).default("5"), // UAE VAT 5%
  isTaxable: boolean("is_taxable").default(true).notNull(),
  
  // Stock settings
  reorderLevel: decimal("reorder_level", { precision: 18, scale: 3 }).default("0"),
  reorderQty: decimal("reorder_qty", { precision: 18, scale: 3 }).default("0"),
  
  // Tracking
  hasSerialNo: boolean("has_serial_no").default(false),
  hasBatchNo: boolean("has_batch_no").default(false),
  hasExpiry: boolean("has_expiry").default(false),
  
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Item alternate units
export const itemUnits = pgTable("item_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  uom: uomEnum("uom").notNull(),
  conversionFactor: decimal("conversion_factor", { precision: 18, scale: 6 }).default("1"),
  barcode: varchar("barcode", { length: 50 }),
  isDefault: boolean("is_default").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  company: one(companies, {
    fields: [categories.companyId],
    references: [companies.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "subcategories",
  }),
  children: many(categories, { relationName: "subcategories" }),
  items: many(items),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  company: one(companies, {
    fields: [brands.companyId],
    references: [companies.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [items.brandId],
    references: [brands.id],
  }),
  units: many(itemUnits),
}));

export const itemUnitsRelations = relations(itemUnits, ({ one }) => ({
  item: one(items, {
    fields: [itemUnits.itemId],
    references: [items.id],
  }),
}));
