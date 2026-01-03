import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - List all delivery notes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await db.query.deliveryNotes.findMany({
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
      orderBy: [desc(deliveryNotes.createdAt)],
      limit: 100,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching delivery notes:", error);
    return NextResponse.json({ error: "Failed to fetch delivery notes" }, { status: 500 });
  }
}

// POST - Create new delivery note
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
    
    const [newNote] = await db
      .insert(deliveryNotes)
      .values({
        companyId: body.companyId || "00000000-0000-0000-0000-000000000000",
        customerId: body.customerId,
        salesOrderId: body.salesOrderId,
        warehouseId: body.warehouseId,
        deliveryNoteNumber: body.deliveryNoteNumber,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : new Date(),
        shippingAddress: body.shippingAddress,
        driverName: body.driverName,
        vehicleNumber: body.vehicleNumber,
        notes: body.notes,
        status: body.status || "draft",
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("Error creating delivery note:", error);
    return NextResponse.json({ error: "Failed to create delivery note" }, { status: 500 });
  }
}
