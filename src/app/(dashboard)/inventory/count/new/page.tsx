"use client";

import { GradientHeader } from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NewStockCountPage() {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Stock Count"
        description="Initialize a new stock counting session"
        icon={ClipboardList}
      />
      
      <Card>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
             New Stock Count Form Implementation Pending...
          </CardContent>
      </Card>
    </div>
  );
}
