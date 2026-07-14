import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { projects, revenueEngines } from "@/db/schema";
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

export async function listRevenueEngineOptionsForUser(userId: string) {
  return db
    .select({
      id: revenueEngines.id,
      name: revenueEngines.name,
      status: revenueEngines.status,
    })
    .from(revenueEngines)
    .where(ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt))
    .orderBy(revenueEngines.name);
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

export async function getRevenueEngineProjectSummaryForUser(
  userId: string,
  engineId: string,
) {
  await getRevenueEngineForUser(userId, engineId);

  const [summary] = await db
    .select({
      linkedProjects: count(projects.id),
      activeProjects: sql<number>`count(*) filter (where ${projects.status} = 'active')`,
      revenuePotential: sql<string>`coalesce(sum(${projects.revenuePotential}), 0)`,
      actualRevenue: sql<string>`coalesce(sum(${projects.actualRevenue}), 0)`,
      estimatedHours: sql<string>`coalesce(sum(${projects.estimatedHours}), 0)`,
      actualHours: sql<string>`coalesce(sum(${projects.actualHours}), 0)`,
    })
    .from(projects)
    .where(
      and(
        eq(projects.revenueEngineId, engineId),
        ownedBy(projects.userId, userId, projects.deletedAt),
      ),
    );

  const linkedProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      revenuePotential: projects.revenuePotential,
      actualRevenue: projects.actualRevenue,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
    })
    .from(projects)
    .where(
      and(
        eq(projects.revenueEngineId, engineId),
        ownedBy(projects.userId, userId, projects.deletedAt),
      ),
    )
    .orderBy(desc(projects.updatedAt));

  return {
    summary: summary ?? {
      linkedProjects: 0,
      activeProjects: 0,
      revenuePotential: "0",
      actualRevenue: "0",
      estimatedHours: "0",
      actualHours: "0",
    },
    projects: linkedProjects,
  };
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
