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
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";
import { employees } from "./employees";

// KPI frequency
export const kpiFrequencyEnum = pgEnum("kpi_frequency", [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

// KPI Categories
export const kpiCategories = pgTable("kpi_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// KPI Master
export const kpiMaster = pgTable("kpi_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  categoryId: uuid("category_id").references(() => kpiCategories.id),
  
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Measurement
  unit: varchar("unit", { length: 20 }), // %, AED, count, hours
  dataType: varchar("data_type", { length: 20 }).default("number"), // number, currency, percentage
  frequency: kpiFrequencyEnum("frequency").default("monthly"),
  
  // Target direction
  targetDirection: varchar("target_direction", { length: 10 }).default("higher"), // higher, lower, target
  
  // Formula (optional - for calculated KPIs)
  formula: text("formula"),
  dataSource: varchar("data_source", { length: 100 }), // table/view name
  
  // Scoring weights
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1"),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// KPI Targets (versioned)
export const kpiTargets = pgTable("kpi_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  kpiId: uuid("kpi_id").notNull().references(() => kpiMaster.id),
  branchId: uuid("branch_id").references(() => branches.id),
  employeeId: uuid("employee_id").references(() => employees.id),
  
  // Period
  fiscalYear: integer("fiscal_year").notNull(),
  periodNumber: integer("period_number"), // 1-12 for monthly
  
  // Targets
  targetValue: decimal("target_value", { precision: 18, scale: 2 }).notNull(),
  minValue: decimal("min_value", { precision: 18, scale: 2 }),
  maxValue: decimal("max_value", { precision: 18, scale: 2 }),
  
  // Thresholds for scoring
  excellentThreshold: decimal("excellent_threshold", { precision: 18, scale: 2 }),
  goodThreshold: decimal("good_threshold", { precision: 18, scale: 2 }),
  poorThreshold: decimal("poor_threshold", { precision: 18, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// KPI Actuals (recorded values)
export const kpiActuals = pgTable("kpi_actuals", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  kpiId: uuid("kpi_id").notNull().references(() => kpiMaster.id),
  targetId: uuid("target_id").references(() => kpiTargets.id),
  branchId: uuid("branch_id").references(() => branches.id),
  employeeId: uuid("employee_id").references(() => employees.id),
  
  // Period
  periodDate: date("period_date").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  periodNumber: integer("period_number"),
  
  // Values
  actualValue: decimal("actual_value", { precision: 18, scale: 2 }).notNull(),
  targetValue: decimal("target_value", { precision: 18, scale: 2 }),
  
  // Calculated
  achievementPercent: decimal("achievement_percent", { precision: 8, scale: 2 }),
  score: decimal("score", { precision: 5, scale: 2 }),
  rating: varchar("rating", { length: 20 }), // excellent, good, average, poor
  
  // Source
  sourceDocType: varchar("source_doc_type", { length: 50 }),
  sourceDocId: uuid("source_doc_id"),
  
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// KPI Scorecards (aggregate view)
export const kpiScorecards = pgTable("kpi_scorecards", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  employeeId: uuid("employee_id").references(() => employees.id),
  
  // Period
  fiscalYear: integer("fiscal_year").notNull(),
  periodNumber: integer("period_number"),
  
  // Aggregate scores
  totalScore: decimal("total_score", { precision: 8, scale: 2 }),
  weightedScore: decimal("weighted_score", { precision: 8, scale: 2 }),
  overallRating: varchar("overall_rating", { length: 20 }),
  
  // Breakdown (JSON for flexibility)
  categoryScores: jsonb("category_scores"),
  
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const kpiMasterRelations = relations(kpiMaster, ({ one, many }) => ({
  company: one(companies, { fields: [kpiMaster.companyId], references: [companies.id] }),
  category: one(kpiCategories, { fields: [kpiMaster.categoryId], references: [kpiCategories.id] }),
  targets: many(kpiTargets),
  actuals: many(kpiActuals),
}));

export const kpiTargetsRelations = relations(kpiTargets, ({ one }) => ({
  kpi: one(kpiMaster, { fields: [kpiTargets.kpiId], references: [kpiMaster.id] }),
}));

export const kpiActualsRelations = relations(kpiActuals, ({ one }) => ({
  kpi: one(kpiMaster, { fields: [kpiActuals.kpiId], references: [kpiMaster.id] }),
  target: one(kpiTargets, { fields: [kpiActuals.targetId], references: [kpiTargets.id] }),
}));
