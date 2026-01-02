import { GradientHeader } from "@/components/ui/gradient-header";
import { Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUoms } from "@/actions/inventory/uom";
import { UomsClient } from "./client";

export default async function UOMListPage() {
  const dataRaw = await getUoms();
  const uoms = dataRaw.map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString() ?? null,
      updatedAt: item.updatedAt?.toISOString() ?? null,
  }));

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
      
      <UomsClient data={uoms} />
    </div>
  );
}
