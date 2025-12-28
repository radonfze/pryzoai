import { db } from "@/db";
import { salesOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DeliveryNotesTable } from "@/components/sales/delivery-notes-table";

export const dynamic = 'force-dynamic';

export default async function DeliveryNotesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Delivery notes are based on sales orders with delivery tracking
  const orders = await db.query.salesOrders.findMany({
    where: eq(salesOrders.companyId, companyId),
    with: { customer: true },
    orderBy: [desc(salesOrders.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Delivery Notes"
        description="Track order deliveries and shipments"
        icon={Truck}
      />

      <div className="flex justify-end">
        <Link href="/sales/delivery-notes/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Delivery Note</Button>
        </Link>
      </div>

      <DeliveryNotesTable orders={orders} />
    </div>
  );
}
