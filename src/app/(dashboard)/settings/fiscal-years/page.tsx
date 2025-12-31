import { getFiscalPeriods } from "@/actions/settings/fiscal-year-actions";
import { CreateYearButton, ToggleStatusButton } from "@/components/settings/fiscal-year-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import GradientHeader from "@/components/ui/gradient-header";
import { CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { db } from "@/db"; // Ensure DB import for verification if needed, but action does it

export const dynamic = 'force-dynamic';

export default async function FiscalYearsPage() {
  const periods = await getFiscalPeriods();

  // Group by Year
  const years = Array.from(new Set(periods.map(p => p.fiscalYear))).sort((a,b) => b-a);

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div className="flex justify-between items-center">
        <GradientHeader
            module="settings"
            title="Fiscal Years"
            description="Manage financial periods and locking status."
            icon={CalendarRange}
        />
        <CreateYearButton />
      </div>

      <div className="space-y-6">
        {years.length === 0 && (
             <div className="text-center py-12 text-muted-foreground border rounded-lg bg-white">
                No fiscal years defined. Click "Add Fiscal Year" to start.
             </div>
        )}

        {years.map(year => (
            <Card key={year}>
                <CardHeader className="py-4 bg-muted/20">
                    <CardTitle className="text-lg">Fiscal Year {year}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px] text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.filter(p => p.fiscalYear === year).sort((a,b) => a.periodNumber - b.periodNumber).map(period => (
                                <TableRow key={period.id}>
                                    <TableCell className="font-medium">{period.periodName}</TableCell>
                                    <TableCell>{format(new Date(period.startDate), "dd MMM yyyy")}</TableCell>
                                    <TableCell>{format(new Date(period.endDate), "dd MMM yyyy")}</TableCell>
                                    <TableCell>
                                        <Badge variant={period.status === 'open' ? 'success' : 'destructive'} className="uppercase">
                                            {period.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ToggleStatusButton id={period.id} status={period.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
