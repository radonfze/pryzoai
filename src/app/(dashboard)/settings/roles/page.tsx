import { db } from "@/db";
import { roles, PERMISSIONS } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Lock, Users, Eye } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let roleList: any[] = [];
  try {
    roleList = await db.query.roles.findMany({
      where: eq(roles.companyId, companyId),
    });
  } catch {
    // Table might not exist - show default roles
    roleList = [
      { id: "1", code: "ADMIN", name: "Administrator", description: "Full system access", isSystemRole: true, isActive: true, permissions: PERMISSIONS },
      { id: "2", code: "MANAGER", name: "Manager", description: "Department management access", isSystemRole: true, isActive: true, permissions: [] },
      { id: "3", code: "USER", name: "Standard User", description: "Basic access to assigned modules", isSystemRole: true, isActive: true, permissions: [] },
      { id: "4", code: "AUDITOR", name: "Auditor", description: "Read-only access for audit purposes", isSystemRole: true, isActive: true, permissions: [] },
    ];
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">Define roles and permissions for users</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/users">
            <Button variant="outline"><Users className="mr-2 h-4 w-4" /> View Users</Button>
          </Link>
          <Link href="/settings/roles/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Role</Button>
          </Link>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roleList.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                {role.isSystemRole && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" /> System
                  </Badge>
                )}
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-mono">{role.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Permissions</span>
                  <span>{Array.isArray(role.permissions) ? role.permissions.length : 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <hr />
                <div className="flex gap-2">
                  <Link href={`/settings/roles/${role.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
          <CardDescription>System permissions that can be assigned to roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {PERMISSIONS.map((perm) => (
              <div key={perm} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {perm}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
