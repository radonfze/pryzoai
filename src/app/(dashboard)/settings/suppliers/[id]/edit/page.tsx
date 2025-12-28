import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Truck } from "lucide-react";
import { SupplierForm } from "@/components/settings/supplier-form";

export const dynamic = 'force-dynamic';

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, params.id),
  });

  if (!supplier) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="settings"
        title={`Edit Supplier: ${supplier.name}`}
        description="Update supplier information"
        icon={Truck}
      />

      <SupplierForm initialData={supplier} />
    </div>
  );
}
