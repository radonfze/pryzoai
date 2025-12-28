import { db } from "@/db";
import { technicianJobQueue } from "@/db/schema";
import { DataTable } from "@/components/ui/data-table";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCompanyId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export default async function TechnicianQueuePage() {
  const companyId = await getCompanyId();
  const jobs = await db.query.technicianJobQueue.findMany({
    where: eq(technicianJobQueue.companyId, companyId),
    with: { technician: true }
  });

  const columns = [
    { accessorKey: "technician.firstName", header: "Technician" },
    { accessorKey: "priority", header: "Priority" },
    { accessorKey: "mobileStatus", header: "Status" },
    { 
        accessorKey: "scheduledStart", 
        header: "Scheduled For",
        cell: ({ row }: any) => row.original.scheduledStart ? new Date(row.original.scheduledStart).toLocaleDateString() : "-"
    },
    { 
        accessorKey: "isDownloaded", 
        header: "Synced?",
        cell: ({ row }: any) => row.original.isDownloaded ? "✅ On Device" : "☁️ Cloud Only"
    },
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="projects"
        title="Technician Job Queue"
        description="Monitor field assignments and sync status"
        icon="HardHat"
      />

      <DataTable
        columns={columns}
        data={jobs}
        searchKey="technician.firstName"
        exportName="technician_queue"
      />
    </div>
  );
}
