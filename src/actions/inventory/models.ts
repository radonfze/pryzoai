"use server";

import { db } from "@/db";
import { itemModels } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function getModels() {
  const companyId = await getCompanyId();
  return db.query.itemModels.findMany({
    where: eq(itemModels.companyId, companyId),
    with: {
      brand: true,
      subcategory: true,
    },
  });
}
