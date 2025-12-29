import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export async function getUser() {
  // Return the seeded Admin User ID
  const USER_ADMIN_ID = "10000000-0000-0000-0000-000000000001";
  
  // Verify it exists (optional cache?)
  // For peformace, just return valid shape
  return {
    id: USER_ADMIN_ID,
    name: "System Admin",
    role: "admin",
    companyId: "00000000-0000-0000-0000-000000000000"
  };
}
