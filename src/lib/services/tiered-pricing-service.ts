"use server";

import { db } from "@/db";
import { itemPriceTiers, items } from "@/db/schema";
import { eq, and, lte, or, isNull, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export interface TieredPriceResult {
  originalPrice: number;
  tieredPrice: number;
  tierApplied: boolean;
  tierName?: string;
  discountPercentage: number;
  savings: number;
}

/**
 * Get the best price for an item based on quantity
 * Checks tiered pricing tables for quantity-based discounts
 */
export async function getTieredPrice(
  itemId: string,
  quantity: number,
  basePrice?: number
): Promise<TieredPriceResult> {
  const session = await getSession();
  if (!session?.companyId) {
    return {
      originalPrice: basePrice || 0,
      tieredPrice: basePrice || 0,
      tierApplied: false,
      discountPercentage: 0,
      savings: 0,
    };
  }

  // Get item's base price if not provided
  let originalPrice = basePrice;
  if (!originalPrice) {
    const item = await db.query.items.findFirst({
      where: eq(items.id, itemId),
      columns: { sellingPrice: true },
    });
    originalPrice = Number(item?.sellingPrice) || 0;
  }

  const today = new Date().toISOString().split("T")[0];

  // Find the best applicable tier
  const applicableTier = await db.query.itemPriceTiers.findFirst({
    where: and(
      eq(itemPriceTiers.itemId, itemId),
      eq(itemPriceTiers.companyId, session.companyId),
      eq(itemPriceTiers.isActive, true),
      lte(itemPriceTiers.minQuantity, quantity.toString()),
      or(
        isNull(itemPriceTiers.maxQuantity),
        gte(itemPriceTiers.maxQuantity, quantity.toString())
      ),
      lte(itemPriceTiers.effectiveDate, today),
      or(
        isNull(itemPriceTiers.expiryDate),
        gte(itemPriceTiers.expiryDate, today)
      )
    ),
    orderBy: (tiers, { desc }) => [desc(tiers.minQuantity)], // Get highest qualifying tier
  });

  if (!applicableTier) {
    return {
      originalPrice,
      tieredPrice: originalPrice,
      tierApplied: false,
      discountPercentage: 0,
      savings: 0,
    };
  }

  const tieredPrice = Number(applicableTier.unitPrice);
  const discountPercentage = Number(applicableTier.discountPercentage) || 
    ((originalPrice - tieredPrice) / originalPrice) * 100;
  const savings = (originalPrice - tieredPrice) * quantity;

  return {
    originalPrice,
    tieredPrice,
    tierApplied: true,
    tierName: applicableTier.tierName,
    discountPercentage: Math.round(discountPercentage * 100) / 100,
    savings: Math.round(savings * 100) / 100,
  };
}

/**
 * Get all active price tiers for an item
 */
export async function getItemPriceTiers(itemId: string) {
  const session = await getSession();
  if (!session?.companyId) return [];

  const today = new Date().toISOString().split("T")[0];

  return db.query.itemPriceTiers.findMany({
    where: and(
      eq(itemPriceTiers.itemId, itemId),
      eq(itemPriceTiers.companyId, session.companyId),
      eq(itemPriceTiers.isActive, true),
      lte(itemPriceTiers.effectiveDate, today),
      or(
        isNull(itemPriceTiers.expiryDate),
        gte(itemPriceTiers.expiryDate, today)
      )
    ),
    orderBy: (tiers, { asc }) => [asc(tiers.minQuantity)],
  });
}

/**
 * Create or update a price tier for an item
 */
export async function upsertPriceTier(data: {
  itemId: string;
  tierName: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discountPercentage?: number;
  effectiveDate?: string;
  expiryDate?: string;
}) {
  const session = await getSession();
  if (!session?.companyId) {
    return { success: false, message: "No active session" };
  }

  try {
    // Check if tier exists
    const existingTier = await db.query.itemPriceTiers.findFirst({
      where: and(
        eq(itemPriceTiers.itemId, data.itemId),
        eq(itemPriceTiers.tierName, data.tierName),
        eq(itemPriceTiers.companyId, session.companyId)
      ),
    });

    if (existingTier) {
      // Update existing tier
      await db
        .update(itemPriceTiers)
        .set({
          minQuantity: data.minQuantity.toString(),
          maxQuantity: data.maxQuantity?.toString(),
          unitPrice: data.unitPrice.toFixed(2),
          discountPercentage: data.discountPercentage?.toFixed(2) || "0",
          effectiveDate: data.effectiveDate || new Date().toISOString().split("T")[0],
          expiryDate: data.expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(itemPriceTiers.id, existingTier.id));

      return { success: true, message: "Price tier updated", tierId: existingTier.id };
    } else {
      // Create new tier
      const [newTier] = await db
        .insert(itemPriceTiers)
        .values({
          companyId: session.companyId,
          itemId: data.itemId,
          tierName: data.tierName,
          minQuantity: data.minQuantity.toString(),
          maxQuantity: data.maxQuantity?.toString(),
          unitPrice: data.unitPrice.toFixed(2),
          discountPercentage: data.discountPercentage?.toFixed(2) || "0",
          effectiveDate: data.effectiveDate || new Date().toISOString().split("T")[0],
          expiryDate: data.expiryDate,
          createdBy: session.userId,
        })
        .returning();

      return { success: true, message: "Price tier created", tierId: newTier.id };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save price tier" };
  }
}
