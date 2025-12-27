import { db } from "@/db";
import { bankAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, CreditCard, Landmark } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BankAccountsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let accounts: any[] = [];
  try {
    accounts = await db.query.bankAccounts.findMany({
      where: eq(bankAccounts.companyId, companyId),
    });
  } catch {
    // Table might not exist
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
        <Link href="/finance/bank-accounts/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Bank Account</Button>
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No bank accounts configured.</p>
          <p className="text-sm mt-2">Add your company's bank accounts for payment tracking.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{account.accountName}</CardTitle>
                {account.accountType === "current" ? (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span>{account.bankName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account #</span>
                    <span className="font-mono">{account.accountNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span>{account.currency || "AED"}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Balance</span>
                    <span className="font-mono">
                      {account.currency || "AED"} {Number(account.currentBalance || 0).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
