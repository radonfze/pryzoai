import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";
import { db } from "@/db";
import { purchaseInvoices, suppliers, items, warehouses, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PurchaseBillForm } from "@/components/procurement/purchase-bill-form";

export const dynamic = 'force-dynamic';

export default async function EditPurchaseBillPage({ params }: { params: Promise<{ id: string }> }) {
  const companyId = "00000000-0000-0000-0000-000000000000";
  const { id } = await params;

  const [bill, supplierList, itemList, warehouseList, projectList] = await Promise.all([
    db.query.purchaseInvoices.findFirst({
      where: eq(purchaseInvoices.id, id),
      with: {
        lines: true,
      },
    }),
    db.query.suppliers.findMany({
      where: eq(suppliers.companyId, companyId),
      columns: { id: true, name: true, email: true }
    }),
    db.query.items.findMany({
      where: eq(items.companyId, companyId),
      columns: { id: true, name: true, code: true, costPrice: true, taxPercent: true, isTaxable: true, uom: true }
    }),
    db.query.warehouses.findMany({
      where: eq(warehouses.companyId, companyId),
      columns: { id: true, name: true }
    }),
    db.query.projects.findMany({
      where: eq(projects.companyId, companyId),
      columns: { id: true, projectName: true, projectCode: true }
    })
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Edit Purchase Bill"
        description={`Editing ${bill.invoiceNumber}`}
        icon={FileText}
      />
      <PurchaseBillForm 
        suppliers={supplierList} 
        items={itemList} 
        warehouses={warehouseList}
        projects={projectList}
        initialData={bill as any}
      />
    </div>
  );
}
