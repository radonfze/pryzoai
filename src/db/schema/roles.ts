import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";

// Roles Master - for flexible role-based access control
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isSystemRole: boolean("is_system_role").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Role Assignment (many-to-many)
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id),
});

// Relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

// Default permissions list for UI
export const PERMISSIONS = [
  // Dashboard
  "dashboard.view",
  
  // Sales
  "sales.invoices.view",
  "sales.invoices.create",
  "sales.invoices.edit",
  "sales.invoices.delete",
  "sales.orders.view",
  "sales.orders.create",
  "sales.payments.view",
  "sales.payments.create",
  
  // Procurement
  "procurement.orders.view",
  "procurement.orders.create",
  "procurement.grn.view",
  "procurement.grn.create",
  "procurement.bills.view",
  "procurement.bills.create",
  
  // Inventory
  // Inventory
  "inventory.items.view",
  "inventory.items.create",
  "inventory.items.edit",
  "inventory.items.delete",
  "inventory.items.drill_through",
  
  "inventory.adjustments.create",
  "inventory.adjustments.edit",
  "inventory.adjustments.delete",
  
  "inventory.transfer.create",
  "inventory.transfer.edit",
  "inventory.transfer.delete",
  
  "inventory.count.view",
  "inventory.count.create",
  "inventory.count.edit",
  "inventory.count.revoke",
  
  // Finance
  "finance.coa.view",
  "finance.coa.edit",
  "finance.journals.view",
  "finance.journals.create",
  "finance.bank.view",
  "finance.bank.manage",
  
  // HR
  "hr.employees.view",
  "hr.employees.manage",
  "hr.payroll.view",
  "hr.payroll.run",
  
  // Settings
  "settings.company.view",
  "settings.company.edit",
  "settings.masters.view",
  "settings.masters.manage",
  "settings.users.view",
  "settings.users.manage",
  "settings.roles.view",
  "settings.roles.manage",
] as const;

export type Permission = typeof PERMISSIONS[number];
