import GradientHeader from "@/components/ui/gradient-header";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

// Placeholder production schedule
const schedule = [
  { id: "1", product: "Widget A", quantity: 500, startDate: "2025-01-02", endDate: "2025-01-05", status: "scheduled" },
  { id: "2", product: "Widget B", quantity: 200, startDate: "2025-01-03", endDate: "2025-01-04", status: "scheduled" },
  { id: "3", product: "Component X", quantity: 1000, startDate: "2025-01-06", endDate: "2025-01-10", status: "planned" },
];

export default async function ProductionPlanningPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="manufacturing"
        title="Production Planning"
        description="Schedule and manage production runs"
        icon={Calendar}
      />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline">View Calendar</Button>
        <Button><Plus className="mr-2 h-4 w-4" /> Plan Production</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Delayed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Production</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-1">
                <p className="font-medium">{item.product}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} units • {item.startDate} to {item.endDate}
                </p>
              </div>
              <Badge variant={item.status === "scheduled" ? "default" : "secondary"}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
