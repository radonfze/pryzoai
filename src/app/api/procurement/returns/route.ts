import { db } from "@/db";
import { purchaseReturns, purchaseLines } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returns = await db.query.purchaseReturns.findMany({
      where: eq(purchaseReturns.companyId, companyId),
      orderBy: [desc(purchaseReturns.returnDate)],
      with: {
        supplier: true,
        lines: true,
      },
    });

    return NextResponse.json({ success: true, data: returns });
  } catch (error: any) {
    console.error("[GET /api/procurement/returns]", error);
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
      supplierId, 
      originalInvoiceId, 
      warehouseId, 
      returnDate, 
      reason, 
      lines 
    } = body;

    if (!supplierId || !originalInvoiceId || !returnDate || !reason || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const returnNumber = `PR-${Date.now()}`;
      
      const subtotal = lines.reduce((sum: number, l: any) => 
        sum + (Number(l.quantity) * Number(l.unitPrice)), 0);
      const taxTotal = lines.reduce((sum: number, l: any) => 
        sum + Number(l.taxAmount || 0), 0);

      const [returnDoc] = await tx.insert(purchaseReturns).values({
        companyId,
        supplierId,
        originalInvoiceId,
        warehouseId,
        returnNumber,
        returnDate,
        reason,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxTotal.toFixed(2),
        totalAmount: (subtotal + taxTotal).toFixed(2),
        status: "draft",
      }).returning();

      await tx.insert(purchaseLines).values(
        lines.map((line: any, index: number) => ({
          companyId,
          returnId: returnDoc.id,
          lineNumber: index + 1,
          itemId: line.itemId,
          quantity: line.quantity.toString(),
          uom: line.uom || "PCS",
          unitPrice: line.unitPrice.toString(),
          taxAmount: (line.taxAmount || 0).toString(),
          lineTotal: ((Number(line.quantity) * Number(line.unitPrice)) + Number(line.taxAmount || 0)).toString(),
        }))
      );

      return { returnDoc };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Purchase return created",
      data: result.returnDoc 
    });
  } catch (error: any) {
    console.error("[POST /api/procurement/returns]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
