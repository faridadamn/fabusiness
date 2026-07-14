"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSessionUser } from "@/server/auth/session";
import { updateUserProfile } from "@/server/repositories/users";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(80),
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  dailyCapacityMinutes: z.coerce.number().int().min(30).max(1440),
});

export async function updateProfileAction(formData: FormData) {
  const userId = await requireSessionUser();
  const values = profileSchema.parse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
    currencyCode: formData.get("currencyCode"),
    dailyCapacityMinutes: formData.get("dailyCapacityMinutes"),
  });

  await updateUserProfile(userId, values);
  revalidatePath("/");
  revalidatePath("/settings/profile");
}
