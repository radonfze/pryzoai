
import { getBoms } from "@/actions/inventory/bom";

export default async function DebugBomPage() {
  try {
    const boms = await getBoms();
    
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-xl font-bold text-green-500">BOM Query Successful</h1>
        <div>BOMs Length: {boms.length}</div>
        <pre className="bg-gray-100 p-2 max-h-96 overflow-auto">
            {JSON.stringify(boms, null, 2)}
        </pre>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-xl font-bold text-red-500">BOM Query Failed</h1>
        <pre className="text-red-600">{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}
