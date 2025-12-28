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
import { companies, branches } from "./companies";
import { chartOfAccounts } from "./coa";
import { users } from "./users";

// Asset Status Enum
export const assetStatusEnum = pgEnum("asset_status", [
  "draft",
  "active",
  "depreciating",
  "fully_depreciated",
  "disposed",
  "sold",
  "written_off",
]);

// Depreciation Method Enum
export const depreciationMethodEnum = pgEnum("depreciation_method", [
  "straight_line",
  "declining_balance",
  "double_declining",
  "sum_of_years",
  "units_of_production",
]);

// Asset Categories
export const assetCategories = pgTable("asset_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Default GL Accounts
  assetAccountId: uuid("asset_account_id").references(() => chartOfAccounts.id),
  accumulatedDepreciationAccountId: uuid("accumulated_depreciation_account_id").references(() => chartOfAccounts.id),
  depreciationExpenseAccountId: uuid("depreciation_expense_account_id").references(() => chartOfAccounts.id),
  
  depreciationMethod: depreciationMethodEnum("depreciation_method").default("straight_line"),
  defaultUsefulLife: decimal("default_useful_life", { precision: 5, scale: 2 }), // Years
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fixed Assets Register
export const fixedAssets = pgTable("fixed_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  categoryId: uuid("category_id").notNull().references(() => assetCategories.id),
  
  assetName: varchar("asset_name", { length: 150 }).notNull(),
  assetCode: varchar("asset_code", { length: 50 }).notNull(), // Unique
  description: text("description"),
  serialNumber: varchar("serial_number", { length: 100 }),
  qrCodeData: text("qr_code_data"), // For barcode generation
  
  purchaseDate: date("purchase_date").notNull(),
  disposalDate: date("disposal_date"),
  disposalPrice: decimal("disposal_price", { precision: 18, scale: 2 }),
  gainLossAmount: decimal("gain_loss_amount", { precision: 18, scale: 2 }),
  inServiceDate: date("in_service_date"), // When depreciation starts
  
  purchaseCost: decimal("purchase_cost", { precision: 18, scale: 2 }).notNull(),
  salvageValue: decimal("salvage_value", { precision: 18, scale: 2 }).default("0"),
  usefulLifeColumns: decimal("useful_life", { precision: 5, scale: 2 }).notNull(), // Years
  
  currentValue: decimal("current_value", { precision: 18, scale: 2 }), // Net Book Value
  
  depreciationMethod: depreciationMethodEnum("depreciation_method").default("straight_line"),
  
  location: varchar("location", { length: 100 }),
  custodianId: uuid("custodian_id").references(() => users.id), // Employee holding the asset
  
  status: assetStatusEnum("status").default("draft").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Depreciation Schedule
export const assetDepreciationSchedule = pgTable("asset_depreciation_schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  assetId: uuid("asset_id").notNull().references(() => fixedAssets.id),
  
  scheduleDate: date("schedule_date").notNull(), // Planned date
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  
  isPosted: boolean("is_posted").default(false),
  journalEntryId: uuid("journal_entry_id"), // Link to GL
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const assetCategoriesRelations = relations(assetCategories, ({ one }) => ({
  company: one(companies, { fields: [assetCategories.companyId], references: [companies.id] }),
  assetAccount: one(chartOfAccounts, { fields: [assetCategories.assetAccountId], references: [chartOfAccounts.id] }),
}));

export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
  company: one(companies, { fields: [fixedAssets.companyId], references: [companies.id] }),
  category: one(assetCategories, { fields: [fixedAssets.categoryId], references: [assetCategories.id] }),
  schedule: many(assetDepreciationSchedule),
}));

export const assetDepreciationScheduleRelations = relations(assetDepreciationSchedule, ({ one }) => ({
  asset: one(fixedAssets, { fields: [assetDepreciationSchedule.assetId], references: [fixedAssets.id] }),
}));
