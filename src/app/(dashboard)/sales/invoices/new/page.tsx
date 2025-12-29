import { InvoiceForm } from "@/components/sales/invoice-form";
import { getInvoiceMasterData } from "@/actions/sales/create-invoice";

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const masterData = await getInvoiceMasterData();

  return (
    <div className="flex-1 p-4 md:p-8">
      <InvoiceForm 
        customers={masterData.customers} 
        items={masterData.items} 
        warehouses={masterData.warehouses} 
      />
    </div>
  );
}