import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { chartOfAccounts } from "./coa";

// Default GL Mapping (Global Company Defaults)
export const defaultGlAccounts = pgTable("default_gl_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Key for local lookups: 'DEFAULT_SALES', 'DEFAULT_COGS', 'DEFAULT_INVENTORY', 'VAT_PAYABLE', 'VAT_RECEIVABLE'
  mappingKey: varchar("mapping_key", { length: 50 }).notNull(), 
  
  accountId: uuid("account_id").references(() => chartOfAccounts.id),
  
  description: text("description"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by"),
});

export const defaultGlAccountsRelations = relations(defaultGlAccounts, ({ one }) => ({
  company: one(companies, { fields: [defaultGlAccounts.companyId], references: [companies.id] }),
  account: one(chartOfAccounts, { fields: [defaultGlAccounts.accountId], references: [chartOfAccounts.id] }),
}));
