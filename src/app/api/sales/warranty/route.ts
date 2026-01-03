import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { warrantyClaims } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - List all warranty claims
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await db.query.warrantyClaims.findMany({
      with: {
        customer: true,
        item: true,
      },
      orderBy: [desc(warrantyClaims.createdAt)],
      limit: 100,
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching warranty claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

// POST - Create new warranty claim
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
    
    const [newClaim] = await db
      .insert(warrantyClaims)
      .values({
        companyId: body.companyId || "00000000-0000-0000-0000-000000000000",
        customerId: body.customerId,
        itemId: body.itemId,
        invoiceId: body.invoiceId,
        claimNumber: body.claimNumber,
        claimDate: body.claimDate ? new Date(body.claimDate) : new Date(),
        serialNumber: body.serialNumber,
        issueDescription: body.issueDescription,
        status: body.status || "received",
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newClaim, { status: 201 });
  } catch (error) {
    console.error("Error creating warranty claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}
