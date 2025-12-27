import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";

// Document module enum
export const documentModuleEnum = pgEnum("document_module", [
  "sales",
  "purchase",
  "inventory",
  "finance",
  "hr",
  "project",
  "asset",
]);

// Document status enum
export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
]);

// Document Type Master
export const documentTypes = pgTable("document_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(), // INV, SO, PO, GRN
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  module: documentModuleEnum("module").notNull(),
  
  // Workflow flags
  requiresApproval: boolean("requires_approval").default(false),
  requiresAttachment: boolean("requires_attachment").default(false),
  allowBackdate: boolean("allow_backdate").default(false),
  allowFutureDte: boolean("allow_future_date").default(false),
  allowEdit: boolean("allow_edit").default(true),
  allowCancel: boolean("allow_cancel").default(true),
  
  // Linked types
  sourceDocTypes: text("source_doc_types").array(), // What docs can create this
  targetDocTypes: text("target_doc_types").array(), // What docs can be created from this
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Template Master
export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  documentTypeId: uuid("document_type_id")
    .notNull()
    .references(() => documentTypes.id),
  code: varchar("code", { length: 20 }).notNull(), // TPL-INV-01
  name: varchar("name", { length: 100 }).notNull(),
  
  // Template content (HTML/PDF layout)
  headerHtml: text("header_html"),
  bodyHtml: text("body_html"),
  footerHtml: text("footer_html"),
  
  // PDF settings
  pageSize: varchar("page_size", { length: 10 }).default("A4"),
  orientation: varchar("orientation", { length: 10 }).default("portrait"),
  margins: jsonb("margins").default({ top: 20, right: 20, bottom: 20, left: 20 }),
  
  // Branding
  showLogo: boolean("show_logo").default(true),
  showTrn: boolean("show_trn").default(true),
  showBankDetails: boolean("show_bank_details").default(true),
  showTerms: boolean("show_terms").default(true),
  showSignature: boolean("show_signature").default(false),
  
  // Language
  language: varchar("language", { length: 2 }).default("en"), // en, ar
  isBilingual: boolean("is_bilingual").default(true),
  
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Terms and Conditions Master
export const termsConditions = pgTable("terms_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  documentTypeId: uuid("document_type_id").references(() => documentTypes.id),
  
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  
  sequence: varchar("sequence", { length: 5 }).default("1"),
  isMandatory: boolean("is_mandatory").default(false),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const documentTypesRelations = relations(documentTypes, ({ one, many }) => ({
  company: one(companies, {
    fields: [documentTypes.companyId],
    references: [companies.id],
  }),
  templates: many(documentTemplates),
  terms: many(termsConditions),
}));

export const documentTemplatesRelations = relations(documentTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [documentTemplates.companyId],
    references: [companies.id],
  }),
  documentType: one(documentTypes, {
    fields: [documentTemplates.documentTypeId],
    references: [documentTypes.id],
  }),
}));

export const termsConditionsRelations = relations(termsConditions, ({ one }) => ({
  company: one(companies, {
    fields: [termsConditions.companyId],
    references: [companies.id],
  }),
  documentType: one(documentTypes, {
    fields: [termsConditions.documentTypeId],
    references: [documentTypes.id],
  }),
}));
