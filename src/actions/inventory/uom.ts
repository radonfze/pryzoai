"use server";

import { toTitleCase, toUpperCase } from "@/lib/utils";

// ... inside createUom ...
      ...validation.data,
      name: toTitleCase(validation.data.name),
      code: toUpperCase(validation.data.code),
    }).returning();

// ... inside updateUom ...
    await db.update(uoms)
      .set({
        ...validation.data,
        name: toTitleCase(validation.data.name),
        code: toUpperCase(validation.data.code),
        updatedAt: new Date(),
      })
import { uoms } from "@/db/schema/items";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";

// Get next sequential UOM code
export async function getNextUomCode(): Promise<string> {
  const companyId = await getCompanyId();
  if (!companyId) return "UOM1";
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(uoms).where(eq(uoms.companyId, companyId));
    return `UOM${Number(countResult[0]?.count || 0) + 1}`;
  } catch { return "UOM1"; }
}


const uomSchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code too long"),
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  isActive: z.boolean().default(true),
});

export async function getUoms() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.select().from(uoms)
    .where(eq(uoms.companyId, companyId))
    .orderBy(desc(uoms.isActive), desc(uoms.createdAt));
}

export async function getActiveUoms() {
    const companyId = await getCompanyId();
    if (!companyId) return [];
  
    return db.select().from(uoms)
      .where(and(eq(uoms.companyId, companyId), eq(uoms.isActive, true)))
      .orderBy(uoms.name);
}

export async function createUom(data: z.infer<typeof uomSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = uomSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    // Check if code exists
    const existing = await db.select().from(uoms).where(and(eq(uoms.companyId, companyId), eq(uoms.code, validation.data.code))).limit(1);
    if (existing.length > 0) {
        return { success: false, error: "UOM Code already exists" };
    }

    const [newUom] = await db.insert(uoms).values({
      companyId,
      ...validation.data,
      name: toTitleCase(validation.data.name),
      code: toUpperCase(validation.data.code),
    }).returning();

    revalidatePath("/inventory/uom");
    return { success: true, id: newUom.id };
  } catch (error: any) {
    console.error("Failed to create uom:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUom(id: string) {
    const companyId = await getCompanyId();
    if (!companyId) throw new Error("Unauthorized");
  
    try {
      await db.delete(uoms).where(and(eq(uoms.id, id), eq(uoms.companyId, companyId)));
      revalidatePath("/inventory/uom");
      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete uom:", error);
      return { success: false, error: "Cannot delete UOM in use" };
    }
}

export async function deleteUoms(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.delete(uoms).where(and(inArray(uoms.id, ids), eq(uoms.companyId, companyId)));
    revalidatePath("/inventory/uom");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete UOMs:", error);
    return { success: false, error: "Cannot delete selected UOMs" };
  }
}

export async function getUom(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const [uom] = await db.select().from(uoms)
    .where(and(eq(uoms.id, id), eq(uoms.companyId, companyId)))
    .limit(1);
  
  return uom || null;
}

export async function updateUom(id: string, data: z.infer<typeof uomSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = uomSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    // Check if code exists for another UOM
    const existing = await db.select().from(uoms)
      .where(and(
        eq(uoms.companyId, companyId), 
        eq(uoms.code, validation.data.code)
      ))
      .limit(1);
    
    if (existing.length > 0 && existing[0].id !== id) {
      return { success: false, error: "UOM Code already exists" };
    }

    await db.update(uoms)
      .set({
        ...validation.data,
        name: toTitleCase(validation.data.name),
        code: toUpperCase(validation.data.code),
        updatedAt: new Date(),
      })
      .where(and(eq(uoms.id, id), eq(uoms.companyId, companyId)));

    revalidatePath("/inventory/uom");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update uom:", error);
    return { success: false, error: error.message };
  }
}
