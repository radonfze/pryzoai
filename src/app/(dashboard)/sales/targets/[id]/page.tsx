import GradientHeader from "@/components/ui/gradient-header";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// Mock data - replace with DB query when schema is ready
const mockTarget = {
  id: "1",
  name: "Q1 Revenue Target",
  targetType: "revenue",
  targetAmount: 500000,
  achievedAmount: 125000,
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  status: "in_progress",
  assignedTo: "Sales Team A",
  description: "First quarter revenue target for the year",
};

export default async function SalesTargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // TODO: Fetch from DB
  const target = mockTarget;
  const progress = (target.achievedAmount / target.targetAmount) * 100;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title={`Target: ${target.name}`}
        description={target.description}
        icon={Target}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/sales/targets`}>
          <Button variant="outline">Back to List</Button>
        </Link>
        <Button>Update Progress</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Target Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Target Name</span><span className="font-medium">{target.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{target.targetType}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{target.startDate} to {target.endDate}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{target.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="h-4" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{progress.toFixed(1)}% achieved</span>
                <span className="font-medium">{target.achievedAmount.toLocaleString()} / {target.targetAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Amount</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">{target.targetAmount.toLocaleString()} AED</div>
            <div className="text-sm text-muted-foreground mt-2">Target Amount</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
