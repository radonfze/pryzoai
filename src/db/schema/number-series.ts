import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

// Enums for number series
export const yearFormatEnum = pgEnum("year_format", ["YYYY", "YY", "NONE"]);
export const resetRuleEnum = pgEnum("reset_rule", ["NONE", "YEARLY", "MONTHLY"]);
export const seriesScopeEnum = pgEnum("series_scope", ["COMPANY", "BRANCH", "GLOBAL"]);
export const allocationStatusEnum = pgEnum("allocation_status", ["FINAL", "CANCELLED"]);

// Number Series - Auto-numbering engine
export const numberSeries = pgTable("number_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  entityType: text("entity_type").notNull(), // invoice, customer, item, etc.
  documentType: text("document_type"), // INV, SO, QT (optional)
  prefix: text("prefix").notNull(), // INV, CUS, ITM
  separator: text("separator").default("-"),
  yearFormat: yearFormatEnum("year_format").default("YYYY"),
  currentValue: bigint("current_value", { mode: "number" }).default(0).notNull(),
  resetRule: resetRuleEnum("reset_rule").default("YEARLY"),
  scope: seriesScopeEnum("scope").default("COMPANY"),
  isLocked: boolean("is_locked").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Number Allocation Log - Audit trail for generated numbers
export const numberAllocationLog = pgTable("number_allocation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  entityType: text("entity_type").notNull(),
  documentType: text("document_type"),
  generatedNumber: text("generated_number").notNull(),
  seriesId: uuid("series_id").references(() => numberSeries.id),
  entityId: uuid("entity_id"), // invoice_id, customer_id, etc.
  status: allocationStatusEnum("status").default("FINAL"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const numberSeriesRelations = relations(numberSeries, ({ one, many }) => ({
  company: one(companies, {
    fields: [numberSeries.companyId],
    references: [companies.id],
  }),
  allocations: many(numberAllocationLog),
}));

export const numberAllocationLogRelations = relations(numberAllocationLog, ({ one }) => ({
  company: one(companies, {
    fields: [numberAllocationLog.companyId],
    references: [companies.id],
  }),
  series: one(numberSeries, {
    fields: [numberAllocationLog.seriesId],
    references: [numberSeries.id],
  }),
}));
