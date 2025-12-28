"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createBranchAction(data: any) {
  try {
     const companyId = "00000000-0000-0000-0000-000000000000";
     
     await db.insert(branches).values({
        companyId,
        ...data
     });

     revalidatePath("/settings/branches");
     return { success: true };
  } catch (error: any) {
      console.error(error);
      return { success: false, message: error.message };
  }
}
