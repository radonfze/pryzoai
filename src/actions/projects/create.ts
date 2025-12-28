"use server";

import { createUnifiedProject as engineCreate } from "@/lib/services/project-engine";
import { revalidatePath } from "next/cache";

export async function createProjectAction(data: any) {
    const res = await engineCreate({
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
    
    if (res.success) {
        revalidatePath("/projects");
    }
    return res;
}
