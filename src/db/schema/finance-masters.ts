import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

// Tax type enum (UAE specific)
export const taxTypeEnum = pgEnum("tax_type", [
  "standard",      // Standard rate (5%)
  "zero_rated",    // Zero-rated (0%)
  "exempt",        // Exempt from VAT
  "out_of_scope",  // Not subject to VAT
  "reverse_charge", // Reverse charge mechanism
]);

// Tax Master (UAE VAT)
export const taxes = pgTable("taxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // SR, ZR, EX, OS
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  taxType: taxTypeEnum("tax_type").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // e.g., 5.00
  
  // FTA reporting
  ftaCode: varchar("fta_code", { length: 10 }), // FTA box code
  
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Terms Master
export const paymentTerms = pgTable("payment_terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // NET30, NET60, COD
  name: varchar("name", { length: 100 }).notNull(),
  days: decimal("days", { precision: 5, scale: 0 }).notNull(), // Credit days
  
  // Discount for early payment
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountDays: decimal("discount_days", { precision: 5, scale: 0 }).default("0"),
  
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Currency Master
export const currencies = pgTable("currencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 3 }).notNull(), // AED, USD, EUR
  name: varchar("name", { length: 50 }).notNull(),
  symbol: varchar("symbol", { length: 5 }).notNull(), // ₠, $, €
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default("1"), // Rate to base currency
  
  isBaseCurrency: boolean("is_base_currency").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Price List Master
export const priceLists = pgTable("price_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // STD, VIP, RETAIL
  name: varchar("name", { length: 100 }).notNull(),
  currencyId: uuid("currency_id").references(() => currencies.id),
  
  // Pricing rules
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  markupPercent: decimal("markup_percent", { precision: 5, scale: 2 }).default("0"),
  
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const taxesRelations = relations(taxes, ({ one }) => ({
  company: one(companies, {
    fields: [taxes.companyId],
    references: [companies.id],
  }),
}));

export const paymentTermsRelations = relations(paymentTerms, ({ one }) => ({
  company: one(companies, {
    fields: [paymentTerms.companyId],
    references: [companies.id],
  }),
}));

export const currenciesRelations = relations(currencies, ({ one }) => ({
  company: one(companies, {
    fields: [currencies.companyId],
    references: [companies.id],
  }),
}));

export const priceListsRelations = relations(priceLists, ({ one }) => ({
  company: one(companies, {
    fields: [priceLists.companyId],
    references: [companies.id],
  }),
  currency: one(currencies, {
    fields: [priceLists.currencyId],
    references: [currencies.id],
  }),
}));
