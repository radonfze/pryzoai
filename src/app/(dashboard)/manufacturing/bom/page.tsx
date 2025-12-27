import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Package, Eye } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function BOMPage() {
  // Mock data
  const boms = [
    { id: 1, code: "BOM-001", product: "Widget A", components: 5, isActive: true },
    { id: 2, code: "BOM-002", product: "Widget B", components: 8, isActive: true },
    { id: 3, code: "BOM-003", product: "Assembly C", components: 12, isActive: false },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bill of Materials</h2>
          <p className="text-muted-foreground">Define product recipes and component lists</p>
        </div>
        <Link href="/manufacturing/bom/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New BOM</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All BOMs</CardTitle>
        </CardHeader>
        <CardContent>
          {boms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No BOMs defined yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOM Code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Components</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id}>
                    <TableCell className="font-medium font-mono">{bom.code}</TableCell>
                    <TableCell>{bom.product}</TableCell>
                    <TableCell className="text-right">{bom.components}</TableCell>
                    <TableCell>
                      <Badge variant={bom.isActive ? "default" : "secondary"}>
                        {bom.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
