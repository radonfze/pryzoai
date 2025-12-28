import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";

// Approval status enum
export const approvalStatusEnum = pgEnum("approval_status", [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

// Approval rule type enum
export const approvalRuleTypeEnum = pgEnum("approval_rule_type", [
  "AMOUNT_THRESHOLD",
  "DOCUMENT_TYPE",
  "DEPARTMENT",
  "ALWAYS",
]);

// Approval Rules - Define when approval is required
export const approvalRules = pgTable("approval_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  name: varchar("name", { length: 150 }).notNull(),
  documentType: text("document_type").notNull(), // invoice, purchase_order, payment, etc.
  ruleType: approvalRuleTypeEnum("rule_type").notNull(),
  minAmount: integer("min_amount"), // Threshold for AMOUNT_THRESHOLD type
  maxAmount: integer("max_amount"),
  priority: integer("priority").default(1), // Order of evaluation
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Approval Steps - Multi-level approval workflow
export const approvalSteps = pgTable("approval_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => approvalRules.id),
  stepOrder: integer("step_order").notNull(),
  approverId: uuid("approver_id").references(() => users.id),
  roleName: varchar("role_name", { length: 100 }), // Alternative to specific user
  isRequired: boolean("is_required").default(true),
  autoApproveAfterDays: integer("auto_approve_after_days"), // Auto-approve if not actioned
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Approval Requests - Track document approval status
export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  documentType: text("document_type").notNull(),
  documentId: uuid("document_id").notNull(),
  documentNumber: varchar("document_number", { length: 50 }),
  ruleId: uuid("rule_id").references(() => approvalRules.id),
  currentStep: integer("current_step").default(1),
  status: approvalStatusEnum("status").default("PENDING"),
  requestedBy: uuid("requested_by").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Approval Actions - History of approval/rejection actions
export const approvalActions = pgTable("approval_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => approvalRequests.id),
  stepId: uuid("step_id").references(() => approvalSteps.id),
  actionBy: uuid("action_by").references(() => users.id),
  action: text("action").notNull(), // APPROVE, REJECT, DELEGATE
  comments: text("comments"),
  actionAt: timestamp("action_at").defaultNow().notNull(),
});

// Daily Lockdown - Prevent changes to past periods
export const periodLockdown = pgTable("period_lockdown", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  lockedDate: timestamp("locked_date").notNull(), // All transactions before this date are locked
  lockedBy: uuid("locked_by").references(() => users.id),
  lockedAt: timestamp("locked_at").defaultNow().notNull(),
  reason: text("reason"),
});

// Relations
export const approvalRulesRelations = relations(approvalRules, ({ one, many }) => ({
  company: one(companies, {
    fields: [approvalRules.companyId],
    references: [companies.id],
  }),
  steps: many(approvalSteps),
  requests: many(approvalRequests),
}));

export const approvalStepsRelations = relations(approvalSteps, ({ one }) => ({
  rule: one(approvalRules, {
    fields: [approvalSteps.ruleId],
    references: [approvalRules.id],
  }),
  approver: one(users, {
    fields: [approvalSteps.approverId],
    references: [users.id],
  }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  company: one(companies, {
    fields: [approvalRequests.companyId],
    references: [companies.id],
  }),
  rule: one(approvalRules, {
    fields: [approvalRequests.ruleId],
    references: [approvalRules.id],
  }),
  requestedByUser: one(users, {
    fields: [approvalRequests.requestedBy],
    references: [users.id],
  }),
  actions: many(approvalActions),
}));

export const approvalActionsRelations = relations(approvalActions, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [approvalActions.requestId],
    references: [approvalRequests.id],
  }),
  step: one(approvalSteps, {
    fields: [approvalActions.stepId],
    references: [approvalSteps.id],
  }),
  actionByUser: one(users, {
    fields: [approvalActions.actionBy],
    references: [users.id],
  }),
}));

export const periodLockdownRelations = relations(periodLockdown, ({ one }) => ({
  company: one(companies, {
    fields: [periodLockdown.companyId],
    references: [companies.id],
  }),
  lockedByUser: one(users, {
    fields: [periodLockdown.lockedBy],
    references: [users.id],
  }),
}));
