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
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, branches } from "./companies";
import { customers } from "./customers";
import { users } from "./users";
import { items } from "./items";
import { salesInvoices } from "./sales";

// Warranty Claim Status
export const warrantyStatusEnum = pgEnum("warranty_status", [
  "received",
  "inspected",
  "approved_repair",
  "approved_replace",
  "rejected",
  "completed",
]);

// Warranty Claims
export const warrantyClaims = pgTable("warranty_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  
  claimNumber: varchar("claim_number", { length: 50 }).notNull(),
  claimDate: timestamp("claim_date").defaultNow().notNull(),
  
  // Item Details
  invoiceId: uuid("invoice_id").references(() => salesInvoices.id),
  itemId: uuid("item_id").notNull().references(() => items.id),
  serialNumber: varchar("serial_number", { length: 100 }), // The faulty unit
  
  issueDescription: text("issue_description").notNull(),
  photos: jsonb("photos"), // Array of URLs
  
  status: warrantyStatusEnum("status").default("received").notNull(),
  
  // Decision
  decision: varchar("decision", { length: 20 }), // repair, replace, refund, reject
  decisionReason: text("decision_reason"),
  approvedBy: uuid("approved_by").references(() => users.id),
  
  // Resolution Links
  replacementSerialNumber: varchar("replacement_serial_number", { length: 100 }),
  serviceTicketId: uuid("service_ticket_id"), // If repair
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const warrantyClaimsRelations = relations(warrantyClaims, ({ one }) => ({
  company: one(companies, { fields: [warrantyClaims.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [warrantyClaims.customerId], references: [customers.id] }),
  item: one(items, { fields: [warrantyClaims.itemId], references: [items.id] }),
}));
