import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewCreditNotePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="New Credit Note"
        description="Issue credit to a customer"
        icon={FileText}
      />
      
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Credit notes are typically generated from Sales Returns.</p>
          <p className="mt-2">Create a Sales Return first, then use &quot;Generate Credit Note&quot; action.</p>
          <br />
          <div className="flex gap-2 justify-center">
            <Link href="/sales/returns/new">
              <Button>Create Sales Return</Button>
            </Link>
            <Link href="/sales/credit-notes">
              <Button variant="outline">Back to Credit Notes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
