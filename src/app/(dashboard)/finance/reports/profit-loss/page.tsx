"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfitLossPage() {
  const router = useRouter();

  // Mock Data
  const income = [
    { name: "Sales Revenue", amount: 120000 },
    { name: "Service Income", amount: 15000 },
  ];

  const cogs = [
     { name: "Cost of Goods Sold", amount: 45000 },
  ];

  const expenses = [
      { name: "Rent Expense", amount: 5000 },
      { name: "Salaries & Wages", amount: 12000 },
      { name: "Utilities", amount: 1500 },
      { name: "Marketing", amount: 3000 },
  ];

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalCOGS = cogs.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalIncome - totalCOGS;
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
        <CardHeader className="text-center border-b">
           <CardTitle className="text-2xl font-bold">Profit & Loss Statement</CardTitle>
           <p className="text-muted-foreground">For the period ending {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
            
            {/* Income */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-emerald-600">INCOME</h3>
                <Table>
                    <TableBody>
                        {income.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Total Income</TableCell>
                            <TableCell className="text-right font-mono">{totalIncome.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* COGS */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-orange-600">COST OF GOODS SOLD</h3>
                <Table>
                    <TableBody>
                         {cogs.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-mono text-red-600">({item.amount.toLocaleString()})</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

             <div className="flex justify-between items-center bg-gray-50 p-3 rounded font-bold">
                <span>GROSS PROFIT</span>
                <span>{grossProfit.toLocaleString()}</span>
            </div>

            {/* Expenses */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-red-600">OPERATING EXPENSES</h3>
                <Table>
                    <TableBody>
                        {expenses.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Total Expenses</TableCell>
                            <TableCell className="text-right font-mono text-red-600">({totalExpenses.toLocaleString()})</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

             <div className="flex justify-between items-center bg-green-100 p-4 rounded-lg font-bold text-xl border border-green-200">
                <span>NET PROFIT</span>
                <span>AED {netProfit.toLocaleString()}</span>
            </div>

        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .rounded-md { border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
