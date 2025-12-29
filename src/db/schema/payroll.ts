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
import { companies, branches } from "./companies";
import { employees } from "./employees";

// Payroll status
export const payrollStatusEnum = pgEnum("payroll_status", [
  "draft",
  "processing",
  "approved",
  "paid",
  "cancelled",
]);

// Payroll Runs
export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  
  runNumber: varchar("run_number", { length: 50 }).notNull(),
  periodMonth: integer("period_month").notNull(), // 1-12
  periodYear: integer("period_year").notNull(),
  runDate: date("run_date").notNull(),
  
  // Totals
  totalEmployees: integer("total_employees").default(0),
  totalBasicSalary: decimal("total_basic_salary", { precision: 18, scale: 2 }).default("0"),
  totalAllowances: decimal("total_allowances", { precision: 18, scale: 2 }).default("0"),
  totalDeductions: decimal("total_deductions", { precision: 18, scale: 2 }).default("0"),
  totalNetPay: decimal("total_net_pay", { precision: 18, scale: 2 }).default("0"),
  
  // WPS (UAE)
  wpsFileGenerated: boolean("wps_file_generated").default(false),
  wpsBatchNumber: varchar("wps_batch_number", { length: 50 }),
  
  status: payrollStatusEnum("status").default("draft").notNull(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  version: integer("version").default(1),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Payroll Details (per employee)
export const payrollDetails = pgTable("payroll_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  payrollRunId: uuid("payroll_run_id").notNull().references(() => payrollRuns.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  
  // Earnings
  basicSalary: decimal("basic_salary", { precision: 18, scale: 2 }).default("0"),
  housingAllowance: decimal("housing_allowance", { precision: 18, scale: 2 }).default("0"),
  transportAllowance: decimal("transport_allowance", { precision: 18, scale: 2 }).default("0"),
  otherAllowance: decimal("other_allowance", { precision: 18, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 18, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 18, scale: 2 }).default("0"),
  
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 2 }).default("0"),
  
  // Deductions
  absenceDeduction: decimal("absence_deduction", { precision: 18, scale: 2 }).default("0"),
  loanDeduction: decimal("loan_deduction", { precision: 18, scale: 2 }).default("0"),
  advanceDeduction: decimal("advance_deduction", { precision: 18, scale: 2 }).default("0"),
  otherDeduction: decimal("other_deduction", { precision: 18, scale: 2 }).default("0"),
  
  totalDeductions: decimal("total_deductions", { precision: 18, scale: 2 }).default("0"),
  
  // Net
  netPay: decimal("net_pay", { precision: 18, scale: 2 }).default("0"),
  
  // Payment
  paymentMethod: varchar("payment_method", { length: 20 }), // wps, cash, cheque
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee Loans
export const employeeLoans = pgTable("employee_loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  
  loanNumber: varchar("loan_number", { length: 50 }).notNull(),
  loanDate: date("loan_date").notNull(),
  loanAmount: decimal("loan_amount", { precision: 18, scale: 2 }).notNull(),
  
  // Repayment
  monthlyDeduction: decimal("monthly_deduction", { precision: 18, scale: 2 }).notNull(),
  totalPaid: decimal("total_paid", { precision: 18, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 18, scale: 2 }).default("0"),
  
  startMonth: date("start_month").notNull(),
  reason: text("reason"),
  
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// End of Service Benefit (EOSB) Provisions
export const eosbProvisions = pgTable("eosb_provisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  
  asOfDate: date("as_of_date").notNull(),
  yearsOfService: decimal("years_of_service", { precision: 5, scale: 2 }).notNull(),
  
  // UAE EOSB calculation
  basicSalary: decimal("basic_salary", { precision: 18, scale: 2 }).notNull(),
  eosbAmount: decimal("eosb_amount", { precision: 18, scale: 2 }).notNull(),
  
  // If resigned
  resignationType: varchar("resignation_type", { length: 20 }), // voluntary, involuntary
  eosbPercentage: decimal("eosb_percentage", { precision: 5, scale: 2 }), // % based on resignation type
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Leave Transactions
export const leaveTransactions = pgTable("leave_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  
  requestNumber: varchar("request_number", { length: 50 }).notNull(),
  leaveType: varchar("leave_type", { length: 20 }).notNull(), // annual, sick, unpaid, maternity
  
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: decimal("days", { precision: 5, scale: 2 }).notNull(),
  
  reason: text("reason"),
  
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected, cancelled
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  company: one(companies, { fields: [payrollRuns.companyId], references: [companies.id] }),
  details: many(payrollDetails),
}));

export const payrollDetailsRelations = relations(payrollDetails, ({ one }) => ({
  payrollRun: one(payrollRuns, { fields: [payrollDetails.payrollRunId], references: [payrollRuns.id] }),
  employee: one(employees, { fields: [payrollDetails.employeeId], references: [employees.id] }),
}));

export const employeeLoansRelations = relations(employeeLoans, ({ one }) => ({
  company: one(companies, { fields: [employeeLoans.companyId], references: [companies.id] }),
  employee: one(employees, { fields: [employeeLoans.employeeId], references: [employees.id] }),
}));

export const leaveTransactionsRelations = relations(leaveTransactions, ({ one }) => ({
  company: one(companies, { fields: [leaveTransactions.companyId], references: [companies.id] }),
  employee: one(employees, { fields: [leaveTransactions.employeeId], references: [employees.id] }),
}));
