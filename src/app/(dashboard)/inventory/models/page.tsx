import { getModels } from "@/actions/inventory/models";
import { ModelsClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Boxes } from "lucide-react";
import Link from "next/link";

export default async function ModelsPage() {
  const dataRaw = await getModels();
  const models = dataRaw.map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString() ?? null,
      updatedAt: item.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Models"
        description="Manage item models and variants"
        icon={Boxes}
      >
        <Link href="/inventory/models/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Model
          </Button>
        </Link>
      </GradientHeader>

      <ModelsClient data={models} />
    </div>
  );
}

export const dynamic = 'force-dynamic';