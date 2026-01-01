import { db } from "@/db";
import { brandCategories } from "@/db/schema/item-hierarchy";

export default async function DebugBrandCatPage() {
  try {
    const data = await db.select().from(brandCategories).limit(10);
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
  } catch (e: any) {
    return <div className="text-red-500">Error: {e.message} <br/> {e.stack}</div>;
  }
}
