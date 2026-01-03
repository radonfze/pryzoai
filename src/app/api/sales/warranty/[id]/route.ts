import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { warrantyClaims } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - Get single warranty claim
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

    const claim = await db.query.warrantyClaims.findFirst({
      where: eq(warrantyClaims.id, id),
      with: {
        customer: true,
        item: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error fetching warranty claim:", error);
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 });
  }
}

// PATCH - Update warranty claim
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
      .update(warrantyClaims)
      .set({
        serialNumber: body.serialNumber,
        issueDescription: body.issueDescription,
        status: body.status,
        decision: body.decision,
        decisionReason: body.decisionReason,
        approvedBy: body.approvedBy,
        replacementSerialNumber: body.replacementSerialNumber,
        updatedAt: new Date(),
      })
      .where(eq(warrantyClaims.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating warranty claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}

// DELETE - Cancel/reject warranty claim
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

    const [cancelled] = await db
      .update(warrantyClaims)
      .set({
        status: "rejected",
        decision: "reject",
        decisionReason: "Cancelled by user",
        updatedAt: new Date(),
      })
      .where(eq(warrantyClaims.id, id))
      .returning();

    return NextResponse.json(cancelled);
  } catch (error) {
    console.error("Error cancelling warranty claim:", error);
    return NextResponse.json({ error: "Failed to cancel claim" }, { status: 500 });
  }
}
