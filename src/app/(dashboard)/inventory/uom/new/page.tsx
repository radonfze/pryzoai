"use client";

import { GradientHeader } from "@/components/ui/gradient-header";
import { Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NewUOMPage() {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Unit of Measure"
        description="Create a new unit of measure"
        icon={Scale}
      />
      
      <Card>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
             New UOM Form Implementation Pending...
          </CardContent>
      </Card>
    </div>
  );
}
