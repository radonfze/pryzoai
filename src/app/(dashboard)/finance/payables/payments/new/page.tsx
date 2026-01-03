import GradientHeader from "@/components/ui/gradient-header";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewSupplierPaymentPage() {
  // TODO: Create SupplierPaymentForm similar to CustomerPaymentForm
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="New Supplier Payment"
        description="Record payment to supplier"
        icon={CreditCard}
      />
      
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Supplier Payment Form implementation pending.</p>
          <p className="mt-2">Similar to customer payments - select supplier, open bills, and allocate.</p>
          <br />
          <Link href="/procurement/payments">
            <Button variant="outline">Back to Payments</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
