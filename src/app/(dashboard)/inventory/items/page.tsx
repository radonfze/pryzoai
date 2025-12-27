import { db } from "@/db";
import { items, stockLedger } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export default async function ItemsPage() {
  // Fetch items with their stock ledger entry (if any)
  // For simplicity MVP, we just fetch items and a separate map of stock, or left join
  // Drizzle query API supports relations
  
  // Note: Stock Ledger is per warehouse. We need TOTAL stock.
  // For this list view, let's just list items.
  const allItems = await db.query.items.findMany({
    where: eq(items.companyId, DEMO_COMPANY_ID),
    limit: 50
  });

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Items</h2>
            <p className="text-muted-foreground">Manage your products and services.</p>
         </div>
         <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Item
         </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
            ) : (
                allItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell>--</TableCell> 
                        <TableCell className="text-right">
                            {Number(item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                            <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
