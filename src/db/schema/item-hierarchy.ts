import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { uoms } from "./items";


/**
 * 4-Level Item Hierarchy Schema
 * 
 * Level 1: Category (e.g., "Electronics", "Clothing")
 * Level 2: Subcategory (e.g., "Cameras", "Shirts")
 * Level 3: Brand (e.g., "Canon", "Nike")
 * Level 4: Model/Variant (e.g., "EOS R5", "Air Max 90")
 */

// Level 1: Categories
export const itemCategories = pgTable("item_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }), // Arabic name
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  // UOM Configuration
  baseUomId: uuid("base_uom_id").references(() => uoms.id), // Primary unit of measure
  alternativeUomId: uuid("alternative_uom_id").references(() => uoms.id), // Secondary unit (optional)
  conversionFactor: numeric("conversion_factor", { precision: 10, scale: 4 }), // How many base units = 1 alternative (e.g., 12 pieces = 1 box)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Level 2: Subcategories
export const itemSubcategories = pgTable("item_subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => itemCategories.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Level 3: Brands
export const itemBrands = pgTable("item_brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }),
  logoUrl: text("logo_url"),
  website: varchar("website", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Brand-Subcategory mapping (many-to-many)
export const brandSubcategories = pgTable("brand_subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => itemBrands.id),
  subcategoryId: uuid("subcategory_id")
    .notNull()
    .references(() => itemSubcategories.id),
});

// Brand-Category mapping (many-to-many) - NEW
export const brandCategories = pgTable("brand_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => itemBrands.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => itemCategories.id),
});


// Subcategory-Category mapping (many-to-many) - NEW
export const subcategoryCategories = pgTable("subcategory_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  subcategoryId: uuid("subcategory_id")
    .notNull()
    .references(() => itemSubcategories.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => itemCategories.id),
});

// Level 4: Models/Variants
export const itemModels = pgTable("item_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => itemBrands.id),
  subcategoryId: uuid("subcategory_id")
    .notNull()
    .references(() => itemSubcategories.id),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }),
  description: text("description"),
  specifications: text("specifications"), // JSON or text for specs
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const itemCategoriesRelations = relations(itemCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [itemCategories.companyId],
    references: [companies.id],
  }),
  subcategories: many(itemSubcategories),
  baseUom: one(uoms, {
    fields: [itemCategories.baseUomId],
    references: [uoms.id],
  }),
  alternativeUom: one(uoms, {
    fields: [itemCategories.alternativeUomId],
    references: [uoms.id],
  }),
}));

export const itemSubcategoriesRelations = relations(itemSubcategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [itemSubcategories.companyId],
    references: [companies.id],
  }),
  // Deprecated direct relation, kept for backward compat until migration
  category: one(itemCategories, {
    fields: [itemSubcategories.categoryId],
    references: [itemCategories.id],
  }),
  categoryMappings: many(subcategoryCategories),
  brandMappings: many(brandSubcategories),
  models: many(itemModels),
}));

export const itemBrandsRelations = relations(itemBrands, ({ one, many }) => ({
  company: one(companies, {
    fields: [itemBrands.companyId],
    references: [companies.id],
  }),
  subcategoryMappings: many(brandSubcategories),
  models: many(itemModels),
}));

export const brandCategoriesRelations = relations(brandCategories, ({ one }) => ({
  brand: one(itemBrands, {
    fields: [brandCategories.brandId],
    references: [itemBrands.id],
  }),
  category: one(itemCategories, {
    fields: [brandCategories.categoryId],
    references: [itemCategories.id],
  }),
}));

export const brandSubcategoriesRelations = relations(brandSubcategories, ({ one }) => ({
  brand: one(itemBrands, {
    fields: [brandSubcategories.brandId],
    references: [itemBrands.id],
  }),
  subcategory: one(itemSubcategories, {
    fields: [brandSubcategories.subcategoryId],
    references: [itemSubcategories.id],
  }),
}));

export const subcategoryCategoriesRelations = relations(subcategoryCategories, ({ one }) => ({
  subcategory: one(itemSubcategories, {
    fields: [subcategoryCategories.subcategoryId],
    references: [itemSubcategories.id],
  }),
  category: one(itemCategories, {
    fields: [subcategoryCategories.categoryId],
    references: [itemCategories.id],
  }),
}));

export const itemModelsRelations = relations(itemModels, ({ one }) => ({
  company: one(companies, {
    fields: [itemModels.companyId],
    references: [companies.id],
  }),
  brand: one(itemBrands, {
    fields: [itemModels.brandId],
    references: [itemBrands.id],
  }),
  subcategory: one(itemSubcategories, {
    fields: [itemModels.subcategoryId],
    references: [itemSubcategories.id],
  }),
}));
