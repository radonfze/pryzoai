"use server";

import { db } from "@/db";
import { bom, bomLines, items } from "@/db/schema/items";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const bomLineSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(0.0001, "Quantity must be greater than 0"),
  uom: z.string().optional(),
  notes: z.string().optional(),
});

const bomSchema = z.object({
  itemId: z.string().min(1, "Parent Item is required"),
  name: z.string().min(1, "BOM Name is required"), // e.g., "Standard Manufacturing", "Holiday Pack"
  isActive: z.boolean().default(true),
  lines: z.array(bomLineSchema).min(1, "At least one component is required"),
});

export async function getBoms() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.bom.findMany({
    where: eq(bom.companyId, companyId),
    with: {
        item: true,
        lines: {
            with: {
                item: true
            }
        }
    },
    orderBy: [desc(bom.createdAt)],
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
        // Create Header
        const [newBom] = await tx.insert(bom).values({
            companyId,
            itemId: validation.data.itemId,
            name: validation.data.name,
            isActive: validation.data.isActive,
        }).returning();

        // Create Lines
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
