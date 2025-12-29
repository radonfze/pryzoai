import { NextResponse } from "next/server";
import { db } from "@/db";
import { warehouses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db.query.warehouses.findMany({
      where: eq(warehouses.companyId, companyId),
      columns: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    });

    return NextResponse.json({ warehouses: data });
  } catch (error) {
    console.error("Warehouse API error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}
