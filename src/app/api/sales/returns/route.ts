import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesReturns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - List all sales returns
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returns = await db.query.salesReturns.findMany({
      with: {
        customer: true,
        invoice: true,
      },
      orderBy: [desc(salesReturns.createdAt)],
      limit: 100,
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

// POST - Create new sales return
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, "sales.create");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    
    const [newReturn] = await db
      .insert(salesReturns)
      .values({
        companyId: body.companyId,
        customerId: body.customerId,
        invoiceId: body.invoiceId,
        returnNumber: body.returnNumber,
        returnDate: body.returnDate ? new Date(body.returnDate) : new Date(),
        reason: body.reason,
        totalAmount: body.totalAmount || "0",
        status: body.status || "draft",
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
