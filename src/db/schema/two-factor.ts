import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

// Two-Factor Authentication secrets
export const userTwoFactor = pgTable("user_two_factor", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  encryptedSecret: text("encrypted_secret").notNull(),
  backupCodes: text("backup_codes").array(), // Encrypted backup codes
  usedBackupCodes: text("used_backup_codes").array().default([]), // Track used codes
  isEnabled: boolean("is_enabled").default(false).notNull(),
  enabledAt: timestamp("enabled_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const userTwoFactorRelations = relations(userTwoFactor, ({ one }) => ({
  user: one(users, {
    fields: [userTwoFactor.userId],
    references: [users.id],
  }),
}));
