import { NextRequest, NextResponse } from "next/server";

/**
 * Tenant Isolation Middleware
 * 
 * Enforces Row-Level Security by:
 * 1. Extracting tenant (company) ID from session/token
 * 2. Validating user belongs to the tenant
 * 3. Injecting tenant context for all database queries
 */

export interface TenantContext {
  companyId: string;
  userId: string;
  userRole: string;
}

/**
 * Extract tenant context from request headers/cookies
 */
export function getTenantContext(request: NextRequest): TenantContext | null {
  // Get from session cookies or Authorization header
  const sessionToken = request.cookies.get("session")?.value;
  const authHeader = request.headers.get("Authorization");

  // TODO: Decode JWT or lookup session to get context
  // For now, return from header for development
  const companyId = request.headers.get("X-Company-ID");
  const userId = request.headers.get("X-User-ID");
  const userRole = request.headers.get("X-User-Role");

  if (!companyId || !userId) {
    return null;
  }

  return {
    companyId,
    userId,
    userRole: userRole || "user",
  };
}

/**
 * Validate that user has access to the requested tenant
 */
export async function validateTenantAccess(
  userId: string,
  companyId: string
): Promise<boolean> {
  // TODO: Query database to verify user belongs to company
  // For now, allow all authenticated users
  return true;
}

/**
 * RLS Policy Middleware
 * 
 * Use in API routes to enforce tenant isolation:
 * 
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const tenant = await withTenantContext(request);
 *   if (!tenant) return unauthorized();
 *   
 *   // All queries will be scoped to tenant.companyId
 *   const data = await db.query.invoices.findMany({
 *     where: eq(invoices.companyId, tenant.companyId)
 *   });
 * }
 * ```
 */
export async function withTenantContext(
  request: NextRequest
): Promise<TenantContext | null> {
  const context = getTenantContext(request);
  
  if (!context) {
    return null;
  }

  const hasAccess = await validateTenantAccess(context.userId, context.companyId);
  
  if (!hasAccess) {
    return null;
  }

  return context;
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Forbidden response helper (authenticated but no access)
 */
export function forbiddenResponse(message = "Access denied") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Date Enforcement Middleware
 * 
 * Prevents posting to locked periods
 */
export async function validatePostingDate(
  companyId: string,
  postingDate: Date
): Promise<{ valid: boolean; error?: string }> {
  // TODO: Check against period_lockdown table
  // For now, allow all dates
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  if (postingDate < thirtyDaysAgo) {
    return {
      valid: false,
      error: "Cannot post to dates older than 30 days",
    };
  }
  
  return { valid: true };
}
