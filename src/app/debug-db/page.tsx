import { db } from "@/db";
import { users, companies } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  try {
    // Get all users
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      companyId: users.companyId,
      isActive: users.isActive,
    }).from(users);

    // Get all companies
    const allCompanies = await db.select().from(companies);

    return (
      <div className="p-8 space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold">Database Diagnostic</h1>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Users ({allUsers.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Company ID</th>
                  <th className="border px-4 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.id} className={!user.companyId || user.companyId === '00000000-0000-0000-0000-000000000000' ? 'bg-red-50' : ''}>
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2">{user.name}</td>
                    <td className="border px-4 py-2 font-mono text-xs">
                      {user.companyId || <span className="text-red-600 font-bold">NULL</span>}
                      {user.companyId === '00000000-0000-0000-0000-000000000000' && (
                        <span className="ml-2 text-red-600 font-bold">(NULL UUID)</span>
                      )}
                    </td>
                    <td className="border px-4 py-2">{user.isActive ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Companies ({allCompanies.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Code</th>
                  <th className="border px-4 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {allCompanies.map((company: any) => (
                  <tr key={company.id}>
                    <td className="border px-4 py-2 font-mono text-xs">{company.id}</td>
                    <td className="border px-4 py-2">{company.name}</td>
                    <td className="border px-4 py-2">{company.code}</td>
                    <td className="border px-4 py-2">{company.isActive ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">⚠️ Issues Found:</h3>
          <ul className="list-disc list-inside text-yellow-700 mt-2">
            {allUsers.filter(u => !u.companyId || u.companyId === '00000000-0000-0000-0000-000000000000').length > 0 && (
              <li>
                {allUsers.filter(u => !u.companyId || u.companyId === '00000000-0000-0000-0000-000000000000').length} user(s) 
                have NULL or invalid company_id (highlighted in red)
              </li>
            )}
            {allCompanies.length === 0 && (
              <li>No companies found in database - need to create at least one company</li>
            )}
          </ul>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <pre className="bg-red-50 p-4 rounded mt-4 overflow-auto">{error.message}</pre>
        <pre className="bg-gray-100 p-4 rounded mt-2 text-xs overflow-auto">{error.stack}</pre>
      </div>
    );
  }
}
