import { db } from "@/db";
import { journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function JournalViewPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // 1. Fetch Journal with Lines
  const journal = await db.query.journalEntries.findFirst({
    where: eq(journalEntries.id, id),
    with: {
       lines: {
           with: {
               account: true
           }
       }
    }
  });

  if (!journal) {
    return notFound();
  }

  // 2. Identify Approver (Mock for now, will implement properly later)
  const isPending = journal.status === "pending_approval";

  return (
    <div className="flex flex-col gap-6 p-8">
       <div className="flex items-center justify-between">
           <div>
               <h1 className="text-3xl font-bold tracking-tight">{journal.journalNumber}</h1>
               <p className="text-muted-foreground">{journal.description}</p>
           </div>
           <div className="flex gap-2">
               <Badge variant={journal.status === 'posted' ? 'default' : 'secondary'} className="uppercase">
                   {journal.status}
               </Badge>
           </div>
       </div>

       <div className="grid grid-cols-3 gap-6">
           <Card className="col-span-2">
               <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
               <CardContent>
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead>Account</TableHead>
                               <TableHead>Description</TableHead>
                               <TableHead className="text-right">Debit</TableHead>
                               <TableHead className="text-right">Credit</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {journal.lines.map((line) => (
                               <TableRow key={line.id}>
                                   <TableCell>
                                       <span className="font-semibold block">{line.account?.code}</span>
                                       <span className="text-xs text-muted-foreground">{line.account?.name}</span>
                                   </TableCell>
                                   <TableCell>{line.description}</TableCell>
                                    <TableCell className="text-right font-mono">
                                       {Number(line.debitAmount) > 0 ? Number(line.debitAmount).toFixed(2) : '-'}
                                   </TableCell>
                                   <TableCell className="text-right font-mono">
                                       {Number(line.creditAmount) > 0 ? Number(line.creditAmount).toFixed(2) : '-'}
                                   </TableCell>
                               </TableRow>
                           ))}
                           {/* Totals Row */}
                           <TableRow className="bg-muted/50 font-bold">
                               <TableCell colSpan={2}>Total</TableCell>
                               <TableCell className="text-right">{Number(journal.totalDebit).toFixed(2)}</TableCell>
                               <TableCell className="text-right">{Number(journal.totalCredit).toFixed(2)}</TableCell>
                           </TableRow>
                       </TableBody>
                   </Table>
               </CardContent>
           </Card>

           <Card>
               <CardHeader><CardTitle>Details</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                   <div>
                       <div className="text-sm font-medium text-muted-foreground">Date</div>
                       <div>{format(new Date(journal.journalDate), "dd MMM yyyy")}</div>
                   </div>
                   <div>
                       <div className="text-sm font-medium text-muted-foreground">Source</div>
                       <div>{journal.sourceType?.toUpperCase()}</div>
                   </div>
                   <div>
                       <div className="text-sm font-medium text-muted-foreground">Reference</div>
                       <div>{journal.sourceDocNumber || "-"}</div>
                   </div>
                   
                    {/* Action Buttons */}
                   {journal.status === 'draft' && (
                       <div className="pt-4 space-y-2">
                           <Button className="w-full">Edit Journal</Button>
                           <Button variant="destructive" className="w-full">Delete</Button>
                       </div>
                   )}
               </CardContent>
           </Card>
       </div>
    </div>
  );
}
