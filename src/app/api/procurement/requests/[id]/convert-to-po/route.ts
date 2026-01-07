import { db } from "@/db";
import { purchaseRequests, purchaseOrders, purchaseLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    // Get request with lines
    const request = await db.query.purchaseRequests.findFirst({
      where: eq(purchaseRequests.id, id),
      with: {
        lines: true,
      },
    });

    if (!request || request.companyId !== companyId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "draft" && request.status !== "pending_approval") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    const body = await req.json();
    const { supplierId } = body;

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID required" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Generate PO number
      const orderNumber = `PO-${Date.now()}`;

      // Create PO
      const [po] = await tx.insert(purchaseOrders).values({
        companyId,
        requestId: request.id,
        supplierId,
        orderNumber,
        orderDate: new Date().toISOString().split('T')[0],
        status: "draft",
        subtotal: "0",
        taxAmount: "0",
        totalAmount: "0",
      }).returning();

      // Copy lines from request to PO
      if (request.lines && request.lines.length > 0) {
        await tx.insert(purchaseLines).values(
          request.lines.map((line: any, index: number) => ({
            companyId,
            purchaseOrderId: po.id,
            lineNumber: index + 1,
            itemId: line.itemId,
            description: line.description,
            quantity: line.quantity,
            uom: line.uom,
            unitPrice: "0",
            lineTotal: "0",
          }))
        );
      }

      // Update request status
      await tx
        .update(purchaseRequests)
        .set({ status: "completed" })
        .where(eq(purchaseRequests.id, id));

      return { po };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Purchase order created from request",
      data: result.po 
    });
  } catch (error: any) {
    console.error("[POST /api/procurement/requests/[id]/convert-to-po]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
