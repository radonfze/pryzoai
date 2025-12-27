"use server";

import { db } from "@/db";
import { warehouses } from "@/db/schema";

interface CreateWarehouseData {
  name: string;
  code: string;
  address?: string;
}

export async function createWarehouse(data: CreateWarehouseData, companyId: string) {
  try {
    const [warehouse] = await db
      .insert(warehouses)
      .values({
        companyId,
        name: data.name,
        code: data.code,
        address: data.address || null,
        isActive: true,
      })
      .returning({ id: warehouses.id });

    return { success: true, id: warehouse.id };
  } catch (error) {
    console.error("Failed to create warehouse:", error);
    return { success: false, error: String(error) };
  }
}
