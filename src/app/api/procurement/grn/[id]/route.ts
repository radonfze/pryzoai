import { db } from "@/db";
import { goodsReceipts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const grn = await db.query.goodsReceipts.findFirst({
      where: eq(goodsReceipts.id, id),
      with: {
        supplier: true,
        purchaseOrder: true,
        lines: true,
      },
    });

    if (!grn || grn.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: grn });
  } catch (error: any) {
    console.error("[GET /api/procurement/grn/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const body = await req.json();
    
    const existing = await db.query.goodsReceipts.findFirst({
      where: eq(goodsReceipts.id, id),
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(goodsReceipts)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(goodsReceipts.id, id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: "GRN updated",
      data: updated 
    });
  } catch (error: any) {
    console.error("[PUT /api/procurement/grn/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
