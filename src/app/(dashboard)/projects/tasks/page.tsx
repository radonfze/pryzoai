import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Clock, CheckCircle, Circle, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function ProjectsTasksPage() {
  // Mock tasks
  const tasks = [
    { id: 1, title: "Design database schema", project: "ERP System", status: "completed", priority: "high", assignee: "Ahmed", hours: 8 },
    { id: 2, title: "Implement login page", project: "ERP System", status: "in_progress", priority: "high", assignee: "Fatima", hours: 4 },
    { id: 3, title: "Create dashboard UI", project: "ERP System", status: "in_progress", priority: "medium", assignee: "Mohammed", hours: 6 },
    { id: 4, title: "Write API documentation", project: "ERP System", status: "pending", priority: "low", assignee: "Sarah", hours: 0 },
    { id: 5, title: "Setup CI/CD pipeline", project: "Infrastructure", status: "pending", priority: "medium", assignee: "Ahmed", hours: 0 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "medium": return <Badge variant="secondary">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">Manage project tasks and track progress</p>
        </div>
        <Link href="/projects/tasks/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Task</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(task.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.title}</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.project} • {task.assignee} • {task.hours}h logged
                  </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
