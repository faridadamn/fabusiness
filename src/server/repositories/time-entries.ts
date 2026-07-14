import "server-only";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { projects, revenueEngines, tasks, timeEntries } from "@/db/schema";
import type { TimeActivityCategory } from "@/domain/time-tracking/categories";
import { assertOwnedRecord, ownedBy, requireUserId } from "@/server/auth/ownership";

export type ManualTimeEntryInput = {
  entryDate: string;
  durationMinutes: number;
  activityCategory: TimeActivityCategory;
  taskId?: string | null;
  projectId?: string | null;
  revenueEngineId?: string | null;
  isBillable: boolean;
  notes?: string | null;
};

async function assertOptionalOwnedLinks(userId: string, input: ManualTimeEntryInput) {
  if (input.taskId) {
    const [task] = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, input.taskId), ownedBy(tasks.userId, userId, tasks.deletedAt))).limit(1);
    assertOwnedRecord(task);
  }
  if (input.projectId) {
    const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, input.projectId), ownedBy(projects.userId, userId, projects.deletedAt))).limit(1);
    assertOwnedRecord(project);
  }
  if (input.revenueEngineId) {
    const [engine] = await db.select({ id: revenueEngines.id }).from(revenueEngines).where(and(eq(revenueEngines.id, input.revenueEngineId), ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt))).limit(1);
    assertOwnedRecord(engine);
  }
}

export async function createManualTimeEntryForUser(userId: string, input: ManualTimeEntryInput) {
  await assertOptionalOwnedLinks(userId, input);

  const [entry] = await db.insert(timeEntries).values({
    userId: requireUserId(userId),
    entryDate: input.entryDate,
    durationMinutes: input.durationMinutes,
    activityCategory: input.activityCategory,
    taskId: input.taskId || null,
    projectId: input.projectId || null,
    revenueEngineId: input.revenueEngineId || null,
    isBillable: input.isBillable,
    notes: input.notes || null,
  }).returning();

  if (input.taskId) {
    await db.update(tasks).set({
      actualMinutes: sql`${tasks.actualMinutes} + ${input.durationMinutes}`,
      updatedAt: new Date(),
    }).where(and(eq(tasks.id, input.taskId), ownedBy(tasks.userId, userId, tasks.deletedAt)));
  }

  if (input.projectId) {
    await db.update(projects).set({
      actualHours: sql`${projects.actualHours} + ${input.durationMinutes / 60}`,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(projects.id, input.projectId), ownedBy(projects.userId, userId, projects.deletedAt)));
  }

  return assertOwnedRecord(entry);
}

export async function listTimeEntryOptionsForUser(userId: string) {
  const [taskOptions, projectOptions, revenueEngineOptions] = await Promise.all([
    db.select({ id: tasks.id, name: tasks.name }).from(tasks).where(ownedBy(tasks.userId, userId, tasks.deletedAt)).orderBy(tasks.name),
    db.select({ id: projects.id, name: projects.name }).from(projects).where(ownedBy(projects.userId, userId, projects.deletedAt)).orderBy(projects.name),
    db.select({ id: revenueEngines.id, name: revenueEngines.name }).from(revenueEngines).where(ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt)).orderBy(revenueEngines.name),
  ]);

  return { taskOptions, projectOptions, revenueEngineOptions };
}

export async function listTimeEntriesForUser(userId: string, startDate: string, endDate: string) {
  return db.select().from(timeEntries).where(and(
    eq(timeEntries.userId, requireUserId(userId)),
    gte(timeEntries.entryDate, startDate),
    lte(timeEntries.entryDate, endDate),
  )).orderBy(desc(timeEntries.entryDate), desc(timeEntries.createdAt));
}

export async function getTimeSummaryForUser(userId: string, startDate: string, endDate: string) {
  const [summary] = await db.select({
    totalMinutes: sql<number>`coalesce(sum(${timeEntries.durationMinutes}), 0)`,
    billableMinutes: sql<number>`coalesce(sum(${timeEntries.durationMinutes}) filter (where ${timeEntries.isBillable} = true), 0)`,
    revenueMinutes: sql<number>`coalesce(sum(${timeEntries.durationMinutes}) filter (where ${timeEntries.activityCategory} in ('revenue_generating', 'client_delivery')), 0)`,
    entryCount: sql<number>`count(*)`,
  }).from(timeEntries).where(and(
    eq(timeEntries.userId, requireUserId(userId)),
    gte(timeEntries.entryDate, startDate),
    lte(timeEntries.entryDate, endDate),
  ));

  return summary ?? { totalMinutes: 0, billableMinutes: 0, revenueMinutes: 0, entryCount: 0 };
}
