import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { assertOwnedRecord, requireUserId } from "@/server/auth/ownership";

export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, requireUserId(userId)))
    .limit(1);

  return assertOwnedRecord(profile);
}

export async function updateUserProfile(
  userId: string,
  values: {
    displayName: string;
    timezone: string;
    currencyCode: string;
    dailyCapacityMinutes: number;
  },
) {
  const [profile] = await db
    .update(appUsers)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(appUsers.id, requireUserId(userId)))
    .returning();

  return assertOwnedRecord(profile);
}
