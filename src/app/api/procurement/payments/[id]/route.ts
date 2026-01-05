import { db } from "@/db";
import { supplierPayments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await db.query.supplierPayments.findFirst({
      where: eq(supplierPayments.id, params.id),
      with: {
        supplier: true,
        allocations: {
          with: {
            invoice: true,
          },
        },
      },
    });

    if (!payment || payment.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    console.error("[GET /api/procurement/payments/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
