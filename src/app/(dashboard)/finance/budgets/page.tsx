import GradientHeader from "@/components/ui/gradient-header";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// Placeholder budgets data
const budgets = [
  { id: "1", name: "Marketing Q1 2025", period: "Jan-Mar 2025", allocated: 50000, spent: 32000, status: "active" },
  { id: "2", name: "IT Infrastructure", period: "2025", allocated: 120000, spent: 45000, status: "active" },
  { id: "3", name: "HR Training", period: "2025", allocated: 25000, spent: 8000, status: "active" },
  { id: "4", name: "Office Supplies", period: "2025", allocated: 15000, spent: 12500, status: "warning" },
];

export default async function BudgetsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="finance"
        title="Budgets"
        description="Manage departmental and project budgets"
        icon={Wallet}
      />

      <div className="flex items-center justify-end">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percentUsed = (budget.spent / budget.allocated) * 100;
          const remaining = budget.allocated - budget.spent;
          
          return (
            <Card key={budget.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{budget.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{budget.period}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">{percentUsed.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        percentUsed > 90 ? 'bg-red-500' : 
                        percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Allocated</p>
                    <p className="font-medium">{budget.allocated.toLocaleString()} AED</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining.toLocaleString()} AED
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No budgets created yet. Click "Create Budget" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
