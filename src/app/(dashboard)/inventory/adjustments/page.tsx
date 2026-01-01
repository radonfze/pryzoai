"use client";

import { GradientHeader } from "@/components/ui/gradient-header";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function StockAdjustmentsPage() {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Stock Adjustments"
        description="View and manage stock adjustments"
        icon={ClipboardList}
      >
        <Link href="/inventory/adjustments/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        </Link>
      </GradientHeader>
      
      <Card>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
             Stock Adjustment List Implementation Pending...
          </CardContent>
      </Card>
    </div>
  );
}
