import { db } from "@/db";
import { copilotPolicies } from "@/db/schema";
import { DataTable } from "@/components/ui/data-table";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCompanyId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export default async function AiPoliciesPage() {
  const companyId = await getCompanyId();
  const policies = await db.query.copilotPolicies.findMany({
    where: eq(copilotPolicies.companyId, companyId),
  });

  const columns = [
    { accessorKey: "policyName", header: "Policy Name" },
    { accessorKey: "module", header: "Module Scope" },
    { accessorKey: "action", header: "Action Restricted" },
    { 
        accessorKey: "requiresApproval", 
        header: "Constraint",
        cell: ({ row }: any) => row.original.requiresApproval ? "Requires Approval" : "Allowed"
    },
    { accessorKey: "approvalThreshold", header: "Threshold ($)" },
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="settings"
        title="AI Safe Mode Policies"
        description="Configure governance for Copilot actions"
        icon="ShieldAlert"
      />

      <DataTable
        columns={columns}
        data={policies}
        searchKey="policyName"
        exportName="ai_policies"
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';