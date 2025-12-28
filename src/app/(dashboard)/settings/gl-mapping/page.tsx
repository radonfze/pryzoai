import { db } from "@/db";
import { chartOfAccounts, defaultGlAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCompanyId } from "@/lib/auth";
import { GlMappingForm } from "./form";

export default async function GlMappingPage() {
    const companyId = await getCompanyId();

    const [accounts, mappings] = await Promise.all([
        db.query.chartOfAccounts.findMany({
            where: eq(chartOfAccounts.companyId, companyId),
            orderBy: (accounts, { asc }) => [asc(accounts.code)]
        }),
        db.query.defaultGlAccounts.findMany({
            where: eq(defaultGlAccounts.companyId, companyId)
        })
    ]);

    return (
        <div className="space-y-6">
            <GradientHeader module="settings" title="Default GL Accounts" description="Map system actions to General Ledger accounts" icon="Landmark" backUrl="/settings" />
            <GlMappingForm accounts={accounts} initialMappings={mappings} />
        </div>
    )
}
