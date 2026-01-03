import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryNotes, deliveryNoteLines } from "@/db/schema";
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
    
    // Perform creation + SO update sequence
    const result = await db.transaction(async (tx) => {
        // 1. Create Header
        const [newNote] = await tx
          .insert(deliveryNotes)
          .values({
            companyId: body.companyId || "00000000-0000-0000-0000-000000000000",
            customerId: body.customerId,
            salesOrderId: body.salesOrderId || null,
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

        // 2. Create Lines
        const linesToInsert: any[] = [];
        const deliveredItemsForTracking: { salesOrderLineId: string; deliveredQty: number }[] = [];

        if (body.lines && Array.isArray(body.lines)) {
            for (const line of body.lines) {
                const qty = Number(line.quantity || 0);
                if (qty <= 0) continue;

                linesToInsert.push({
                    companyId: newNote.companyId,
                    deliveryNoteId: newNote.id,
                    salesOrderLineId: line.salesOrderLineId, // Important for tracking
                    lineNumber: line.lineNumber || 0,
                    itemId: line.itemId,
                    description: line.description,
                    quantity: line.quantity,
                    uom: line.uom || "PCS",
                    serialNumbers: line.serialNumbers,
                    batchNumber: line.batchNumber,
                });

                if (line.salesOrderLineId) {
                    deliveredItemsForTracking.push({
                        salesOrderLineId: line.salesOrderLineId,
                        deliveredQty: qty
                    });
                }
            }
        }

        if (linesToInsert.length > 0) {
            await tx.insert(deliveryNoteLines).values(linesToInsert);
        }

        return { newNote, deliveredItemsForTracking };
    });

    // 3. Update Sales Order Quantities (Outside transaction to allow service's own transaction)
    if (result.newNote.salesOrderId && result.deliveredItemsForTracking.length > 0) {
        // We import dynamically or use the service
        // Since we are in an API route, we can call the server action/service
        const { updateSalesOrderDeliveredQty } = await import("@/lib/services/sales-order-tracking");
        await updateSalesOrderDeliveredQty(result.newNote.salesOrderId, result.deliveredItemsForTracking);
    }

    return NextResponse.json(result.newNote, { status: 201 });
  } catch (error) {
    console.error("Error creating delivery note:", error);
    return NextResponse.json({ error: "Failed to create delivery note" }, { status: 500 });
  }
}
