import { db } from "@/db";
import { items, stockLedger } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allItems = await db.query.items.findMany({
      where: eq(items.companyId, companyId),
      with: {
        category: true,
      },
      columns: {
        id: true,
        code: true,
        name: true,
        sellingPrice: true,
        uom: true,
        isActive: true,
      }
    });

    return Response.json({ success: true, data: allItems });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
