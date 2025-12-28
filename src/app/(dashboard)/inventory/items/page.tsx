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
import { Plus, Package } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export default async function ItemsPage() {
  const allItems = await db.query.items.findMany({
    where: eq(items.companyId, DEMO_COMPANY_ID),
    limit: 50
  });

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
        module="inventory"
        title="Items Master"
        description="Manage your products, services, and inventory items"
        icon={Package}
      />
      
      <div className="flex items-center justify-end">
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
              <TableHead className="w-[80px]">Actions</TableHead>
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
                        {/* Schema uses itemType not type */}
                        <TableCell className="capitalize">{item.itemType}</TableCell>
                        <TableCell>--</TableCell> 
                        <TableCell className="text-right">
                            {Number(item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                            <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Link href={`/inventory/items/${item.id}`}>
                                <Button variant="ghost" size="icon">
                                    <Package className="h-4 w-4" />
                                </Button>
                            </Link>
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
