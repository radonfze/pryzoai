import { db } from "@/db";
import { customers, salesInvoices } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import GradientHeader from "@/components/ui/gradient-header";
import { CreditCard } from "lucide-react";
import { CustomerPaymentForm } from "@/components/sales/customer-payment-form";

export const dynamic = 'force-dynamic';

export default async function NewPaymentPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const customersList = await db.query.customers.findMany({
    where: eq(customers.companyId, companyId),
    columns: { id: true, name: true, code: true }
  });

  // Get open invoices with balance > 0
  const openInvoices = await db.query.salesInvoices.findMany({
    where: and(
      eq(salesInvoices.companyId, companyId),
      ne(salesInvoices.status, "paid")
    ),
    columns: { 
      id: true, 
      invoiceNumber: true, 
      customerId: true, 
      dueDate: true, 
      totalAmount: true, 
      balanceAmount: true 
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Receive Payment"
        description="Record customer payment and allocate to invoices"
        icon={CreditCard}
      />

      <CustomerPaymentForm 
        customers={customersList} 
        openInvoices={openInvoices} 
      />
    </div>
  );
}
