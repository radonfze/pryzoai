import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  inet,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";

// Document History/Audit Trail - tracks all changes to sales documents
export const documentHistory = pgTable("document_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Reference to the document (polymorphic - can reference any sales document)
  documentId: uuid("document_id").notNull(),
  documentType: varchar("document_type", { length: 20 }).notNull(), // quotation, invoice, order, return
  documentNumber: varchar("document_number", { length: 50 }),
  
  // Action details
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, STATUS_CHANGE, EMAIL_SENT, PRINTED, POSTED, CANCELLED, REVERSED
  
  // Change tracking (JSONB for flexibility)
  previousValue: jsonb("previous_value"), // State before change
  newValue: jsonb("new_value"), // State after change
  changes: jsonb("changes"), // Diff of what changed
  
  // Who made the change
  performedBy: uuid("performed_by").references(() => users.id),
  
  // Request metadata
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const documentHistoryRelations = relations(documentHistory, ({ one }) => ({
  company: one(companies, {
    fields: [documentHistory.companyId],
    references: [companies.id],
  }),
  performer: one(users, {
    fields: [documentHistory.performedBy],
    references: [users.id],
  }),
}));
