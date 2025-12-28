"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Printer, Filter, Calendar } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const reports = [
    {
      category: "Financial Statements",
      items: [
        { title: "Profit & Loss", description: "Statement of comprehensive income", href: "/finance/reports/profit-loss" },
        { title: "Balance Sheet", description: "Statement of financial position", href: "/finance/reports/balance-sheet" },
        { title: "Cash Flow", description: "Inflows and outflows of cash" },
        { title: "Trial Balance", description: "List of all accounts and balances" },
      ]
    },
    {
      category: "Tax & Compliance",
      items: [
        { title: "VAT Return", description: "UAE VAT 201 Report" },
        { title: "Tax Audit File", description: "FTA Audit File (FAF)" },
      ]
    },
    {
      category: "Receivables & Payables",
      items: [
        { title: "Customer Aging", description: "Unpaid invoices by age" },
        { title: "Supplier Aging", description: "Unpaid bills by age" },
        { title: "Sales Analysis", description: "Sales by customer/item", href: "/finance/reports/sales-analysis" },
        { title: "Purchase Analysis", description: "Expenses by category" },
      ]
    },
    {
       category: "Inventory",
       items: [
         { title: "Stock Ledger", description: "Movement of items" },
         { title: "Stock Valuation", description: "Current value of inventory", href: "/finance/reports/inventory-valuation" },
       ]
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="finance" // using finance color scheme
        title="Financial Reports"
        description="Generate statements, tax reports, and business analytics"
        icon={FileDown}
      />
      
      <div className="flex gap-4 items-center p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
         <Filter className="h-4 w-4 text-muted-foreground" />
         <Select defaultValue="this_month">
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
         </Select>
         <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Vector Print
         </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((section) => (
          <div key={section.category} className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">{section.category}</h3>
            <div className="grid gap-4">
              {section.items.map((report) => (
                <div key={report.title} className="relative group">
                    <Card className="flex flex-row items-center justify-between p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{report.title}</h4>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                    <div className="flex gap-2">
                         {/* @ts-ignore */}
                        {report.href ? (
                            <Button size="sm" variant="outline" onClick={() => window.location.href = report.href}>
                                Preview
                            </Button>
                        ) : (
                             <Button size="sm" variant="outline" disabled>Preview</Button>
                        )}
                        <Button size="sm" disabled>
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </div>
                    </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
