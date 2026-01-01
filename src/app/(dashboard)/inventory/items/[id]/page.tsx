import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, Barcode, Tag, DollarSign, Layers } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.query.items.findFirst({
    where: eq(items.id, id),
    with: {
        category: true,
        brand: true,
        units: true
    }
  });

  if (!item) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="inventory"
            title={`${item.name}`}
            description="View item details and stock information"
            icon={Package}
          />
        <div className="flex gap-2">
            <Link href="/inventory/items">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={`/inventory/items/${item.id}/edit`}>
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Item</Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Item Information</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                   <p className="text-lg font-medium">{item.name}</p>
                   <p className="text-sm text-gray-500">{item.nameAr}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Item Code</label>
                   <p className="text-lg font-mono">{item.code}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Category</label>
                   <p>{item.category?.name || "-"}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Brand</label>
                   <p>{item.brand?.name || "-"}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Type</label>
                   <div className="mt-1">
                       <Badge variant="outline" className="capitalize">
                           {item.itemType}
                       </Badge>
                   </div>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                       <Badge variant={item.isActive ? 'default' : 'secondary'}>
                           {item.isActive ? 'Active' : 'Inactive'}
                       </Badge>
                   </div>
               </div>
           </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Pricing & Tax</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Selling Price</span>
                    <span className="font-bold text-lg">{Number(item.sellingPrice || 0).toLocaleString()} AED</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Price</span>
                    <span>{Number(item.costPrice || 0).toLocaleString()} AED</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Selling Price</span>
                    <span>{Number(item.minSellingPrice || 0).toLocaleString()} AED</span>
                </div>
                <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax Rate</span>
                        <span>{Number(item.taxPercent || 0)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Stock Settings */}
        <Card className="md:col-span-2">
             <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-4 w-4" /> Inventory Settings</CardTitle></CardHeader>
             <CardContent className="grid gap-4 md:grid-cols-3">
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Main UOM</label>
                     <p className="font-medium">{item.uom}</p>
                 </div>
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Reorder Level</label>
                     <p className="font-medium">{Number(item.reorderLevel || 0)}</p>
                 </div>
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Reorder Qty</label>
                     <p>{Number(item.reorderQty || 0)}</p>
                 </div>
                 <div className="md:col-span-3 flex gap-4 mt-2">
                     {item.hasSerialNo && <Badge variant="secondary"><Tag className="w-3 h-3 mr-1" /> Serial Tracking</Badge>}
                     {item.hasBatchNo && <Badge variant="secondary"><Layers className="w-3 h-3 mr-1" /> Batch Tracking</Badge>}
                     {item.hasExpiry && <Badge variant="secondary">Expiry Tracking</Badge>}
                 </div>
             </CardContent>
        </Card>

        {/* Barcode */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Barcode className="h-4 w-4" /> Barcode</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-4 border rounded bg-slate-50">
                    <Barcode className="h-16 w-16 mb-2 opacity-50" />
                    <p className="font-mono text-sm">{item.barcode || "No Barcode"}</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
