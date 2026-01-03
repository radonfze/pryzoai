import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { creditNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - Get single credit note
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

    const note = await db.query.creditNotes.findFirst({
      where: eq(creditNotes.id, id),
      with: {
        customer: true,
        originalInvoice: true,
        salesReturn: true,
        lines: {
          with: { item: true, tax: true },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching credit note:", error);
    return NextResponse.json({ error: "Failed to fetch credit note" }, { status: 500 });
  }
}

// PATCH - Update credit note
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
      .update(creditNotes)
      .set({
        reasonCode: body.reasonCode,
        reason: body.reason,
        notes: body.notes,
        status: body.status,
        appliedAmount: body.appliedAmount,
        remainingAmount: body.remainingAmount,
        isPosted: body.isPosted,
        updatedAt: new Date(),
      })
      .where(eq(creditNotes.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating credit note:", error);
    return NextResponse.json({ error: "Failed to update credit note" }, { status: 500 });
  }
}

// DELETE - Cancel credit note
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
      .update(creditNotes)
      .set({
        status: "cancelled",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(creditNotes.id, id))
      .returning();

    return NextResponse.json(cancelled);
  } catch (error) {
    console.error("Error cancelling credit note:", error);
    return NextResponse.json({ error: "Failed to cancel credit note" }, { status: 500 });
  }
}
