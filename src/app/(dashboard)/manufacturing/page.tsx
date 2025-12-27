import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Box, ClipboardList, Wrench } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ManufacturingPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manufacturing</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products in BOM</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending QC</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workstations</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/manufacturing/work-orders" className="block p-2 hover:bg-muted rounded-md transition-colors">
              View All Work Orders
            </Link>
            <Link href="/manufacturing/work-orders/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Create Work Order
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bill of Materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/manufacturing/bom" className="block p-2 hover:bg-muted rounded-md transition-colors">
              View BOMs
            </Link>
            <Link href="/manufacturing/bom/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Create BOM
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/manufacturing/routing" className="block p-2 hover:bg-muted rounded-md transition-colors">
              Routing
            </Link>
            <Link href="/manufacturing/qc" className="block p-2 hover:bg-muted rounded-md transition-colors">
              Quality Control
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
