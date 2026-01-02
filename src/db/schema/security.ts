import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

// OTP Purpose enum
export const otpPurposeEnum = pgEnum("otp_purpose", [
  "delete_master",       // Delete master data (customers, items, etc.)
  "reset_edit_password", // Reset edit password
  "cancel_document",     // High-value document cancellation
  "admin_override",      // Admin emergency access
]);

// OTP Verifications table
export const otpVerifications = pgTable("otp_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // OTP details
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  purpose: otpPurposeEnum("purpose").notNull(),
  
  // Context (what record is being affected)
  targetTable: varchar("target_table", { length: 100 }),
  targetId: uuid("target_id"),
  
  // Timing
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Edit Password verification log (for audit trail)
export const editPasswordLogs = pgTable("edit_password_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Action context
  action: varchar("action", { length: 50 }).notNull(), // "edit_invoice", "edit_item", etc.
  targetTable: varchar("target_table", { length: 100 }).notNull(),
  targetId: uuid("target_id").notNull(),
  
  // Result
  success: varchar("success", { length: 10 }).notNull(), // "true" or "false"
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
  user: one(users, {
    fields: [otpVerifications.userId],
    references: [users.id],
  }),
}));

export const editPasswordLogsRelations = relations(editPasswordLogs, ({ one }) => ({
  user: one(users, {
    fields: [editPasswordLogs.userId],
    references: [users.id],
  }),
}));
