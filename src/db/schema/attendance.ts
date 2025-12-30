import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";

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
