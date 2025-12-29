"use server";

import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type CompanyData = {
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  fiscalYearStart: string;
  timezone?: string;
  dateFormat?: string;
};

export async function getCompanySettings(companyId: string) {
  try {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    });
    
    return company;
  } catch (error) {
    console.error("Get company error:", error);
    return null;
  }
}

export async function updateCompanySettings(
  companyId: string,
  data: CompanyData
): Promise<ActionResponse> {
  try {
    console.log("updateCompanySettings called for ID:", companyId);
    console.log("Data:", data);

    // First check if company exists
    const existing = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    });
    
    console.log("Existing company found:", !!existing);
    
    if (existing) {
      // Update existing company
      await db
        .update(companies)
        .set({
          name: data.name,
          legalName: data.legalName,
          taxId: data.taxId,
          email: data.email,
          phone: data.phone,
          website: data.website,
          address: data.address,
          city: data.city,
          country: data.country,
          currency: data.currency,
          fiscalYearStart: parseInt(data.fiscalYearStart),
          timezone: data.timezone,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));
    } else {
      // Create new company with specified ID
      await db.insert(companies).values({
        id: companyId,
        name: data.name,
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        country: data.country,
        currency: data.currency,
        fiscalYearStart: parseInt(data.fiscalYearStart),
        timezone: data.timezone,
        active: true,
      });
    }

    revalidatePath("/settings/company");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Company settings saved successfully",
    };
  } catch (error: any) {
    console.error("Update company error:", error);
    return {
      success: false,
      message: error.message || "Failed to update company settings",
    };
  }
}
