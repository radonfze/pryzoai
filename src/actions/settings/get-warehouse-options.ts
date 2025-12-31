"use server";

import { db } from "@/db";
import { warehouses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function getWarehouseOptions() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return await db.query.warehouses.findMany({
    where: and(
        eq(warehouses.companyId, companyId),
        eq(warehouses.isActive, true)
    ),
    columns: {
        id: true,
        name: true,
        code: true
    }
  });
}
