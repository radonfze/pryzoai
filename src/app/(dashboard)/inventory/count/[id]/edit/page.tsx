"use client";

import { GradientHeader } from "@/components/ui/gradient-header";
import { Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EditStockCountPageProps {
  params: { id: string };
}

export default function EditStockCountPage({ params }: EditStockCountPageProps) {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Stock Count"
        description={`Editing count ${params.id}`}
        icon={Edit}
      />
      
      <Card>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
             Stock Count Edit Form - Coming Soon
             <br/>
             <small className="text-xs mt-2">Will load existing count data and allow updates to counted quantities</small>
          </CardContent>
      </Card>
    </div>
  );
}
