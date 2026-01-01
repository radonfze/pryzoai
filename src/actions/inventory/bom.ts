"use server";

import { db } from "@/db";
import { bom, bomLines, items } from "@/db/schema/items";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, and, inArray } from "drizzle-orm";
import { z } from "zod";

const bomLineSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(0.0001, "Quantity must be greater than 0"),
  uom: z.string().optional(),
  notes: z.string().optional(),
});

const bomSchema = z.object({
  itemId: z.string().min(1, "Parent Item is required"),
  name: z.string().min(1, "BOM Name is required"),
  isActive: z.boolean().default(true),
  lines: z.array(bomLineSchema).min(1, "At least one component is required"),
});

export async function getBoms() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.bom.findMany({
    where: eq(bom.companyId, companyId),
    with: {
        parentItem: true,
        lines: {
            with: {
                componentItem: true
            }
        }
    },
    orderBy: [desc(bom.createdAt)],
  });
}

export async function getBomById(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return db.query.bom.findFirst({
    where: and(eq(bom.id, id), eq(bom.companyId, companyId)),
    with: {
      parentItem: true,
      lines: {
        with: {
          componentItem: true
        }
      }
    },
  });
}

export async function createBom(data: z.infer<typeof bomSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = bomSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
     return await db.transaction(async (tx) => {
        const [newBom] = await tx.insert(bom).values({
            companyId,
            itemId: validation.data.itemId,
            name: validation.data.name,
            isActive: validation.data.isActive,
        }).returning();

        if (validation.data.lines.length > 0) {
            await tx.insert(bomLines).values(
                validation.data.lines.map(line => ({
                    bomId: newBom.id,
                    itemId: line.itemId,
                    quantity: line.quantity.toString(),
                    uom: line.uom,
                    notes: line.notes
                }))
            );
        }

        revalidatePath("/inventory/bom");
        return { success: true, id: newBom.id };
     });
  } catch (error: any) {
    console.error("Failed to create BOM:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBom(id: string, data: z.infer<typeof bomSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = bomSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    return await db.transaction(async (tx) => {
      // Update header
      await tx.update(bom)
        .set({
          itemId: validation.data.itemId,
          name: validation.data.name,
          isActive: validation.data.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(bom.id, id), eq(bom.companyId, companyId)));

      // Delete old lines
      await tx.delete(bomLines).where(eq(bomLines.bomId, id));

      // Insert new lines
      if (validation.data.lines.length > 0) {
        await tx.insert(bomLines).values(
          validation.data.lines.map(line => ({
            bomId: id,
            itemId: line.itemId,
            quantity: line.quantity.toString(),
            uom: line.uom,
            notes: line.notes
          }))
        );
      }

      revalidatePath("/inventory/bom");
      revalidatePath(`/inventory/bom/${id}`);
      return { success: true, id };
    });
  } catch (error: any) {
    console.error("Failed to update BOM:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBom(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.transaction(async (tx) => {
      // Delete lines first
      await tx.delete(bomLines).where(eq(bomLines.bomId, id));
      // Delete header
      await tx.delete(bom).where(and(eq(bom.id, id), eq(bom.companyId, companyId)));
    });

    revalidatePath("/inventory/bom");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete BOM:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBoms(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.transaction(async (tx) => {
      // Delete lines first
      await tx.delete(bomLines).where(inArray(bomLines.bomId, ids));
      // Delete headers
      await tx.delete(bom).where(and(inArray(bom.id, ids), eq(bom.companyId, companyId)));
    });

    revalidatePath("/inventory/bom");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete BOMs:", error);
    return { success: false, error: error.message };
  }
}

