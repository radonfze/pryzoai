"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ListTodo } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export default function NewTaskPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="projects"
        title="Create New Task"
        description="Assign a new task to a project member"
        icon={ListTodo}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
               <label className="text-sm font-medium">Task Title *</label>
               <Input placeholder="e.g. Design Database Schema" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium">Project *</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="erp">ERP System</SelectItem>
                            <SelectItem value="web">Website Redesign</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                   <label className="text-sm font-medium">Priority</label>
                   <Select>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
               <label className="text-sm font-medium">Description</label>
               <Textarea placeholder="Describe the task requirements..." rows={4} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium">Assignee</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Select Member" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ahmed">Ahmed Hassan</SelectItem>
                            <SelectItem value="fatima">Fatima Al-Rashid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input type="date" />
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button>Create Task</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
