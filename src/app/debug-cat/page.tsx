import { getCategories } from "@/actions/inventory/categories";

export default async function DebugCatPage() {
  try {
    const cats = await getCategories();
    return <pre>{JSON.stringify(cats, null, 2)}</pre>;
  } catch (e: any) {
    return <div className="text-red-500">Error: {e.message} <br/> {e.stack}</div>;
  }
}
