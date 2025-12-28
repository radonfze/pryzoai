"use server";

import { db } from "@/db";
import { itemBrands } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function getBrands() {
  const companyId = await getCompanyId();
  return db.query.itemBrands.findMany({
    where: eq(itemBrands.companyId, companyId),
  });
}
