import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define restricted routes and their required permission levels or specific logic
const RESTRICTED_ROUTES = [
  "/api/finance/payroll", // Payroll posting often restricted to office IP
  "/api/admin/system",    // System-level admin actions
];

// Mock Allowed IPs - In production, this would come from Env or Database
const ALLOWED_IPS = (process.env.ALLOWED_OFFICE_IPS || "").split(",").filter(Boolean);

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Check if route is restricted
  const isRestricted = RESTRICTED_ROUTES.some((route) => path.startsWith(route));

  if (isRestricted) {
    // 2. Get IP - request.ip doesn't exist in Next.js 16+, use headers instead
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
            || request.headers.get("x-real-ip") 
            || "unknown";
    
    // In dev, usually allow localhost (::1 or 127.0.0.1)
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    // 3. Validate IP
    if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
      console.warn(`⛔ Blocked access to ${path} from unauthorized IP: ${ip}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "FORBIDDEN", 
            message: "Access denied from this IP address" 
          } 
        },
        { status: 403 }
      );
    }
  }

  // 4. Continue
  return NextResponse.next();
}

// Config matchers to avoid running on static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next/static (static files)
     * 2. /_next/image (image optimization files)
     * 3. /favicon.ico (favicon file)
     * 4. /public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
