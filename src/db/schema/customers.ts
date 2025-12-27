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

// Customer type enum
export const customerTypeEnum = pgEnum("customer_type", [
  "individual",
  "corporate",
  "government",
  "retail",
]);

// Customers Master
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // Auto-generated: CUS-00001
  name: varchar("name", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }), // Arabic name
  customerType: customerTypeEnum("customer_type").default("corporate").notNull(),
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
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Preferences
  defaultCurrency: varchar("default_currency", { length: 3 }).default("AED"),
  preferredLanguage: varchar("preferred_language", { length: 2 }).default("en"), // en, ar
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Customer contacts
export const customerContacts = pgTable("customer_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  name: varchar("name", { length: 150 }).notNull(),
  designation: varchar("designation", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer addresses (multiple shipping/billing)
export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  addressType: varchar("address_type", { length: 20 }).default("billing"), // billing, shipping
  label: varchar("label", { length: 50 }), // Head Office, Branch, etc.
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 3 }).default("AE"),
  postalCode: varchar("postal_code", { length: 20 }),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  contacts: many(customerContacts),
  addresses: many(customerAddresses),
}));

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  customer: one(customers, {
    fields: [customerContacts.customerId],
    references: [customers.id],
  }),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));
