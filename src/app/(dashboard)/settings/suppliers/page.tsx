import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const supplierList = await db.query.suppliers.findMany({
    where: eq(suppliers.companyId, companyId),
    orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Suppliers"
        description="Manage your vendor relationships and contacts"
        icon={UserPlus}
      />
      <div className="flex items-center justify-end">
        <Link href="/settings/suppliers/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Supplier</Button>
        </Link>
      </div>

      {supplierList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No suppliers yet.</p>
          <p className="text-sm mt-2">Click "Add Supplier" to create your first supplier.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>TRN</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierList.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.code}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.taxId}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                      {supplier.isActive ? "Active" : "Inactive"}
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
