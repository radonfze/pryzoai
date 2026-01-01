"use client";

import { GradientHeader } from "@/components/ui/gradient-header";
import { Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function UOMListPage() {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Units of Measure"
        description="Manage units of measure and conversion factors"
        icon={Scale}
      >
        <Link href="/inventory/uom/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New UOM
          </Button>
        </Link>
      </GradientHeader>
      
      <Card>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
             UOM List Implementation Pending...
          </CardContent>
      </Card>
    </div>
  );
}
