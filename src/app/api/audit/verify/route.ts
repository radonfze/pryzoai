import { NextRequest, NextResponse } from "next/server";
import { verifyAuditChain } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyAuditChain(companyId);

    return NextResponse.json({
      success: true,
      data: {
        isValid: result.isValid,
        totalEntries: result.totalEntries,
        invalidCount: result.invalidEntries.length,
        status: result.isValid ? "✅ Chain integrity verified" : "❌ Chain compromised",
      },
    });
  } catch (error) {
    console.error("Audit chain verification failed:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
