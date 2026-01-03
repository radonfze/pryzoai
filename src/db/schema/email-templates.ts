import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

// Email Templates for documents
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Template identification
  templateName: varchar("template_name", { length: 100 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // invoice, quotation, reminder, payment_receipt, etc.
  
  // Email content
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  
  // Available variables (for UI help)
  variables: jsonb("variables").default('[]'), // ["customer_name", "invoice_number", "amount", etc.]
  
  // Status
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Print Templates for documents
export const printTemplates = pgTable("print_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Template identification
  templateName: varchar("template_name", { length: 100 }).notNull(),
  documentType: varchar("document_type", { length: 20 }).notNull(), // invoice, quotation, order, etc.
  
  // Template content
  htmlTemplate: text("html_template").notNull(),
  cssStyles: text("css_styles"),
  
  // Settings
  settings: jsonb("settings").default(JSON.stringify({
    paperSize: "A4",
    orientation: "portrait",
    margin: "20mm",
    includeLogo: true,
    includeBankDetails: true,
    includeSignature: true,
    showSKU: false,
  })),
  
  // Status
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

// Relations
export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [emailTemplates.companyId],
    references: [companies.id],
  }),
}));

export const printTemplatesRelations = relations(printTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [printTemplates.companyId],
    references: [companies.id],
  }),
}));
