"use server";

import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, getCompanyId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface EmailTemplateInput {
  id?: string;
  templateName: string;
  templateType: string;
  subject: string;
  body: string;
  variables?: string[];
  isDefault?: boolean;
}

export async function getEmailTemplates() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.emailTemplates.findMany({
    where: and(
      eq(emailTemplates.companyId, companyId),
      eq(emailTemplates.isActive, true)
    ),
    orderBy: (t, { asc }) => [asc(t.templateType), asc(t.templateName)],
  });
}

export async function getEmailTemplate(id: string) {
  return db.query.emailTemplates.findFirst({
    where: eq(emailTemplates.id, id),
  });
}

export async function saveEmailTemplate(data: EmailTemplateInput) {
  const companyId = await getCompanyId();
  const session = await getSession();
  
  if (!companyId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    if (data.id) {
      // Update existing
      await db.update(emailTemplates)
        .set({
          templateName: data.templateName,
          templateType: data.templateType,
          subject: data.subject,
          body: data.body,
          variables: data.variables || [],
          isDefault: data.isDefault || false,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, data.id));

      revalidatePath("/settings/email-templates");
      return { success: true, message: "Template updated" };
    } else {
      // Create new
      const [newTemplate] = await db.insert(emailTemplates)
        .values({
          companyId,
          templateName: data.templateName,
          templateType: data.templateType,
          subject: data.subject,
          body: data.body,
          variables: data.variables || [],
          isDefault: data.isDefault || false,
          createdBy: session?.userId,
        })
        .returning();

      revalidatePath("/settings/email-templates");
      return { success: true, message: "Template created", id: newTemplate.id };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save template" };
  }
}

export async function deleteEmailTemplate(id: string) {
  try {
    await db.update(emailTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id));

    revalidatePath("/settings/email-templates");
    return { success: true, message: "Template deleted" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete template" };
  }
}

// Template variable placeholders
export const TEMPLATE_VARIABLES = {
  invoice: [
    "{{customer_name}}",
    "{{invoice_number}}",
    "{{invoice_date}}",
    "{{due_date}}",
    "{{total_amount}}",
    "{{balance_amount}}",
    "{{company_name}}",
    "{{company_email}}",
    "{{company_phone}}",
  ],
  quotation: [
    "{{customer_name}}",
    "{{quotation_number}}",
    "{{quotation_date}}",
    "{{valid_until}}",
    "{{total_amount}}",
    "{{company_name}}",
  ],
  reminder: [
    "{{customer_name}}",
    "{{invoice_number}}",
    "{{days_overdue}}",
    "{{balance_amount}}",
    "{{company_name}}",
  ],
  payment_receipt: [
    "{{customer_name}}",
    "{{payment_number}}",
    "{{payment_date}}",
    "{{payment_amount}}",
    "{{payment_method}}",
    "{{company_name}}",
  ],
};
