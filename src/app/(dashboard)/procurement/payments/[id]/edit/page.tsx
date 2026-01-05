import { db } from "@/db";
import { supplierPayments, suppliers, purchaseInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { DollarSign } from "lucide-react";
import { SupplierPaymentForm } from "@/components/procurement/supplier-payment-form";

export const dynamic = 'force-dynamic';

export default async function EditPaymentPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const [payment, supplierList, unpaidBills] = await Promise.all([
    db.query.supplierPayments.findFirst({
      where: eq(supplierPayments.id, params.id),
      with: {
        allocations: true,
      },
    }),
    db.query.suppliers.findMany({
      where: eq(suppliers.companyId, companyId),
      columns: { id: true, name: true }
    }),
    db.query.purchaseInvoices.findMany({
      where: eq(purchaseInvoices.companyId, companyId),
      columns: { 
        id: true, 
        invoiceNumber: true, 
        totalAmount: true, 
        balanceAmount: true,
        supplierId: true,
      }
    })
  ]);

  if (!payment) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Edit Supplier Payment"
        description={`Editing ${payment.paymentNumber}`}
        icon={DollarSign}
      />
      <SupplierPaymentForm 
        suppliers={supplierList} 
        unpaidBills={unpaidBills}
        initialData={payment as any} 
      />
    </div>
  );
}
