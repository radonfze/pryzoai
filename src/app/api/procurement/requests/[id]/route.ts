import { db } from "@/db";
import { purchaseRequests, purchaseLines } from "@/db/schema";
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

    const request = await db.query.purchaseRequests.findFirst({
      where: eq(purchaseRequests.id, params.id),
      with: {
        lines: true,
      },
    });

    if (!request || request.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    console.error("[GET /api/procurement/requests/[id]]", error);
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
    
    // Check ownership
    const existing = await db.query.purchaseRequests.findFirst({
      where: eq(purchaseRequests.id, params.id),
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(purchaseRequests)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(purchaseRequests.id, params.id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: "Request updated",
      data: updated 
    });
  } catch (error: any) {
    console.error("[PUT /api/procurement/requests/[id]]", error);
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

    const existing = await db.query.purchaseRequests.findFirst({
      where: eq(purchaseRequests.id, params.id),
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Soft delete
    await db
      .update(purchaseRequests)
      .set({ deletedAt: new Date() })
      .where(eq(purchaseRequests.id, params.id));

    return NextResponse.json({ 
      success: true, 
      message: "Request deleted" 
    });
  } catch (error: any) {
    console.error("[DELETE /api/procurement/requests/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
