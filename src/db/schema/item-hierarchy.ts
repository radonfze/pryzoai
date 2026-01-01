import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

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
  defaultUomId: varchar("default_uom_id", { length: 20 }), // FK to uoms.code (logical) or we can make it loose
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
}));

export const itemSubcategoriesRelations = relations(itemSubcategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [itemSubcategories.companyId],
    references: [companies.id],
  }),
  category: one(itemCategories, {
    fields: [itemSubcategories.categoryId],
    references: [itemCategories.id],
  }),
  brandMappings: many(brandSubcategories),
  models: many(itemModels),
}));

export const itemBrandsRelations = relations(itemBrands, ({ one, many }) => ({
  company: one(companies, {
    fields: [itemBrands.companyId],
    references: [companies.id],
  }),
  subcategoryMappings: many(brandSubcategories),
  categoryMappings: many(brandCategories),
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
