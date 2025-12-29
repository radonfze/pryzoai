import { db } from "@/db";
import { approvalRules } from "@/db/schema/approvals";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

export default async function ApprovalRulesPage() {
  const rules = await db.query.approvalRules.findMany({
    orderBy: [desc(approvalRules.createdAt)],
  });

  const columns = [
    {
      accessorKey: "name",
      header: "Rule Name",
    },
    {
      accessorKey: "documentType",
      header: "Document Type",
    },
    {
      accessorKey: "ruleType",
      header: "Rule Type",
    },
    {
      accessorKey: "minAmount",
      header: "Min Amount",
      cell: ({ row }: any) => row.original.minAmount || "-",
    },
    {
      accessorKey: "maxAmount",
      header: "Max Amount",
      cell: ({ row }: any) => row.original.maxAmount || "-",
    },
    {
      accessorKey: "priority",
      header: "Priority",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    createActionColumn({
      basePath: "/settings/approvals",
      hasEdit: true,
      hasDelete: true,
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="settings"
        title="Approval Rules"
        description="Configure approval workflows and policies"
        icon="ShieldCheck"
      >
        <Link href="/settings/approvals/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={rules}
        searchKey="name"
        exportName="approval_rules"
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';