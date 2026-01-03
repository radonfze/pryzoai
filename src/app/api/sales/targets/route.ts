import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesTargets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - List all sales targets
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targets = await db.query.salesTargets.findMany({
      orderBy: [desc(salesTargets.createdAt)],
      limit: 100,
    });

    return NextResponse.json(targets);
  } catch (error) {
    console.error("Error fetching sales targets:", error);
    return NextResponse.json({ error: "Failed to fetch targets" }, { status: 500 });
  }
}

// POST - Create new sales target
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
    
    const [newTarget] = await db
      .insert(salesTargets)
      .values({
        companyId: body.companyId || "00000000-0000-0000-0000-000000000000",
        name: body.name,
        targetType: body.targetType || "revenue",
        targetAmount: body.targetAmount?.toString() || "0",
        achievedAmount: "0",
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(),
        status: body.status || "in_progress",
        description: body.description,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newTarget, { status: 201 });
  } catch (error) {
    console.error("Error creating sales target:", error);
    return NextResponse.json({ error: "Failed to create target" }, { status: 500 });
  }
}
