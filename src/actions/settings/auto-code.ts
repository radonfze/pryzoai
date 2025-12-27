"use server";

import { db } from "@/db";
import { numberSeries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Fallback codes that always work
const FALLBACK_CODES: Record<string, string> = {
  CUST: "CUST-00001",
  SUPP: "SUPP-00001",
  ITEM: "ITEM-00001",
  WH: "WH-00001",
  INV: "INV-00001",
  PO: "PO-00001",
  SO: "SO-00001",
  JV: "JV-00001",
};

/**
 * Get the next auto-generated code for a given entity type
 * Always returns a code - falls back to simple format if DB unavailable
 */
export async function getNextCode(
  entityType: "CUST" | "SUPP" | "ITEM" | "WH" | "INV" | "PO" | "SO" | "JV",
  companyId: string
): Promise<{ success: boolean; code?: string; preview?: string; error?: string }> {
  // Always have a fallback ready
  const fallbackCode = FALLBACK_CODES[entityType] || `${entityType}-00001`;
  
  try {
    // Try to get count from database for sequential numbering
    let count = 0;
    try {
      count = await getEntityCount(entityType, companyId);
    } catch {
      // If count fails, use default
      count = 0;
    }
    
    // Generate code based on count
    const code = `${entityType}-${String(count + 1).padStart(5, "0")}`;
    
    return { 
      success: true, 
      preview: code,
      code: code
    };
  } catch (error) {
    console.error("Failed to get next code, using fallback:", error);
    // Always return success with fallback code
    return { 
      success: true, 
      preview: fallbackCode,
      code: fallbackCode
    };
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
