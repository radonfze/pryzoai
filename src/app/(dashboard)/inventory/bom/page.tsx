import { db } from "@/db";
import { bom } from "@/db/schema/items";
import { getCompanyId } from "@/lib/auth";
import { getBoms } from "@/actions/inventory/bom";
import GradientHeader from "@/components/ui/gradient-header";
import { Scroll, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BomListPage() {
  const boms = await getBoms();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <GradientHeader
            module="inventory"
            title="Bill of Materials"
            description="Manage manufacturing recipes and assembly structures."
            icon={Scroll}
        />
        <Link href="/inventory/bom/new">
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Create BOM
            </Button>
        </Link>
      </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boms.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                    No BOMs found. Create your first recipe!
                </div>
            )}
            {boms.map((b) => (
                <Card key={b.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {b.name}
                        </CardTitle>
                        <Badge variant={b.isActive ? "default" : "secondary"}>
                            {b.isActive ? "Active" : "Inactive"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{b.item.name}</div>
                        <p className="text-xs text-muted-foreground">
                            Parent Item Code: {b.item.code}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground">
                            {b.lines.length} Components defined
                        </div>
                         <div className="mt-2 text-xs text-muted-foreground">
                            Created: {format(b.createdAt, "PPP")}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
