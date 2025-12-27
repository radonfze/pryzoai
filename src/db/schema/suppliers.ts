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

// Supplier type enum
export const supplierTypeEnum = pgEnum("supplier_type", [
  "local",
  "international",
  "manufacturer",
  "distributor",
  "service_provider",
]);

// Suppliers Master
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // Auto-generated: SUP-00001
  name: varchar("name", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }), // Arabic name
  supplierType: supplierTypeEnum("supplier_type").default("local").notNull(),
  trn: varchar("trn", { length: 15 }), // UAE TRN
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 3 }).default("AE"),
  
  // Financial settings
  creditLimit: decimal("credit_limit", { precision: 18, scale: 2 }).default("0"),
  paymentTermDays: decimal("payment_term_days", { precision: 5, scale: 0 }).default("30"),
  withholdingTaxPercent: decimal("withholding_tax_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Bank details
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNo: varchar("bank_account_no", { length: 50 }),
  bankIban: varchar("bank_iban", { length: 34 }),
  bankSwift: varchar("bank_swift", { length: 11 }),
  
  defaultCurrency: varchar("default_currency", { length: 3 }).default("AED"),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Supplier contacts
export const supplierContacts = pgTable("supplier_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  name: varchar("name", { length: 150 }).notNull(),
  designation: varchar("designation", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  company: one(companies, {
    fields: [suppliers.companyId],
    references: [companies.id],
  }),
  contacts: many(supplierContacts),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierContacts.supplierId],
    references: [suppliers.id],
  }),
}));
