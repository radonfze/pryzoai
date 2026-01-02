import { db } from "@/db";
import { bom, items } from "@/db/schema/items";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import BomForm from "@/components/inventory/bom-form";
import GradientHeader from "@/components/ui/gradient-header";
import { FileEdit } from "lucide-react";
import { notFound } from "next/navigation";

interface EditBomPageProps {
  params: { id: string };
}

export default async function EditBomPage({ params }: EditBomPageProps) {
  const companyId = await getCompanyIdSafe();
  if (!companyId) return null;

  const bomData = await db.query.bom.findFirst({
    where: and(eq(bom.id, params.id), eq(bom.companyId, companyId)),
    with: {
      lines: true,
    },
  });

  if (!bomData) {
    notFound();
  }

  // Fetch all active items to populate dropdowns
  const allItems = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
    columns: {
      id: true,
      code: true,
      name: true,
      uom: true,
    },
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Edit BOM"
        description={`Editing BOM #${bomData.bomNumber || params.id}`}
        icon={FileEdit}
      />
      <BomForm items={allItems} initialData={bomData as any} isEdit />
    </div>
  );
}
