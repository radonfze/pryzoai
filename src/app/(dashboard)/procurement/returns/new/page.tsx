import GradientHeader from "@/components/ui/gradient-header";
import { Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewPurchaseReturnPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="New Purchase Return"
        description="Return goods to supplier"
        icon={Undo2}
      />
      
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Purchase Return form will be implemented after Supplier Return Form component is created.</p>
          <p className="mt-2">Returns can also be initiated from GRN or Purchase Bill detail pages.</p>
          <br />
          <div className="flex gap-2 justify-center">
            <Link href="/procurement/grn">
              <Button>View GRN</Button>
            </Link>
            <Link href="/procurement/returns">
              <Button variant="outline">Back to Returns</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
