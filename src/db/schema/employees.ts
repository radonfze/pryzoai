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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";
import { users } from "./users";

// Employee status enum
export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "on_leave",
  "resigned",
  "terminated",
  "probation",
]);

// Gender enum
export const genderEnum = pgEnum("gender", ["male", "female"]);

// Employees Master (separate from Users)
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  userId: uuid("user_id").references(() => users.id), // Link to system user
  
  
  // Identity
  code: varchar("code", { length: 20 }).notNull(), // EMP-00001
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  firstNameAr: varchar("first_name_ar", { length: 100 }),
  lastNameAr: varchar("last_name_ar", { length: 100 }),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 50 }),
  
  // Contact
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  address: text("address"),
  
  // Employment
  designation: varchar("designation", { length: 100 }),
  department: varchar("department", { length: 100 }),
  joiningDate: date("joining_date").notNull(),
  probationEndDate: date("probation_end_date"),
  status: employeeStatusEnum("status").default("active").notNull(),
  
  // UAE specific
  emiratesId: varchar("emirates_id", { length: 18 }), // 784-XXXX-XXXXXXX-X
  passportNo: varchar("passport_no", { length: 20 }),
  passportExpiry: date("passport_expiry"),
  visaNo: varchar("visa_no", { length: 30 }),
  visaExpiry: date("visa_expiry"),
  laborCardNo: varchar("labor_card_no", { length: 30 }),
  laborCardExpiry: date("labor_card_expiry"),
  
  // Payroll
  basicSalary: decimal("basic_salary", { precision: 18, scale: 2 }).default("0"),
  housingAllowance: decimal("housing_allowance", { precision: 18, scale: 2 }).default("0"),
  transportAllowance: decimal("transport_allowance", { precision: 18, scale: 2 }).default("0"),
  otherAllowance: decimal("other_allowance", { precision: 18, scale: 2 }).default("0"),
  
  // Bank details (for WPS)
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNo: varchar("bank_account_no", { length: 50 }),
  bankIban: varchar("bank_iban", { length: 34 }),
  routingCode: varchar("routing_code", { length: 20 }), // WPS routing code
  
  // Leave balance
  annualLeaveBalance: decimal("annual_leave_balance", { precision: 5, scale: 2 }).default("0"),
  sickLeaveBalance: decimal("sick_leave_balance", { precision: 5, scale: 2 }).default("0"),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Employee Relations
export const employeesRelations = relations(employees, ({ one }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [employees.branchId],
    references: [branches.id],
  }),
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
}));
