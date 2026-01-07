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
    console.log("🔢 Number reservation API called");
    
    let companyId: string;
    try {
      companyId = await getCompanyId();
      console.log("🔢 CompanyId retrieved:", companyId);
    } catch (authError: any) {
      console.error("🔢 Auth error:", authError.message);
      return NextResponse.json({ 
        error: "Unauthorized: " + authError.message 
      }, { status: 401 });
    }
    
    if (!companyId) {
      console.error("🔢 No companyId found");
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

    // Generic auto-create default series if missing
    if (!series) {
      console.log(`Auto-creating default number series for ${entityType}...`);
      
      const defaultPrefixes: Record<string, string> = {
        invoice: 'INV',
        quotation: 'QT',
        proforma: 'PRO',
        sales_order: 'SO',
        delivery_note: 'DN',
        purchase_order: 'PO',
        purchase_request: 'PR',
        purchase_bill: 'BILL',
        receipt: 'RCT',
        payment: 'PAY',
      };

      const prefix = defaultPrefixes[entityType] || entityType.substring(0, 3).toUpperCase();
      const docType = documentType || prefix;

      try {
        const [created] = await db.insert(numberSeries).values({
          companyId,
          entityType,
          documentType: docType,
          prefix: prefix,
          separator: '-',
          yearFormat: 'YYYY',
          currentValue: 0,
          resetRule: 'YEARLY',
          scope: 'COMPANY',
          isLocked: false,
          isActive: true,
        }).returning();
        
        series = created; 
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

    // Atomic increment with row-level lock to prevent duplicate numbers
    // Using UPDATE ... RETURNING in a single statement ensures atomicity
    const [updated] = await db
      .update(numberSeries)
      .set({
        currentValue: sql`${numberSeries.currentValue} + 1`,
        updatedAt: sql`NOW()`, // Mark as updated for tracking
      })
      .where(and(
        eq(numberSeries.id, series.id),
        eq(numberSeries.currentValue, series.currentValue) // Optimistic lock
      ))
      .returning({ newValue: numberSeries.currentValue });

    // If optimistic lock failed (concurrent update), retry
    if (!updated) {
      // Refetch and retry once
      const refetched = await db.query.numberSeries.findFirst({
        where: eq(numberSeries.id, series.id),
      });
      
      if (!refetched) {
        return NextResponse.json(
          { error: "Number series not found on retry" },
          { status: 500 }
        );
      }
      
      const [retried] = await db
        .update(numberSeries)
        .set({
          currentValue: sql`${numberSeries.currentValue} + 1`,
        })
        .where(eq(numberSeries.id, series.id))
        .returning({ newValue: numberSeries.currentValue });
      
      if (!retried) {
        return NextResponse.json(
          { error: "Failed to increment number series after retry" },
          { status: 500 }
        );
      }
      
      // Use retried value
      Object.assign(updated || {}, retried);
    }

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

    // Try to log the reservation (optional - may fail if RESERVED enum doesn't exist yet)
    let reservationId = null;
    try {
      const [allocation] = await db
        .insert(numberAllocationLog)
        .values({
          companyId,
          entityType,
          documentType: documentType || null,
          generatedNumber,
          seriesId: series.id,
          entityId: null,
          status: "FINAL", // Use FINAL instead of RESERVED to avoid enum migration issues
        })
        .returning({ id: numberAllocationLog.id });
      reservationId = allocation?.id;
    } catch (logError) {
      // Logging failed but number generation succeeded - continue anyway
      console.warn("Failed to log number allocation (continuing):", logError);
    }

    return NextResponse.json({
      success: true,
      number: generatedNumber,
      reservationId,
    });
  } catch (error: any) {
    console.error("Number reservation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reserve number" },
      { status: 500 }
    );
  }
}
