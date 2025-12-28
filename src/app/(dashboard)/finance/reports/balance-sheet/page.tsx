"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export default function BalanceSheetPage() {
  const router = useRouter();

  // Mock Data
  const assets = [
    { name: "Cash on Hand", amount: 50000 },
    { name: "Bank Accounts", amount: 150000 },
    { name: "Accounts Receivable", amount: 25000 },
    { name: "Inventory Asset", amount: 75000 },
  ];

  const liabilities = [
     { name: "Accounts Payable", amount: 30000 },
     { name: "VAT Payable", amount: 5000 },
  ];

  const equity = [
      { name: "Capital", amount: 200000 },
      { name: "Retained Earnings", amount: 65000 },
  ];

  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

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
           <CardTitle className="text-2xl font-bold">Balance Sheet</CardTitle>
           <p className="text-muted-foreground">As of {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
            
            {/* Assets */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-emerald-600">ASSETS</h3>
                <Table>
                    <TableBody>
                        {assets.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold">
                            <TableCell>TOTAL ASSETS</TableCell>
                            <TableCell className="text-right font-mono">{totalAssets.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* Liabilities */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-red-600">LIABILITIES</h3>
                <Table>
                    <TableBody>
                        {liabilities.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold">
                            <TableCell>TOTAL LIABILITIES</TableCell>
                            <TableCell className="text-right font-mono">{totalLiabilities.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* Equity */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-blue-600">EQUITY</h3>
                <Table>
                    <TableBody>
                        {equity.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold">
                            <TableCell>TOTAL EQUITY</TableCell>
                            <TableCell className="text-right font-mono">{totalEquity.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

             <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg font-bold text-lg">
                <span>Total Liabilities & Equity</span>
                <span>AED {(totalLiabilities + totalEquity).toLocaleString()}</span>
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
