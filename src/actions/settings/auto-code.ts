"use server";

import { generateNextNumber, previewNextNumber } from "@/lib/numbering/numbering-service";
import { db } from "@/db";
import { numberSeries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get the next auto-generated code for a given entity type
 */
export async function getNextCode(
  entityType: "CUST" | "SUPP" | "ITEM" | "WH" | "INV" | "PO" | "SO" | "JV",
  companyId: string
): Promise<{ success: boolean; code?: string; preview?: string; error?: string }> {
  try {
    // Map entity type to series code
    const seriesCodeMap: Record<string, string> = {
      CUST: "CUST",
      SUPP: "SUPP", 
      ITEM: "ITEM",
      WH: "WH",
      INV: "INV",
      PO: "PO",
      SO: "SO",
      JV: "JV",
    };

    const seriesCode = seriesCodeMap[entityType];
    if (!seriesCode) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    // Check if series exists
    const series = await db.query.numberSeries.findFirst({
      where: and(
        eq(numberSeries.companyId, companyId),
        eq(numberSeries.code, seriesCode)
      ),
    });

    if (!series) {
      // Return a fallback code if no series configured
      const fallbackCodes: Record<string, string> = {
        CUST: "CUST-00001",
        SUPP: "SUPP-00001",
        ITEM: "ITEM-00001",
        WH: "WH-00001",
        INV: "INV-00001",
        PO: "PO-00001",
        SO: "SO-00001",
        JV: "JV-00001",
      };
      return { 
        success: true, 
        preview: fallbackCodes[entityType],
        code: fallbackCodes[entityType]
      };
    }

    // Get preview of next number
    const preview = await previewNextNumber({
      companyId,
      seriesCode,
    });

    return { success: true, preview };
  } catch (error) {
    console.error("Failed to get next code:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Allocate the next code (locks it for use)
 */
export async function allocateNextCode(
  entityType: "CUST" | "SUPP" | "ITEM" | "WH" | "INV" | "PO" | "SO" | "JV",
  companyId: string
): Promise<{ success: boolean; code?: string; allocationId?: string; error?: string }> {
  try {
    const seriesCodeMap: Record<string, string> = {
      CUST: "CUST",
      SUPP: "SUPP",
      ITEM: "ITEM",
      WH: "WH",
      INV: "INV",
      PO: "PO",
      SO: "SO",
      JV: "JV",
    };

    const seriesCode = seriesCodeMap[entityType];
    if (!seriesCode) {
      return { success: false, error: `Unknown entity type: ${entityType}` };
    }

    // Check if series exists
    const series = await db.query.numberSeries.findFirst({
      where: and(
        eq(numberSeries.companyId, companyId),
        eq(numberSeries.code, seriesCode)
      ),
    });

    if (!series) {
      // Create a simple sequential code for fallback
      const count = await getEntityCount(entityType, companyId);
      const fallbackCode = `${entityType}-${String(count + 1).padStart(5, "0")}`;
      return { success: true, code: fallbackCode };
    }

    const result = await generateNextNumber({
      companyId,
      seriesCode,
    });

    return { 
      success: true, 
      code: result.number, 
      allocationId: result.allocationId 
    };
  } catch (error) {
    console.error("Failed to allocate next code:", error);
    return { success: false, error: String(error) };
  }
}

// Helper to count entities for fallback numbering
async function getEntityCount(entityType: string, companyId: string): Promise<number> {
  const { customers, suppliers, items, warehouses } = await import("@/db/schema");
  
  switch (entityType) {
    case "CUST":
      const custList = await db.query.customers.findMany({
        where: eq(customers.companyId, companyId),
        columns: { id: true },
      });
      return custList.length;
    case "SUPP":
      const suppList = await db.query.suppliers.findMany({
        where: eq(suppliers.companyId, companyId),
        columns: { id: true },
      });
      return suppList.length;
    case "ITEM":
      const itemList = await db.query.items.findMany({
        where: eq(items.companyId, companyId),
        columns: { id: true },
      });
      return itemList.length;
    case "WH":
      const whList = await db.query.warehouses.findMany({
        where: eq(warehouses.companyId, companyId),
        columns: { id: true },
      });
      return whList.length;
    default:
      return 0;
  }
}
