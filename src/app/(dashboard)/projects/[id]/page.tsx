import { db } from "@/db";
import { projects, projectTasks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { notFound } from "next/navigation";
import { getCompanyId } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const companyId = await getCompanyId();

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: { customer: true, manager: true }
    });

    if (!project || project.companyId !== companyId) notFound();

    const tasks = await db.query.projectTasks.findMany({
        where: eq(projectTasks.projectId, id),
        with: { assignee: true },
        orderBy: [asc(projectTasks.startDate)]
    });

    return (
        <div className="space-y-6">
             <GradientHeader
                module="projects" 
                title={project.projectName} 
                description={`Code: ${project.projectCode} | Customer: ${project.customer?.name}`} 
                icon="Briefcase" 
                backUrl="/projects"
            />

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{project.budgetAmount}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Billed</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{project.billedAmount}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cost</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{project.actualCost}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Progress</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{project.completionPercent}%</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Project Tasks</CardTitle></CardHeader>
                <CardContent>
                    <DataTable 
                        columns={[
                            { accessorKey: "taskName", header: "Task" },
                            { accessorKey: "assignee.firstName", header: "Assigned To" },
                            { accessorKey: "startDate", header: "Start", cell: ({row}:any) => row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : "-" },
                            { accessorKey: "status", header: "Status" },
                        ]} 
                        data={tasks} 
                        searchKey="taskName" 
                    />
                </CardContent>
            </Card>
        </div>
    )
}
