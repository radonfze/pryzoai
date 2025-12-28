import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { Building } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const branchList = await db.query.branches.findMany({
    where: eq(branches.companyId, companyId),
    orderBy: (branches, { asc }) => [asc(branches.name)],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="settings"
        title="Branches"
        description="Manage company branches and divisions"
        icon={Building}
      />
      <div className="flex items-center justify-end">
        <Link href="/settings/branches/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Branch</Button>
        </Link>
      </div>

      {branchList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No branches yet.</p>
          <p className="text-sm mt-2">Click "Add Branch" to create your first branch.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchList.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.code}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? "default" : "secondary"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
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
