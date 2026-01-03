import {
  pgTable,
  uuid,
  varchar,
  decimal,
  date,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { items } from "./items";

// Item Price Tiers - Quantity-based pricing
export const itemPriceTiers = pgTable("item_price_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  itemId: uuid("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  
  // Tier identification
  tierName: varchar("tier_name", { length: 100 }).notNull(), // e.g., "Bulk 100+", "Wholesale"
  
  // Quantity range
  minQuantity: decimal("min_quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  maxQuantity: decimal("max_quantity", { precision: 10, scale: 3 }), // null = no upper limit
  
  // Pricing
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Validity period
  effectiveDate: date("effective_date").notNull().defaultNow(),
  expiryDate: date("expiry_date"),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
}, (table) => ({
  // Unique constraint: one tier name per item
  uniqueTierPerItem: unique().on(table.itemId, table.tierName),
}));

// Relations
export const itemPriceTiersRelations = relations(itemPriceTiers, ({ one }) => ({
  company: one(companies, {
    fields: [itemPriceTiers.companyId],
    references: [companies.id],
  }),
  item: one(items, {
    fields: [itemPriceTiers.itemId],
    references: [items.id],
  }),
}));
