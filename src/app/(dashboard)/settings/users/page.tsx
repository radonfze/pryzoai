import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog, Eye, Shield } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let userList: any[] = [];
  try {
    userList = await db.query.users.findMany({
      where: eq(users.companyId, companyId),
      orderBy: [desc(users.createdAt)],
      limit: 50,
    });
  } catch {
    // Table might not exist
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-red-500">Admin</Badge>;
      case "manager": return <Badge className="bg-blue-500">Manager</Badge>;
      case "auditor": return <Badge className="bg-purple-500">Auditor</Badge>;
      case "technician": return <Badge variant="secondary">Technician</Badge>;
      default: return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage system users and their access</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/roles">
            <Button variant="outline"><Shield className="mr-2 h-4 w-4" /> Manage Roles</Button>
          </Link>
          <Link href="/settings/users/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add User</Button>
          </Link>
        </div>
      </div>

      {userList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No users found.</p>
          <p className="text-sm mt-2">Add users to grant system access.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    {user.lastLoginAt 
                      ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm") 
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/settings/users/${user.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
