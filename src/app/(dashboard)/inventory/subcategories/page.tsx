import { getSubcategories } from "@/actions/inventory/subcategories";
import { SubcategoriesClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";
import Link from "next/link";

export default async function SubcategoriesPage() {
  const subcategories = await getSubcategories();

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Subcategories"
        description="Manage item subcategories (Level 2)"
        icon={Layers}
      >
        <Link href="/inventory/subcategories/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Subcategory
          </Button>
        </Link>
      </GradientHeader>

      <SubcategoriesClient data={subcategories} />
    </div>
  );
}

export const dynamic = 'force-dynamic';