"use server";

import { revalidatePath } from "next/cache";

import { parseManualTimeEntry } from "@/features/time-tracking/schema";
import { requireSessionUser } from "@/server/auth/session";
import { createManualTimeEntryForUser } from "@/server/repositories/time-entries";

export async function createManualTimeEntryAction(formData: FormData) {
  const userId = await requireSessionUser();
  const input = parseManualTimeEntry(formData);
  await createManualTimeEntryForUser(userId, input);

  revalidatePath("/time");
  revalidatePath("/projects");
  revalidatePath("/revenue-engines");
}
