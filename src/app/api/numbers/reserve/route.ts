import { NextResponse } from "next/server";
import { db } from "@/db";
import { numberSeries, numberAllocationLog } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

/**
 * Reserve a document number immediately
 * POST /api/numbers/reserve
 * Body: { entityType: "invoice", documentType: "INV" }
 * Returns: { number: "INV-2025-00001", reservationId: "uuid" }
 */
export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, documentType } = body;

    if (!entityType) {
      return NextResponse.json({ error: "entityType is required" }, { status: 400 });
    }

    // Find active series
    let series = await db.query.numberSeries.findFirst({
      where: and(
        eq(numberSeries.companyId, companyId),
        eq(numberSeries.entityType, entityType),
        eq(numberSeries.isActive, true)
      ),
    });

    // Auto-create default series for invoices if missing
    if (!series && entityType === 'invoice') {
      console.log('Auto-creating default invoice number series...');
      try {
        const [created] = await db.insert(numberSeries).values({
          companyId,
          entityType: 'invoice',
          documentType: 'INV',
          prefix: 'INV',
          separator: '-',
          yearFormat: 'YYYY',
          currentValue: 0,
          resetRule: 'YEARLY',
          scope: 'COMPANY',
          isLocked: false,
          isActive: true,
        }).returning();
        
        series = created; // Use the newly created series
      } catch (createError) {
        console.error('Failed to auto-create number series:', createError);
        return NextResponse.json(
          { error: 'No active number series found. Please configure in Settings.' },
          { status: 404 }
        );
      }
    }

    if (!series) {
      return NextResponse.json(
        { error: `No active number series found for ${entityType}. Please configure in Settings.` },
        { status: 404 }
      );
    }

    if (series.isLocked) {
      return NextResponse.json(
        { error: `Number series for ${entityType} is locked` },
        { status: 400 }
      );
    }

    // Atomic increment
    const [updated] = await db
      .update(numberSeries)
      .set({
        currentValue: sql`${numberSeries.currentValue} + 1`,
      })
      .where(eq(numberSeries.id, series.id))
      .returning({ newValue: numberSeries.currentValue });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to increment number series" },
        { status: 500 }
      );
    }

    // Format the number
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const nextValue = updated.newValue;
    const paddedNumber = String(nextValue).padStart(5, "0");

    let generatedNumber = series.prefix;

    if (series.separator) {
      generatedNumber += series.separator;
    }

    if (series.yearFormat === "YYYY") {
      generatedNumber += currentYear + (series.separator || "-");
    } else if (series.yearFormat === "YY") {
      generatedNumber += String(currentYear).slice(-2) + (series.separator || "-");
    }

    generatedNumber += paddedNumber;

    // Log the reservation
    const [allocation] = await db
      .insert(numberAllocationLog)
      .values({
        companyId,
        entityType,
        documentType: documentType || null,
        generatedNumber,
        seriesId: series.id,
        entityId: null, // Will be filled when document is saved
        status: "RESERVED",
      })
      .returning({ id: numberAllocationLog.id });

    return NextResponse.json({
      success: true,
      number: generatedNumber,
      reservationId: allocation.id,
    });
  } catch (error: any) {
    console.error("Number reservation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reserve number" },
      { status: 500 }
    );
  }
}
