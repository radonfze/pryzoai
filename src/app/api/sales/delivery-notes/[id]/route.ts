import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - Get single delivery note
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

    const note = await db.query.deliveryNotes.findFirst({
      where: eq(deliveryNotes.id, id),
      with: {
        customer: true,
        salesOrder: true,
        warehouse: true,
        lines: {
          with: {
            item: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching delivery note:", error);
    return NextResponse.json({ error: "Failed to fetch delivery note" }, { status: 500 });
  }
}

// PATCH - Update delivery note
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
      .update(deliveryNotes)
      .set({
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
        shippingAddress: body.shippingAddress,
        driverName: body.driverName,
        vehicleNumber: body.vehicleNumber,
        contactPhone: body.contactPhone,
        podSignature: body.podSignature,
        podPhoto: body.podPhoto,
        receivedBy: body.receivedBy,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
        notes: body.notes,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(deliveryNotes.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating delivery note:", error);
    return NextResponse.json({ error: "Failed to update delivery note" }, { status: 500 });
  }
}

// DELETE - Cancel delivery note
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
      .update(deliveryNotes)
      .set({
        status: "cancelled",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deliveryNotes.id, id))
      .returning();

    return NextResponse.json(cancelled);
  } catch (error) {
    console.error("Error cancelling delivery note:", error);
    return NextResponse.json({ error: "Failed to cancel delivery note" }, { status: 500 });
  }
}
