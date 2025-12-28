import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  decimal,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { employees } from "./employees";
import { projects, projectTasks, workOrders } from "./projects";

// Technician Job Queue (for Mobile Sync)
export const technicianJobQueue = pgTable("technician_job_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  technicianId: uuid("technician_id").notNull().references(() => employees.id),
  
  // Job Links
  workOrderId: uuid("work_order_id").references(() => workOrders.id),
  taskId: uuid("task_id").references(() => projectTasks.id),
  
  // Sync Status
  isDownloaded: boolean("is_downloaded").default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  
  // Offline Data (Changes made offline)
  mobileStatus: varchar("mobile_status", { length: 20 }), // started, traveled, completed
  mobileNotes: text("mobile_notes"),
  mobileSignature: text("mobile_signature"), // Base64 or URL
  isDirty: boolean("is_dirty").default(false), // Needs upload to main DB
  
  scheduledStart: timestamp("scheduled_start"),
  priority: varchar("priority", { length: 10 }).default("medium"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const technicianJobQueueRelations = relations(technicianJobQueue, ({ one }) => ({
  company: one(companies, { fields: [technicianJobQueue.companyId], references: [companies.id] }),
  technician: one(employees, { fields: [technicianJobQueue.technicianId], references: [employees.id] }),
  workOrder: one(workOrders, { fields: [technicianJobQueue.workOrderId], references: [workOrders.id] }),
}));
