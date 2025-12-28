import { db } from "@/db";
import { salesInvoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";

export default async function InvoicesPage() {
  // Fetch all invoices (limit 50 for MVP)
  const invoices = await db.query.salesInvoices.findMany({
    with: {
      customer: true
    },
    orderBy: [desc(salesInvoices.createdAt)],
    limit: 50
  });

  return (
    <div className="flex flex-col gap-6">
      <GradientHeader
        module="sales"
        title="Sales Invoices"
        description="Track revenue, invoices, and customer payments"
        icon={FileText}
      />
      
      <div className="flex items-center justify-end">
         <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
         </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No invoices found. Create your first one!
                  </TableCell>
                </TableRow>
            ) : (
                invoices.map((inv) => (
                    <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.customer.name}</TableCell>
                        <TableCell>{format(new Date(inv.invoiceDate), "dd MMM yyyy")}</TableCell>
                        <TableCell>{format(new Date(inv.dueDate), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                            <Badge variant={inv.status === "confirmed" || inv.status === "completed" ? "default" : inv.status === "draft" ? "secondary" : "outline"}>
                            {inv.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                            {Number(inv.balanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
