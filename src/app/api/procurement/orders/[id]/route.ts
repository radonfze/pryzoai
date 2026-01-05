import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, params.id),
      with: {
        supplier: true,
        lines: true,
      },
    });

    if (!order || order.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("[GET /api/procurement/orders/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    const existing = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, params.id),
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, params.id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: "Order updated",
      data: updated 
    });
  } catch (error: any) {
    console.error("[PUT /api/procurement/orders/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, params.id),
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(purchaseOrders)
      .set({ deletedAt: new Date() })
      .where(eq(purchaseOrders.id, params.id));

    return NextResponse.json({ 
      success: true, 
      message: "Order deleted" 
    });
  } catch (error: any) {
    console.error("[DELETE /api/procurement/orders/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
