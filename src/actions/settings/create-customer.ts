"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";

interface CreateCustomerData {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  country?: string;
  creditLimit?: number;
}

export async function createCustomer(data: CreateCustomerData, companyId: string) {
  try {
    const [customer] = await db
      .insert(customers)
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
        creditLimit: String(data.creditLimit || 0),
        isActive: true,
      })
      .returning({ id: customers.id });

    return { success: true, id: customer.id };
  } catch (error) {
    console.error("Failed to create customer:", error);
    return { success: false, error: String(error) };
  }
}
