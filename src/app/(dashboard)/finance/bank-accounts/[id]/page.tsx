import { db } from "@/db";
import { bankAccounts, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function BankAccountDetailPage({ params }: { params: { id: string } }) {
  const account = await db.query.bankAccounts.findFirst({
    where: eq(bankAccounts.id, params.id),
  });

  if (!account) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="finance"
        title={account.accountName}
        description={`Account: ${account.accountNumber}`}
        icon={Landmark}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/finance/bank-accounts/${params.id}/edit`}>
          <Button variant="outline">Edit Account</Button>
        </Link>
        <Link href="/finance/reconciliation">
          <Button>Start Reconciliation</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Bank Name</span><span className="font-medium">{account.bankName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Account Number</span><span>{account.accountNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IBAN</span><span>{account.iban || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SWIFT</span><span>{account.swiftCode || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span>{account.currencyCode}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
              <Badge variant={account.isActive ? "default" : "secondary"}>
                {account.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Current Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{Number(account.currentBalance || 0).toLocaleString()} {account.currencyCode}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Opening Balance: {Number(account.openingBalance || 0).toLocaleString()} {account.currencyCode}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Linked GL Account</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="text-muted-foreground">GL Account ID:</div>
            <div className="font-medium">{account.glAccountId || "Not linked"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          Transaction history will be displayed here
        </CardContent>
      </Card>
    </div>
  );
}
