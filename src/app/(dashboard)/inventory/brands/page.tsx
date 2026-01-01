import { getBrands } from "@/actions/inventory/brands";
import { BrandsClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Brands"
        description="Manage item brands"
        icon={Tag}
      >
        <Link href="/inventory/brands/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        </Link>
      </GradientHeader>

      <BrandsClient data={brands} />
    </div>
  );
}

export const dynamic = 'force-dynamic';