import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await db.query.chartOfAccounts.findMany({
      where: eq(chartOfAccounts.companyId, companyId),
      columns: {
        id: true,
        code: true,
        name: true,
        type: true,
        classification: true,
        balance: true,
      }
    });

    return Response.json({ success: true, data: accounts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
