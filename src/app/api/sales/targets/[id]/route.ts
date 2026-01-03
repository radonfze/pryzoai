import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesTargets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - Get single sales target
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const target = await db.query.salesTargets.findFirst({
      where: eq(salesTargets.id, id),
    });

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(target);
  } catch (error) {
    console.error("Error fetching sales target:", error);
    return NextResponse.json({ error: "Failed to fetch target" }, { status: 500 });
  }
}

// PATCH - Update sales target
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, "sales.edit");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    const [updated] = await db
      .update(salesTargets)
      .set({
        name: body.name,
        targetType: body.targetType,
        targetAmount: body.targetAmount?.toString(),
        achievedAmount: body.achievedAmount?.toString(),
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status,
        description: body.description,
        updatedAt: new Date(),
      })
      .where(eq(salesTargets.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sales target:", error);
    return NextResponse.json({ error: "Failed to update target" }, { status: 500 });
  }
}

// DELETE - Delete sales target
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, "sales.delete");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await db.delete(salesTargets).where(eq(salesTargets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sales target:", error);
    return NextResponse.json({ error: "Failed to delete target" }, { status: 500 });
  }
}
