import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GradientHeader } from "@/components/ui/gradient-header";
import { notFound } from "next/navigation";
import { EmployeeEditForm } from "./form"; // Will create file below

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, id)
    });

    if (!employee) notFound();

    return (
        <div className="space-y-6">
            <GradientHeader module="hr" title={`Edit: ${employee.firstName}`} description="Update profile and salary info" icon="UserCog" backUrl="/hr/employees" />
            <EmployeeEditForm initialData={employee} />
        </div>
    )
}
