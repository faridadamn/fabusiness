import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { revenueEngines } from "@/db/schema";
import {
  assertRevenueEngineTransition,
  type RevenueEngineStatus,
} from "@/domain/revenue-engines/lifecycle";
import { assertOwnedRecord, ownedBy, requireUserId } from "@/server/auth/ownership";

export type RevenueEngineInput = {
  name: string;
  description?: string | null;
  incomeType: string;
  monthlyTarget: string;
  isRecurring: boolean;
  averageTicketSize: string;
  targetCustomer?: string | null;
  startDate?: string | null;
  reviewDate?: string | null;
};

export async function listRevenueEnginesForUser(userId: string) {
  return db
    .select()
    .from(revenueEngines)
    .where(ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt))
    .orderBy(desc(revenueEngines.updatedAt));
}

export async function getRevenueEngineForUser(userId: string, engineId: string) {
  const [engine] = await db
    .select()
    .from(revenueEngines)
    .where(
      and(
        eq(revenueEngines.id, engineId),
        ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt),
      ),
    )
    .limit(1);

  return assertOwnedRecord(engine);
}

export async function createRevenueEngineForUser(
  userId: string,
  input: RevenueEngineInput,
) {
  const [engine] = await db
    .insert(revenueEngines)
    .values({
      userId: requireUserId(userId),
      ...input,
      status: "idea",
      description: input.description || null,
      targetCustomer: input.targetCustomer || null,
      startDate: input.startDate || null,
      reviewDate: input.reviewDate || null,
    })
    .returning();

  return assertOwnedRecord(engine);
}

export async function updateRevenueEngineForUser(
  userId: string,
  engineId: string,
  input: RevenueEngineInput,
) {
  const [engine] = await db
    .update(revenueEngines)
    .set({
      ...input,
      description: input.description || null,
      targetCustomer: input.targetCustomer || null,
      startDate: input.startDate || null,
      reviewDate: input.reviewDate || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(revenueEngines.id, engineId),
        ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt),
      ),
    )
    .returning();

  return assertOwnedRecord(engine);
}

export async function transitionRevenueEngineForUser(
  userId: string,
  engineId: string,
  nextStatus: RevenueEngineStatus,
) {
  const current = await getRevenueEngineForUser(userId, engineId);
  assertRevenueEngineTransition(
    current.status as RevenueEngineStatus,
    nextStatus,
  );

  const [engine] = await db
    .update(revenueEngines)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(
      and(
        eq(revenueEngines.id, engineId),
        ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt),
      ),
    )
    .returning();

  return assertOwnedRecord(engine);
}
