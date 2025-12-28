
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IPS = (process.env.ALLOWED_ADMIN_IPS || "").split(",").filter(Boolean);

/**
 * Middleware to restrict access to sensitive routes (e.g., Payroll Finalization, Bank Transfer)
 * based on IP Allow-list.
 */
export function ipRestrictionMiddleware(request: NextRequest) {
    // Only apply if env var is set
    if (ALLOWED_IPS.length === 0) return NextResponse.next();

    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    
    // Check if IP matches allowed list
    const isAllowed = ALLOWED_IPS.includes(ip) || ip === "127.0.0.1" || ip === "::1";

    if (!isAllowed) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "Access Denied: Restricted IP" }),
            { status: 403, headers: { "content-type": "application/json" } }
        );
    }

    return NextResponse.next();
}
