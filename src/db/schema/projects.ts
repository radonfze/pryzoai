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
import { customers } from "./customers";
import { employees } from "./employees";

// Project status
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  
  projectCode: varchar("project_code", { length: 50 }).notNull(),
  projectName: varchar("project_name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  completedDate: date("completed_date"),
  
  // Budget
  budgetAmount: decimal("budget_amount", { precision: 18, scale: 2 }).default("0"),
  actualCost: decimal("actual_cost", { precision: 18, scale: 2 }).default("0"),
  billedAmount: decimal("billed_amount", { precision: 18, scale: 2 }).default("0"),
  
  // Manager
  projectManagerId: uuid("project_manager_id").references(() => employees.id),
  
  status: projectStatusEnum("status").default("draft").notNull(),
  completionPercent: decimal("completion_percent", { precision: 5, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Project Tasks
export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  parentTaskId: uuid("parent_task_id"), // For sub-tasks
  
  taskCode: varchar("task_code", { length: 50 }).notNull(),
  taskName: varchar("task_name", { length: 200 }).notNull(),
  description: text("description"),
  
  startDate: date("start_date"),
  endDate: date("end_date"),
  estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }).default("0"),
  actualHours: decimal("actual_hours", { precision: 8, scale: 2 }).default("0"),
  
  assignedTo: uuid("assigned_to").references(() => employees.id),
  priority: varchar("priority", { length: 10 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AMC Contracts
export const amcContracts = pgTable("amc_contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  
  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  contractName: varchar("contract_name", { length: 200 }),
  
  // Dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  renewalDate: date("renewal_date"),
  
  // Pricing
  contractValue: decimal("contract_value", { precision: 18, scale: 2 }).notNull(),
  billingFrequency: varchar("billing_frequency", { length: 20 }).default("monthly"), // monthly, quarterly, yearly
  
  // Visits
  totalVisits: integer("total_visits").default(0),
  completedVisits: integer("completed_visits").default(0),
  
  // Equipment covered
  equipmentDetails: jsonb("equipment_details"),
  
  status: varchar("status", { length: 20 }).default("active").notNull(), // draft, active, expired, cancelled
  autoRenew: boolean("auto_renew").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// AMC Visits
export const amcVisits = pgTable("amc_visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  contractId: uuid("contract_id").notNull().references(() => amcContracts.id),
  
  visitNumber: varchar("visit_number", { length: 50 }).notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  actualDate: date("actual_date"),
  
  technicianId: uuid("technician_id").references(() => employees.id),
  
  // Service details
  workPerformed: text("work_performed"),
  partsUsed: jsonb("parts_used"),
  customerSignature: boolean("customer_signature").default(false),
  
  status: varchar("status", { length: 20 }).default("scheduled").notNull(), // scheduled, in_progress, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Work Orders
export const workOrders = pgTable("work_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  projectId: uuid("project_id").references(() => projects.id),
  amcContractId: uuid("amc_contract_id").references(() => amcContracts.id),
  
  workOrderNumber: varchar("work_order_number", { length: 50 }).notNull(),
  workOrderDate: date("work_order_date").notNull(),
  
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 10 }).default("medium"),
  
  // Assignment
  assignedTo: uuid("assigned_to").references(() => employees.id),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  
  // Costing
  estimatedCost: decimal("estimated_cost", { precision: 18, scale: 2 }).default("0"),
  actualCost: decimal("actual_cost", { precision: 18, scale: 2 }).default("0"),
  laborCost: decimal("labor_cost", { precision: 18, scale: 2 }).default("0"),
  materialCost: decimal("material_cost", { precision: 18, scale: 2 }).default("0"),
  
  status: varchar("status", { length: 20 }).default("open").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Employee Attendance
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  
  attendanceDate: date("attendance_date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  
  // Hours
  workHours: decimal("work_hours", { precision: 5, scale: 2 }).default("0"),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).default("0"),
  
  status: varchar("status", { length: 20 }).default("present").notNull(), // present, absent, half_day, leave
  remarks: text("remarks"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, { fields: [projects.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [projects.customerId], references: [customers.id] }),
  tasks: many(projectTasks),
  workOrders: many(workOrders),
}));

export const amcContractsRelations = relations(amcContracts, ({ one, many }) => ({
  company: one(companies, { fields: [amcContracts.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [amcContracts.customerId], references: [customers.id] }),
  visits: many(amcVisits),
}));

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  company: one(companies, { fields: [workOrders.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [workOrders.customerId], references: [customers.id] }),
  project: one(projects, { fields: [workOrders.projectId], references: [projects.id] }),
  amcContract: one(amcContracts, { fields: [workOrders.amcContractId], references: [amcContracts.id] }),
}));
