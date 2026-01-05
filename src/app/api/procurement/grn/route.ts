import { db } from "@/db";
import { goodsReceipts, purchaseLines, purchaseOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grns = await db.query.goodsReceipts.findMany({
      where: eq(goodsReceipts.companyId, companyId),
      orderBy: [desc(goodsReceipts.grnDate)],
      with: {
        supplier: true,
        purchaseOrder: true,
        lines: true,
      },
    });

    return NextResponse.json({ success: true, data: grns });
  } catch (error: any) {
    console.error("[GET /api/procurement/grn]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      purchaseOrderId, 
      supplierId, 
      warehouseId, 
      grnDate, 
      supplierDocNumber, 
      lines, 
      notes 
    } = body;

    if (!supplierId || !warehouseId || !grnDate || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const grnNumber = `GRN-${Date.now()}`;
      
      const totalQty = lines.reduce((sum: number, l: any) => sum + Number(l.quantity), 0);
      const totalValue = lines.reduce((sum: number, l: any) => 
        sum + (Number(l.quantity) * Number(l.unitPrice || 0)), 0);

      const [grn] = await tx.insert(goodsReceipts).values({
        companyId,
        purchaseOrderId,
        supplierId,
        warehouseId,
        grnNumber,
        grnDate,
        supplierDocNumber,
        totalQuantity: totalQty.toString(),
        totalValue: totalValue.toFixed(2),
        notes,
        status: "draft",
      }).returning();

      await tx.insert(purchaseLines).values(
        lines.map((line: any, index: number) => ({
          companyId,
          grnId: grn.id,
          purchaseOrderLineId: line.purchaseOrderLineId || null,
          lineNumber: index + 1,
          itemId: line.itemId,
          quantity: line.quantity.toString(),
          uom: line.uom || "PCS",
          unitPrice: (line.unitPrice || 0).toString(),
          lineTotal: ((Number(line.quantity) * Number(line.unitPrice || 0))).toString(),
          receivedQty: line.quantity.toString(),
        }))
      );

      // Update PO received quantities if linked
      if (purchaseOrderId && lines.some((l: any) => l.purchaseOrderLineId)) {
        for (const line of lines) {
          if (line.purchaseOrderLineId) {
            const [poLine] = await tx
              .select()
              .from(purchaseLines)
              .where(eq(purchaseLines.id, line.purchaseOrderLineId));
            
            if (poLine) {
              await tx
                .update(purchaseLines)
                .set({
                  receivedQty: (Number(poLine.receivedQty || 0) + Number(line.quantity)).toString(),
                })
                .where(eq(purchaseLines.id, line.purchaseOrderLineId));
            }
          }
        }
      }

      return { grn };
    });

    return NextResponse.json({ 
      success: true, 
      message: "GRN created",
      data: result.grn 
    });
  } catch (error: any) {
    console.error("[POST /api/procurement/grn]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
