"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, ArrowLeft, Package } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InventoryValuationPage() {
  const router = useRouter();

  const inventoryData = [
    { item: "Laptop Dell XPS 15", sku: "IT-001", qty: 45, avgCost: 4500, value: 202500 },
    { item: "Monitor LG 27''", sku: "IT-005", qty: 120, avgCost: 800, value: 96000 },
    { item: "Wireless Keyboard", sku: "ACC-023", qty: 300, avgCost: 150, value: 45000 },
    { item: "USB-C Hub", sku: "ACC-044", qty: 50, avgCost: 120, value: 6000 },
  ];

  const totalValue = inventoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <Package className="h-6 w-6" />
        </div>
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventory Valuation</h2>
            <p className="text-muted-foreground">Current sock value by item (Weighted Average)</p>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
           <div className="flex justify-between items-center">
               <CardTitle>Stock Details</CardTitle>
               <div className="text-xl font-bold">Total Value: AED {totalValue.toLocaleString()}</div>
           </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Quantity On Hand</TableHead>
                        <TableHead className="text-right">Avg. Cost</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventoryData.map((item) => (
                        <TableRow key={item.sku}>
                            <TableCell className="font-mono text-muted-foreground">{item.sku}</TableCell>
                            <TableCell className="font-medium">{item.item}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right font-mono">{item.avgCost.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono font-bold">{item.value.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                        <TableCell colSpan={4} className="text-right">TOTAL INVENTORY ASSET</TableCell>
                        <TableCell className="text-right font-mono">{totalValue.toLocaleString()}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .rounded-md { border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
