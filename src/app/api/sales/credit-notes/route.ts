import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { creditNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - List all credit notes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await db.query.creditNotes.findMany({
      with: {
        customer: true,
        originalInvoice: true,
        lines: {
          with: { item: true },
        },
      },
      orderBy: [desc(creditNotes.createdAt)],
      limit: 100,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching credit notes:", error);
    return NextResponse.json({ error: "Failed to fetch credit notes" }, { status: 500 });
  }
}

// POST - Create new credit note
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
      .insert(creditNotes)
      .values({
        companyId: body.companyId || "00000000-0000-0000-0000-000000000000",
        customerId: body.customerId,
        originalInvoiceId: body.originalInvoiceId,
        salesReturnId: body.salesReturnId,
        creditNoteNumber: body.creditNoteNumber,
        creditNoteDate: body.creditNoteDate ? new Date(body.creditNoteDate) : new Date(),
        reasonCode: body.reasonCode,
        reason: body.reason,
        subtotal: body.subtotal || "0",
        taxAmount: body.taxAmount || "0",
        totalAmount: body.totalAmount || "0",
        remainingAmount: body.totalAmount || "0",
        notes: body.notes,
        status: body.status || "draft",
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("Error creating credit note:", error);
    return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 });
  }
}
