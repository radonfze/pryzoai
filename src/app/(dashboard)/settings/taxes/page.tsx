import { db } from "@/db";
import { taxes } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TaxesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let taxList: any[] = [];
  try {
    taxList = await db.query.taxes.findMany({
      where: eq(taxes.companyId, companyId),
      orderBy: (taxes, { asc }) => [asc(taxes.name)],
    });
  } catch {
    // Table might not exist yet
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tax Configuration</h2>
        <Link href="/settings/taxes/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Tax</Button>
        </Link>
      </div>

      <div className="rounded-md border p-4 mb-4 bg-muted/30">
        <h3 className="font-semibold mb-2">UAE VAT Information</h3>
        <p className="text-sm text-muted-foreground">
          Standard UAE VAT rate is 5%. Some goods and services are zero-rated or exempt.
          Ensure your TRN is correctly configured in Company Setup.
        </p>
      </div>

      {taxList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No tax configurations yet.</p>
          <p className="text-sm mt-2">Add the standard UAE VAT rate (5%) to get started.</p>
          <div className="mt-4 p-4 bg-muted rounded-md inline-block text-left">
            <p className="font-medium">Suggested Taxes:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• VAT 5% - Standard Rate</li>
              <li>• VAT 0% - Zero Rated</li>
              <li>• Exempt - VAT Exempt</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Rate (%)</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxList.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.name}</TableCell>
                  <TableCell>{tax.code}</TableCell>
                  <TableCell>{Number(tax.rate).toFixed(2)}%</TableCell>
                  <TableCell className="capitalize">{tax.type || "Standard"}</TableCell>
                  <TableCell>
                    <Badge variant={tax.isActive ? "default" : "secondary"}>
                      {tax.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
