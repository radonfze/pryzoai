"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Placeholder for actual data fetching
const mockInvoice = {
  number: "INV-2024-001",
  date: "2024-12-28",
  dueDate: "2025-01-28",
  customer: {
    name: "Al-Futtaim Group",
    address: "Dubai Festival City, Dubai, UAE",
    trn: "100200300400003"
  },
  items: [
    { description: "Professional Services - IT Consulting", qty: 40, rate: 250, total: 10000 },
    { description: "Software License - Annual", qty: 1, rate: 5000, total: 5000 },
  ],
  subtotal: 15000,
  tax: 750,
  total: 15750
};

export default function InvoicePrintPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Auto-print on load option
  // useEffect(() => window.print(), []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl no-print mb-6 flex justify-between">
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to details
         </Button>
         <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print PDF
         </Button>
      </div>

      {/* Invoice Document */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-lg p-[15mm] print:shadow-none print:p-0 print:m-0">
         
         {/* Header */}
         <div className="flex justify-between items-start border-b pb-8 mb-8">
            <div>
               <h1 className="text-4xl font-bold text-gray-900 mb-2">TAX INVOICE</h1>
               <p className="text-gray-500">Invoice #: {mockInvoice.number}</p>
            </div>
            <div className="text-right">
               {/* <Image src="/logo.png" alt="Company Logo" width={120} height={50} /> */}
               <div className="text-2xl font-bold text-primary mb-1">PRYZO AI</div>
               <p className="text-sm text-gray-500">Dubai Silicon Oasis</p>
               <p className="text-sm text-gray-500">Dubai, UAE</p>
               <p className="text-sm text-gray-500">TRN: 100000000000000</p>
            </div>
         </div>

         {/* Bill To */}
         <div className="flex justify-between mb-12">
            <div>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
               <p className="font-bold text-lg">{mockInvoice.customer.name}</p>
               <p className="text-gray-600 whitespace-pre-line">{mockInvoice.customer.address}</p>
               <p className="text-gray-600 mt-1">TRN: {mockInvoice.customer.trn}</p>
            </div>
            <div className="text-right">
               <div className="mb-2">
                  <span className="text-gray-500">Invoice Date:</span>
                  <span className="font-bold ml-4">{mockInvoice.date}</span>
               </div>
               <div>
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-bold ml-4">{mockInvoice.dueDate}</span>
               </div>
            </div>
         </div>

         {/* Items Table */}
         <table className="w-full mb-12">
            <thead>
               <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 font-bold text-gray-600">Description</th>
                  <th className="text-right py-3 font-bold text-gray-600">Qty</th>
                  <th className="text-right py-3 font-bold text-gray-600">Rate</th>
                  <th className="text-right py-3 font-bold text-gray-600">Amount</th>
               </tr>
            </thead>
            <tbody>
               {mockInvoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                     <td className="py-4 text-gray-800">{item.description}</td>
                     <td className="py-4 text-right text-gray-600">{item.qty}</td>
                     <td className="py-4 text-right text-gray-600">{item.rate.toLocaleString()}</td>
                     <td className="py-4 text-right font-medium">{item.total.toLocaleString()}</td>
                  </tr>
               ))}
            </tbody>
         </table>

         {/* Totals */}
         <div className="flex justify-end mb-12">
            <div className="w-1/3 space-y-3">
               <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{mockInvoice.subtotal.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-gray-600">
                  <span>VAT (5%)</span>
                  <span>{mockInvoice.tax.toLocaleString()}</span>
               </div>
               <div className="border-t pt-3 flex justify-between font-bold text-xl">
                  <span>Total (AED)</span>
                  <span>{mockInvoice.total.toLocaleString()}</span>
               </div>
            </div>
         </div>

         {/* Footer */}
         <div className="border-t pt-8 text-center text-gray-400 text-sm">
            <p>Thank you for your business!</p>
            <p className="mt-1">Please remit payment within 30 days.</p>
         </div>

      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body, .min-h-screen { background: white !important; margin: 0 !important; padding: 0 !important; }
          .max-w-4xl { max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
