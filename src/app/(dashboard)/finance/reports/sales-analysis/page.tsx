"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, ArrowLeft, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GradientHeader from "@/components/ui/gradient-header";

export default function SalesAnalysisPage() {
  const router = useRouter();

  const salesData = [
    { customer: "Al-Futtaim Group", invoices: 5, total: 150000, paid: 120000, balance: 30000 },
    { customer: "Emaar Properties", invoices: 3, total: 85000, paid: 85000, balance: 0 },
    { customer: "Etisalat", invoices: 8, total: 210000, paid: 100000, balance: 110000 },
    { customer: "Careem", invoices: 2, total: 15000, paid: 0, balance: 15000 },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Sales Analysis</h2>
            <p className="text-muted-foreground">Revenue breakdown by customer</p>
        </div>
        <div className="flex gap-2">
            <Select defaultValue="this_month">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">AED 460,000</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Collected</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">AED 305,000</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">AED 155,000</div></CardContent>
        </Card>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
           <CardTitle>Customer Performance</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Paid Amount</TableHead>
                        <TableHead className="text-right">Balance Due</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {salesData.map((item) => (
                        <TableRow key={item.customer}>
                            <TableCell className="font-medium">{item.customer}</TableCell>
                            <TableCell className="text-right">{item.invoices}</TableCell>
                            <TableCell className="text-right font-mono">{item.total.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{item.paid.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-red-600">{item.balance.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
