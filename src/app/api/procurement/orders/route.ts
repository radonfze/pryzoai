import { db } from "@/db";
import { purchaseOrders, purchaseLines } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db.query.purchaseOrders.findMany({
      where: eq(purchaseOrders.companyId, companyId),
      orderBy: [desc(purchaseOrders.orderDate)],
      with: {
        supplier: true,
        lines: true,
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("[GET /api/procurement/orders]", error);
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
    const { supplierId, orderDate, deliveryDate, reference, lines, warehouseId } = body;

    if (!supplierId || !orderDate || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const orderNumber = `PO-${Date.now()}`;
      
      // Calculate totals
      const subtotal = lines.reduce((sum: number, l: any) => 
        sum + (Number(l.quantity) * Number(l.unitPrice)), 0);
      const taxTotal = lines.reduce((sum: number, l: any) => 
        sum + Number(l.taxAmount || 0), 0);

      const [order] = await tx.insert(purchaseOrders).values({
        companyId,
        supplierId,
        warehouseId,
        orderNumber,
        orderDate,
        deliveryDate,
        reference,
        status: "draft",
        subtotal: subtotal.toFixed(2),
        taxAmount: taxTotal.toFixed(2),
        totalAmount: (subtotal + taxTotal).toFixed(2),
      }).returning();

      await tx.insert(purchaseLines).values(
        lines.map((line: any, index: number) => ({
          companyId,
          purchaseOrderId: order.id,
          lineNumber: index + 1,
          itemId: line.itemId,
          quantity: line.quantity.toString(),
          uom: line.uom || "PCS",
          unitPrice: line.unitPrice.toString(),
          taxAmount: (line.taxAmount || 0).toString(),
          lineTotal: ((Number(line.quantity) * Number(line.unitPrice)) + Number(line.taxAmount || 0)).toString(),
        }))
      );

      return { order };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Purchase order created",
      data: result.order 
    });
  } catch (error: any) {
    console.error("[POST /api/procurement/orders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
