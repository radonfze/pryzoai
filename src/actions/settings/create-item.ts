"use server";

import { db } from "@/db";
import { items } from "@/db/schema";

interface CreateItemData {
  name: string;
  sku: string;
  itemType: "product" | "service" | "consumable";
  uom: string;
  sellingPrice?: number;
  costPrice?: number;
  taxable?: boolean;
}

export async function createItem(data: CreateItemData, companyId: string) {
  try {
    const [item] = await db
      .insert(items)
      .values({
        companyId,
        name: data.name,
        sku: data.sku,
        itemType: data.itemType,
        uom: data.uom,
        sellingPrice: String(data.sellingPrice || 0),
        costPrice: String(data.costPrice || 0),
        taxable: data.taxable ?? true,
        isActive: true,
      })
      .returning({ id: items.id });

    return { success: true, id: item.id };
  } catch (error) {
    console.error("Failed to create item:", error);
    return { success: false, error: String(error) };
  }
}
