import { db } from "@/db";
import { items, categories, brands } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import ItemForm from "@/components/inventory/item-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Edit } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditItemPage({ params }: { params: { id: string } }) {
    const companyId = await getCompanyId();
    if (!companyId) return null;

    const item = await db.query.items.findFirst({
        where: and(eq(items.id, params.id), eq(items.companyId, companyId))
    });

    if (!item) notFound();

    const [categoryList, brandList] = await Promise.all([
        db.query.categories.findMany({ where: and(eq(categories.companyId, companyId), eq(categories.isActive, true)) }),
        db.query.brands.findMany({ where: and(eq(brands.companyId, companyId), eq(brands.isActive, true)) })
    ]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title={`Edit ${item.name}`}
        description="Update item details."
        icon={Edit}
      />
      <ItemForm initialData={item} categories={categoryList} brands={brandList} />
    </div>
  );
}
