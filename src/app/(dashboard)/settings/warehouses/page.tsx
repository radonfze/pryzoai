"use server";

import { db } from "@/db";
import { warehouses } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function WarehousesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const warehouseList = await db.query.warehouses.findMany({
    where: eq(warehouses.companyId, companyId),
    orderBy: (warehouses, { asc }) => [asc(warehouses.name)],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
        <Link href="/settings/warehouses/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Warehouse</Button>
        </Link>
      </div>

      {warehouseList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No warehouses yet.</p>
          <p className="text-sm mt-2">Click "Add Warehouse" to create your first warehouse.</p>
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
              {warehouseList.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>{warehouse.code}</TableCell>
                  <TableCell>{warehouse.address}</TableCell>
                  <TableCell>
                    <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                      {warehouse.isActive ? "Active" : "Inactive"}
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
