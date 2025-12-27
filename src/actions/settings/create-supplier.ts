"use server";

import { db } from "@/db";
import { suppliers } from "@/db/schema";

interface CreateSupplierData {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: number;
}

export async function createSupplier(data: CreateSupplierData, companyId: string) {
  try {
    const [supplier] = await db
      .insert(suppliers)
      .values({
        companyId,
        name: data.name,
        code: data.code,
        email: data.email || null,
        phone: data.phone || null,
        taxId: data.taxId || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || "UAE",
        paymentTerms: data.paymentTerms || 30,
        isActive: true,
      })
      .returning({ id: suppliers.id });

    return { success: true, id: supplier.id };
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return { success: false, error: String(error) };
  }
}
