import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current company ID from the session or context
 * For Phase 3/4, this might default to the first active company
 */
export async function getCompanyId(): Promise<string> {
  // TODO: Implement actual session retrieval
  // e.g. const session = await auth(); return session.companyId;
  
  // Fallback: Get first active company
  const company = await db.query.companies.findFirst({
    where: eq(companies.active, true),
  });
  
  if (!company) {
    throw new Error("No active company found");
  }
  
  return company.id;
}
