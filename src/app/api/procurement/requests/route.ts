import { db } from "@/db";
import { purchaseRequests, purchaseLines } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db.query.purchaseRequests.findMany({
      where: eq(purchaseRequests.companyId, companyId),
      orderBy: [desc(purchaseRequests.requestDate)],
      with: {
        lines: true,
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error("[GET /api/procurement/requests]", error);
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
    const { requestDate, requiredDate, requestedBy, department, notes, lines } = body;

    if (!requestDate || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Generate request number
      const requestNumber = `PR-${Date.now()}`;

      // Insert request header
      const [request] = await tx.insert(purchaseRequests).values({
        companyId,
        requestNumber,
        requestDate,
        requiredDate,
        requestedBy,
        department,
        notes,
        status: "draft",
      }).returning();

      // Insert lines
      await tx.insert(purchaseLines).values(
        lines.map((line: any, index: number) => ({
          companyId,
          requestId: request.id,
          lineNumber: index + 1,
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity.toString(),
          uom: line.uom || "PCS",
          unitPrice: "0",
          lineTotal: "0",
        }))
      );

      return { request };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Purchase request created",
      data: result.request 
    });
  } catch (error: any) {
    console.error("[POST /api/procurement/requests]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
