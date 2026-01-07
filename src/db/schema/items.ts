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
import { itemCategories, itemSubcategories, itemBrands, itemModels } from "./item-hierarchy";
import { taxes } from "./finance-masters";

// Item type enum
export const itemTypeEnum = pgEnum("item_type", [
  "stock",      // Physical inventory item
  "service",    // Service item
  "expense",    // Expense item
  "fixed_asset", // Fixed asset
]);

// UOM Master Table
export const uoms = pgTable("uoms", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // PCS, KG
  name: varchar("name", { length: 50 }).notNull(), // Pieces, Kilograms
  isActive: boolean("is_active").default(true).notNull(),
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
  
  type: itemTypeEnum("type").default("stock").notNull(),
  
  // Hierarchy Links
  categoryId: uuid("category_id").references(() => itemCategories.id),
  subCategoryId: uuid("sub_category_id").references(() => itemSubcategories.id),
  brandId: uuid("brand_id").references(() => itemBrands.id),
  modelId: uuid("model_id").references(() => itemModels.id),
  partNumber: varchar("part_number", { length: 100 }), // New Field
  
  // Dynamic UOM (Linked logically to uoms table, but stored as code/varchar for flexibility)
  uom: varchar("uom", { length: 20 }).default("PCS").notNull(),
  
  // Pricing
  costPrice: decimal("cost_price", { precision: 18, scale: 2 }).default("0"),
  sellingPrice: decimal("selling_price", { precision: 18, scale: 2 }).default("0"),
  minSellingPrice: decimal("min_selling_price", { precision: 18, scale: 2 }).default("0"),
  
  // Tax
  taxId: uuid("tax_id").references(() => taxes.id),
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
  uom: varchar("uom", { length: 20 }).notNull(),
  conversionFactor: decimal("conversion_factor", { precision: 18, scale: 6 }).default("1"),
  barcode: varchar("barcode", { length: 50 }),
  isDefault: boolean("is_default").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bill of Materials (BOM)
export const bom = pgTable("bom", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  itemId: uuid("item_id").notNull().references(() => items.id), // Parent Item
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bomLines = pgTable("bom_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  bomId: uuid("bom_id").notNull().references(() => bom.id),
  itemId: uuid("item_id").notNull().references(() => items.id), // Child Component
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 20 }),
  notes: text("notes"),
});


// Relations
export const itemsRelations = relations(items, ({ one, many }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
  category: one(itemCategories, {
    fields: [items.categoryId],
    references: [itemCategories.id],
  }),
  subCategory: one(itemSubcategories, {
    fields: [items.subCategoryId],
    references: [itemSubcategories.id],
  }),
  brand: one(itemBrands, {
    fields: [items.brandId],
    references: [itemBrands.id],
  }),
  model: one(itemModels, {
    fields: [items.modelId],
    references: [itemModels.id],
  }),
  units: many(itemUnits),
  boms: many(bom),
}));

export const itemUnitsRelations = relations(itemUnits, ({ one }) => ({
  item: one(items, {
    fields: [itemUnits.itemId],
    references: [items.id],
  }),
}));

export const uomsRelations = relations(uoms, ({ one }) => ({
  company: one(companies, {
    fields: [uoms.companyId],
    references: [companies.id],
  }),
}));

export const bomRelations = relations(bom, ({ one, many }) => ({
  company: one(companies, { fields: [bom.companyId], references: [companies.id] }),
  item: one(items, { fields: [bom.itemId], references: [items.id] }),
  lines: many(bomLines),
}));

export const bomLinesRelations = relations(bomLines, ({ one }) => ({
  bom: one(bom, { fields: [bomLines.bomId], references: [bom.id] }),
  item: one(items, { fields: [bomLines.itemId], references: [items.id] }),
}));
