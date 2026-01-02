import { db } from "@/db";
import { companies, userRoles, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateSession } from "./auth/auth-service";

/**
 * Get the current company ID from the authenticated user's session
 * THROWS if no session - use for mutations that require auth
 */
export async function getCompanyId(): Promise<string> {
  const session = await validateSession();
  
  if (!session) {
    throw new Error("Unauthorized: No active session");
  }
  
  return session.companyId;
}

/**
 * Get current company ID or null if not authenticated
 * Returns null instead of throwing - use for data fetching in Server Components
 */
export async function getCompanyIdSafe(): Promise<string | null> {
  const session = await validateSession();
  return session?.companyId || null;
}

/**
 * Get the current user ID from session
 */
export async function getUserId(): Promise<string> {
  const session = await validateSession();
  
  if (!session) {
    throw new Error("Unauthorized: No active session");
  }
  
  return session.userId;
}

/**
 * Get current session or null if not authenticated
 */
export async function getSession() {
  return await validateSession();
}

/**
 * Check if user has required permission
 * Returns TRUE if allowed, FALSE otherwise
 */
export async function checkPermission(requiredPermission: string): Promise<boolean> {
  const session = await validateSession();
  if (!session) return false;

  // 1. Fetch User Roles with Permissions
  const assigned = await db.select({
      permissions: roles.permissions
  })
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .where(eq(userRoles.userId, session.userId));

  // 2. Flatten permissions
  const allPermissions = assigned.flatMap(r => r.permissions || []);

  // 3. Check for exact match or wildcard '*'
  return allPermissions.includes(requiredPermission) || allPermissions.includes('*');
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<string[]> {
  const session = await validateSession();
  if (!session) return [];

  const assigned = await db.select({
      permissions: roles.permissions
  })
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .where(eq(userRoles.userId, session.userId));

  return assigned.flatMap(r => r.permissions || []);
}

/**
 * Require a permission - throws Error if not allowed
 * Use this at the top of Server Actions
 */
export async function requirePermission(permission: string): Promise<void> {
  const isAllowed = await checkPermission(permission);
  if (!isAllowed) {
    throw new Error(`Forbidden: Missing '${permission}' permission`);
  }
}

/**
 * Check if user has required role (Deprecated: Switch to Permissions)
 */
export async function requireRole(allowedRoles: string[]): Promise<boolean> {
  const session = await validateSession();
  
  if (!session) {
    return false;
  }
  
  return allowedRoles.includes(session.role);
}
