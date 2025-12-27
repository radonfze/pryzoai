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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches, warehouses } from "./companies";
import { customers } from "./customers";
import { items } from "./items";
import { taxes, paymentTerms, currencies } from "./finance-masters";
import { users } from "./users"; // Import users for sales team members

// Sales document status
export const salesStatusEnum = pgEnum("sales_status", [
  "draft",
  "sent",
  "confirmed",
  "partial",
  "completed",
  "cancelled",
]);

// ... (Existing Sales Quotations, Orders, Invoices, Returns, Lines, Payments, Allocations)

// --- SALES TEAMS & TARGETS EXTENSION ---

// Sales Teams
export const salesTeams = pgTable("sales_teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  managerId: uuid("manager_id").references(() => users.id), // Team Lead
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Sales Team Members (Many-to-Many User <-> Team)
export const salesTeamMembers = pgTable("sales_team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  teamId: uuid("team_id").notNull().references(() => salesTeams.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  role: varchar("role", { length: 50 }).default("member"), // member, lead
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"),
  
  joinedAt: date("joined_at").defaultNow(),
  leftAt: date("left_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sales Targets
export const salesTargets = pgTable("sales_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Target can be for a Team OR a User
  teamId: uuid("team_id").references(() => salesTeams.id),
  userId: uuid("user_id").references(() => users.id),
  
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  targetAmount: decimal("target_amount", { precision: 18, scale: 2 }).notNull(),
  currencyId: uuid("currency_id").references(() => currencies.id),
  
  achievedAmount: decimal("achieved_amount", { precision: 18, scale: 2 }).default("0"),
  
  periodName: varchar("period_name", { length: 50 }), // e.g., "Q1 2024"
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations Extension
export const salesTeamsRelations = relations(salesTeams, ({ one, many }) => ({
  company: one(companies, { fields: [salesTeams.companyId], references: [companies.id] }),
  manager: one(users, { fields: [salesTeams.managerId], references: [users.id] }),
  members: many(salesTeamMembers),
  targets: many(salesTargets),
}));

export const salesTeamMembersRelations = relations(salesTeamMembers, ({ one }) => ({
  team: one(salesTeams, { fields: [salesTeamMembers.teamId], references: [salesTeams.id] }),
  user: one(users, { fields: [salesTeamMembers.userId], references: [users.id] }),
}));

export const salesTargetsRelations = relations(salesTargets, ({ one }) => ({
  team: one(salesTeams, { fields: [salesTargets.teamId], references: [salesTeams.id] }),
  user: one(users, { fields: [salesTargets.userId], references: [users.id] }),
  currency: one(currencies, { fields: [salesTargets.currencyId], references: [currencies.id] }),
}));

// Export existing tables (re-export to avoid naming conflicts if I were to copy-paste entire file)
// Note: Since I am appending, I should use `replace_file_content` or `multi_replace` effectively.
// But to ensure cleanliness, I will stick to appending or rewriting the file if it's manageable.
// Given the file size, I'll use `replace_file_content` to append at the end, but I need to handle imports carefully.
