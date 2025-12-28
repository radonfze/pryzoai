import { db } from "@/db";
import { billOfMaterials, items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import GradientHeader from "@/components/ui/gradient-header";
import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function BOMPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const boms = await db.query.billOfMaterials.findMany({
    where: eq(billOfMaterials.companyId, companyId),
    with: {
      finishedItem: true
    },
    orderBy: [desc(billOfMaterials.createdAt)],
    limit: 50
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="manufacturing"
        title="Bill of Materials"
        description="Define product structures and component relationships"
        icon={Layers}
      />

      <div className="flex items-center justify-end">
        <Link href="/manufacturing/bom/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create BOM</Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>BOM Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Finished Item</TableHead>
              <TableHead>Output Qty</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No BOMs found. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              boms.map((bom) => (
                <TableRow key={bom.id}>
                  <TableCell className="font-mono text-xs">{bom.bomCode}</TableCell>
                  <TableCell className="font-medium">{bom.bomName}</TableCell>
                  <TableCell>{bom.finishedItem?.name || "-"}</TableCell>
                  <TableCell>{Number(bom.outputQuantity)} {bom.uom}</TableCell>
                  <TableCell>v{bom.version}</TableCell>
                  <TableCell>
                    <Badge variant={bom.status === "active" ? "default" : "secondary"}>
                      {bom.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(bom.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
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
