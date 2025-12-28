import { db } from "@/db";
import { fixedAssets, assetDepreciationSchedule } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { notFound } from "next/navigation";
import { getCompanyId } from "@/lib/auth";

export default async function AssetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const companyId = await getCompanyId();

    const asset = await db.query.fixedAssets.findFirst({
        where: eq(fixedAssets.id, id),
        with: { category: true }
    });

    if (!asset || asset.companyId !== companyId) notFound();

    const schedules = await db.query.assetDepreciationSchedule.findMany({
        where: eq(assetDepreciationSchedule.assetId, id),
        orderBy: [asc(assetDepreciationSchedule.scheduleDate)]
    });

    const columns = [
        { accessorKey: "scheduleDate", header: "Date", cell: ({row}:any) => new Date(row.original.scheduleDate).toLocaleDateString() },
        { accessorKey: "openingBookValue", header: "Opening Value" },
        { accessorKey: "depreciationAmount", header: "Depreciation" },
        { accessorKey: "closingBookValue", header: "Closing Value" },
        { accessorKey: "status", header: "Status" }, // pending/posted
    ];

    return (
        <div className="space-y-6">
            <GradientHeader module="finance" title={asset.assetName} description={`Asset Code: ${asset.assetCode}`} icon="Building" backUrl="/finance/assets" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle>Asset Info</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between"><span>Category:</span> <span className="font-medium">{asset.category?.name}</span></div>
                        <div className="flex justify-between"><span>Purchase Date:</span> <span className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span>Purchase Cost:</span> <span className="font-medium">{asset.purchaseCost}</span></div>
                        <div className="flex justify-between"><span>Salvage Value:</span> <span className="font-medium">{asset.salvageValue}</span></div>
                        <div className="flex justify-between"><span>Useful Life:</span> <span className="font-medium">{asset.usefulLifeYears} Years</span></div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader><CardTitle>Depreciation Schedule</CardTitle><CardDescription>Projected value over time</CardDescription></CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={schedules} searchKey="status" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
