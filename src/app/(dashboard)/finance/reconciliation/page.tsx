import GradientHeader from "@/components/ui/gradient-header";
import { Building2, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

// Placeholder transactions
const transactions = [
  { id: "1", date: "2024-12-28", description: "Customer Payment - ABC Corp", debit: 0, credit: 15000, matched: true },
  { id: "2", date: "2024-12-27", description: "Supplier Payment - XYZ Ltd", debit: 8500, credit: 0, matched: true },
  { id: "3", date: "2024-12-26", description: "Bank Charges", debit: 150, credit: 0, matched: false },
  { id: "4", date: "2024-12-25", description: "Transfer from Savings", debit: 0, credit: 50000, matched: false },
  { id: "5", date: "2024-12-24", description: "Utility Bill Payment", debit: 2300, credit: 0, matched: true },
];

export default async function ReconciliationPage() {
  const bankBalance = 125000;
  const bookBalance = 122350;
  const difference = bankBalance - bookBalance;
  const matchedCount = transactions.filter(t => t.matched).length;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="finance"
        title="Bank Reconciliation"
        description="Match bank statements with book entries"
        icon={Building2}
      />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import Statement
        </Button>
        <Button>
          Auto-Match Transactions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bank Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bankBalance.toLocaleString()} AED</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Book Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bookBalance.toLocaleString()} AED</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {difference.toLocaleString()} AED
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{matchedCount}/{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unreconciled Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id} className={txn.matched ? "bg-green-50" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded" defaultChecked={txn.matched} />
                  </TableCell>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="text-right">{txn.debit > 0 ? txn.debit.toLocaleString() : "-"}</TableCell>
                  <TableCell className="text-right">{txn.credit > 0 ? txn.credit.toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    {txn.matched ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Matched
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" /> Unmatched
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Match</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
