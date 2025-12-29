import { db } from "@/db";
import { users } from "@/db/schema/users";
import { roles, userRoles } from "@/db/schema/roles";
import { eq } from "drizzle-orm";
import { PERMISSIONS } from "@/db/schema/roles"; // Use existing constant

export type Permission = typeof PERMISSIONS[number] | "admin";

/**
 * Check if a user has a specific permission.
 * Accounts for:
 * 1. Admin super-user status (based on 'admin' role enum or '*' permission)
 * 2. Assigned Roles (via userRoles)
 */
export async function checkPermission(userId: string, requiredPermission: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      // Drizzle relations don't seem to have direct userRoles -> role relation defined easily in `users` schema relation block?
      // Let's check users.ts relations. It only shows company and sessions.
      // We might need to query userRoles separately or rely on the `role` enum for basic checks.
    }
  });

  if (!user) return false;

  // 1. Check Built-in Enum Role
  if (user.role === "admin") return true;

  // 2. Fetch Custom Roles
  // Since `users.ts` relations didn't explicitly include `userRoles`, we fetch manually
  const assignedRolesRef = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: {
      role: true
    }
  });

  // 3. Check Permissions
  for (const assignment of assignedRolesRef) {
    const rolePermissions = assignment.role.permissions as string[];
    
    // Super-role check
    if (rolePermissions.includes("*")) return true;

    // Exact Match
    if (rolePermissions.includes(requiredPermission)) return true;

    // Wildcard match (e.g. "sales.*" matches "sales.create")
    const parts = requiredPermission.split('.');
    if (parts.length > 1) {
       const wildcard = parts[0] + ".*";
       if (rolePermissions.includes(wildcard)) return true;
    }
  }

  return false;
}

/**
 * Throws error if permission denied. Useful for Server Actions.
 */
export async function requirePermission(userId: string, requiredPermission: string) {
    const allowed = await checkPermission(userId, requiredPermission);
    if (!allowed) {
        throw new Error(`Access Denied: Missing permission '${requiredPermission}'`);
    }
}
