import GradientHeader from "@/components/ui/gradient-header";
import { Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewSalesReturnPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="New Sales Return"
        description="Create a return for a customer"
        icon={Undo2}
      />
      
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Sales Return form will be implemented after Customer Return Form component is created.</p>
          <p className="mt-2">For now, returns can be created via the Sales Order or Invoice detail pages.</p>
          <br />
          <Link href="/sales/returns">
            <Button variant="outline">Back to Returns</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
