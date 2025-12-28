import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Users } from "lucide-react";
import { CustomerForm } from "@/components/settings/customer-form";

export const dynamic = 'force-dynamic';

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, params.id),
  });

  if (!customer) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="settings"
        title={`Edit Customer: ${customer.name}`}
        description="Update customer information"
        icon={Users}
      />

      <CustomerForm initialData={customer} />
    </div>
  );
}
