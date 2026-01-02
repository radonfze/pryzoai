import { getCategories } from "@/actions/inventory/categories";
import { CategoriesClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Tags } from "lucide-react";
import Link from "next/link";

export default async function CategoriesPage() {
  const categoriesRaw = await getCategories();
  const categories = categoriesRaw.map(cat => ({
      ...cat,
      createdAt: cat.createdAt?.toISOString() ?? null,
      updatedAt: cat.updatedAt?.toISOString() ?? null,
      parentCreatedAt: cat.parentCreatedAt?.toISOString() ?? null, // From join alias if exists
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Item Categories"
        description="Organize your inventory with product categories"
        icon={Tags}
      >
        <Link href="/inventory/categories/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </Link>
      </GradientHeader>

      <CategoriesClient data={categories} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
