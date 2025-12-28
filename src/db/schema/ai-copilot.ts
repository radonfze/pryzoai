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
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";

// Allowed Actions Enum
export const aiActionEnum = pgEnum("ai_action", [
  "create",
  "read",
  "update",
  "delete",
  "approve",
  "reject",
]);

// AI Copilot Policies
export const copilotPolicies = pgTable("copilot_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  policyName: varchar("policy_name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Scope
  module: varchar("module", { length: 50 }).notNull(), // e.g., 'sales', 'hr', 'all'
  action: aiActionEnum("action").notNull(),
  
  // Constraints
  requiresApproval: boolean("requires_approval").default(false),
  approvalThreshold: decimal("approval_threshold", { precision: 18, scale: 2 }), // e.g., Value > 1000 requires approval
  maxDailyActions: decimal("max_daily_actions", { precision: 5, scale: 0 }),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Audit Log for AI Actions
export const auditAiActions = pgTable("audit_ai_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  actionType: aiActionEnum("action_type").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // e.g., 'invoice', 'employee'
  entityId: varchar("entity_id", { length: 50 }),
  
  // Context
  prompt: text("prompt"), // What the user asked
  aiResponse: text("ai_response"), // What AI proposed
  executedCode: text("executed_code"), // JSON or SQL representation
  
  status: varchar("status", { length: 20 }).default("success"), // success, failed, blocked, pending_approval
  blockedReason: text("blocked_reason"),
  
  performedByUserId: uuid("performed_by_user_id").references(() => users.id), // The user guiding the AI
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const copilotPoliciesRelations = relations(copilotPolicies, ({ one }) => ({
  company: one(companies, { fields: [copilotPolicies.companyId], references: [companies.id] }),
}));

export const auditAiActionsRelations = relations(auditAiActions, ({ one }) => ({
  company: one(companies, { fields: [auditAiActions.companyId], references: [companies.id] }),
  user: one(users, { fields: [auditAiActions.performedByUserId], references: [users.id] }),
}));
