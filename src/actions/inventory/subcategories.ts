"use server";

import { db } from "@/db";
import { itemCategories, itemSubcategories } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// Define simpler schema structure for list
export async function getSubcategories() {
  const companyId = await getCompanyId();
  return db.query.itemSubcategories.findMany({
    where: eq(itemSubcategories.companyId, companyId),
    with: {
      category: true,
    },
  });
}

export async function createSubcategory(data: any) {
  try {
    const companyId = await getCompanyId();
    await db.insert(itemSubcategories).values({
      ...data,
      companyId,
    });
    revalidatePath("/inventory/subcategories");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create subcategory" };
  }
}
