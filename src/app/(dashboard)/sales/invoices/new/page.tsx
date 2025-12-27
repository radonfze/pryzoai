import { InvoiceForm } from "@/components/sales/invoice-form";
import { getInvoiceMasterData } from "@/actions/sales/create-invoice";

export default async function NewInvoicePage() {
  const masterData = await getInvoiceMasterData();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
      </div>
      
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
         <InvoiceForm 
            customers={masterData.customers} 
            items={masterData.items} 
            warehouses={masterData.warehouses} 
         />
      </div>
    </div>
  );
}
