

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatItem {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  description?: string; // e.g. "+2.5% from last month"
  color?: string; // Optional custom color class for the icon/bg
}

interface StatsCardsProps {
  stats: StatItem[];
  className?: string;
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden border-l-4" style={{ borderLeftColor: stat.color ? `var(--${stat.color})` : undefined }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            {stat.icon && (
              <stat.icon className={cn("h-4 w-4 text-muted-foreground", stat.color)} />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
