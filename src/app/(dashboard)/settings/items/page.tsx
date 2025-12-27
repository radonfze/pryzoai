"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ItemsSettingsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    orderBy: (items, { asc }) => [asc(items.name)],
    limit: 100,
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Items</h2>
        <Link href="/settings/items/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
        </Link>
      </div>

      {itemList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No items yet.</p>
          <p className="text-sm mt-2">Click "Add Item" to create your first inventory item.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="capitalize">{item.itemType}</TableCell>
                  <TableCell>{Number(item.sellingPrice).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
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
