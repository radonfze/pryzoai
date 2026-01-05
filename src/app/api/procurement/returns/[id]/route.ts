import { db } from "@/db";
import { purchaseReturns } from "@/db/schema";
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

    const returnDoc = await db.query.purchaseReturns.findFirst({
      where: eq(purchaseReturns.id, params.id),
      with: {
        supplier: true,
        lines: true,
      },
    });

    if (!returnDoc || returnDoc.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: returnDoc });
  } catch (error: any) {
    console.error("[GET /api/procurement/returns/[id]]", error);
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
    
    const existing = await db.query.purchaseReturns.findFirst({
      where: eq(purchaseReturns.id, params.id),
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(purchaseReturns)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(purchaseReturns.id, params.id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: "Return updated",
      data: updated 
    });
  } catch (error: any) {
    console.error("[PUT /api/procurement/returns/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
