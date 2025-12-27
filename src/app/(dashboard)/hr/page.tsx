import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Banknote,
  Zap,
  UserPlus,
  Clock,
  Plus,
  Activity
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default function HRDashboardPage() {
  const stats = [
    {
      title: "Total Employees",
      value: "0",
      change: "Active",
      icon: Users,
      href: "/hr/employees",
      gradient: "from-purple-500 to-indigo-600",
    },
    {
      title: "Present Today",
      value: "0",
      change: "0%",
      icon: UserCheck,
      href: "/hr/attendance",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "On Leave",
      value: "0",
      change: "This week",
      icon: Calendar,
      href: "/hr/attendance",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title: "Payroll Due",
      value: "AED 0",
      change: "End of month",
      icon: Banknote,
      href: "/hr/payroll",
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  const quickActions = [
    { title: "Add Employee", href: "/hr/employees/new", icon: UserPlus, color: "bg-purple-500" },
    { title: "Mark Attendance", href: "/hr/attendance", icon: UserCheck, color: "bg-green-500" },
    { title: "Run Payroll", href: "/hr/payroll", icon: Banknote, color: "bg-cyan-500" },
    { title: "View Employees", href: "/hr/employees", icon: Users, color: "bg-amber-500" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">HR & Payroll</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">HR Dashboard</h1>
          <p className="text-white/80 text-lg">Manage employees, attendance, and payroll</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <Users className="h-32 w-32 text-white/20" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 hover:scale-105 transition-all duration-300 cursor-pointer`}>
              <div className="absolute -right-4 -top-4 opacity-20">
                <stat.icon className="h-24 w-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-white/90">{stat.title}</CardTitle>
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{stat.value}</div>
                <span className="text-sm text-white/80">{stat.change}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className={`${action.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Today&apos;s Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No attendance records</p>
              <Link href="/hr/attendance">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Mark Attendance
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              Upcoming Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No payroll scheduled</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
