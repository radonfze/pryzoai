import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/api/auth", "/_next", "/favicon.ico", "/debug-auth", "/api/fix-categories", "/api/fix-db"];

// Define restricted routes and their required permission levels or specific logic
const RESTRICTED_ROUTES = [
  "/api/finance/payroll", // Payroll posting often restricted to office IP
  "/api/admin/system",    // System-level admin actions
];

// Mock Allowed IPs - In production, this would come from Env or Database
const ALLOWED_IPS = (process.env.ALLOWED_OFFICE_IPS || "").split(",").filter(Boolean);

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 0. Rate Limiting (DoS Protection)
  // Apply to Login and API Routes
  if (path === "/login" || path.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    // Strict limit for Login (6 attempts / min)
    const limit = path === "/login" ? 6 : 100; 
    const windowMs = 60 * 1000;
    
    const { success, remaining } = checkRateLimit(ip, limit, windowMs);
    
    if (!success) {
       console.warn(`⛔ Rate Limit Exceeded for IP: ${ip} on Path: ${path}`);
       return new NextResponse(JSON.stringify({ success: false, message: "Too many requests. Please try again later." }), {
         status: 429,
         headers: { 'Content-Type': 'application/json' }
       });
    }
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));
  
  // Check authentication using proper session cookie
  const sessionCookie = request.cookies.get("pryzoai_session"); // FIXED: Was "pryzoft_session"
  const isAuthenticated = !!sessionCookie?.value;

  console.log(`[Middleware] Path: ${path} | Cookie: ${isAuthenticated ? 'YES' : 'NO'} | Public: ${isPublicRoute}`);

  // Redirect to login if not authenticated and not on public route
  if (!isAuthenticated && !isPublicRoute) {
    console.log(`[Middleware] Redirecting to login: ${path}`);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and on login page
  if (isAuthenticated && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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

  // 4. Continue with Security Headers
  const response = NextResponse.next();

  // Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  return response;
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

