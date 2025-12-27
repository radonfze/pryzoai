import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";

// Action type enum
export const actionTypeEnum = pgEnum("action_type", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "CANCEL",
  "APPROVE",
  "REJECT",
  "LOGIN",
  "LOGOUT",
]);

// Audit Logs - Immutable, hash-chained
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  userId: uuid("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // invoice, customer, payment, etc.
  entityId: uuid("entity_id"),
  action: actionTypeEnum("action").notNull(),
  beforeValue: jsonb("before_value"), // Snapshot before change
  afterValue: jsonb("after_value"), // Snapshot after change
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  reason: text("reason"), // For cancellations
  previousHash: text("previous_hash"), // Hash chain for tamper detection
  currentHash: text("current_hash"), // SHA-256 of this record
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
