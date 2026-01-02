
import { getSubcategories } from "@/actions/inventory/subcategories";
import { getBrands } from "@/actions/inventory/brands";

export default async function DebugCatPage() {
  try {
    const subcats = await getSubcategories();
    const brands = await getBrands();
    
    // Test JSON serialization
    const jsonSub = JSON.stringify(subcats);
    const jsonBrands = JSON.stringify(brands);

    return (
      <div className="p-10 space-y-4">
        <h1 className="text-xl font-bold text-green-500">Serialization Successful</h1>
        <div>Subcategories Length: {subcats.length}</div>
        <div>Brands Length: {brands.length}</div>
        <pre className="bg-gray-100 p-2 max-h-40 overflow-auto">{jsonSub.substring(0, 500)}...</pre>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-xl font-bold text-red-500">Serialization Failed</h1>
        <pre className="text-red-600">{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}
