import GradientHeader from "@/components/ui/gradient-header";
import { Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewDeliveryNotePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="New Delivery Note"
        description="Create delivery note from a sales order"
        icon={Truck}
      />
      
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Delivery notes are typically generated from Sales Orders.</p>
          <p className="mt-2">Open a Sales Order and use &quot;Create Delivery Note&quot; action.</p>
          <br />
          <div className="flex gap-2 justify-center">
            <Link href="/sales/orders">
              <Button>View Sales Orders</Button>
            </Link>
            <Link href="/sales/delivery-notes">
              <Button variant="outline">Back to Delivery Notes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
