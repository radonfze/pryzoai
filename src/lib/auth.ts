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
    where: eq(companies.isActive, true),
  });
  
  if (!company) {
    // Return a fallback demo ID to allow build to succeed
    return "00000000-0000-0000-0000-000000000000";
  }
  
  return company.id;
}
