import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { assertOwnedRecord, ownedBy, requireUserId } from "@/server/auth/ownership";

export type ProjectInput = {
  name: string;
  description?: string | null;
  projectType: string;
  priority: string;
  startDate?: string | null;
  targetCompletionDate?: string | null;
  estimatedHours: string;
  revenuePotential: string;
  successCriteria?: string | null;
  stopCriteria?: string | null;
};

export const PROJECT_STATUSES = [
  "idea",
  "active",
  "paused",
  "completed",
  "cancelled",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  idea: ["active", "cancelled", "archived"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export function canTransitionProject(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): boolean {
  return PROJECT_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertProjectTransition(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): void {
  if (!canTransitionProject(currentStatus, nextStatus)) {
    throw new Error(`Invalid project transition: ${currentStatus} -> ${nextStatus}`);
  }
}

export function canSoftDeleteProject(status: ProjectStatus): boolean {
  return status === "cancelled" || status === "archived";
}

export async function listProjectsForUser(userId: string) {
  return db
    .select()
    .from(projects)
    .where(ownedBy(projects.userId, userId, projects.deletedAt))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectForUser(userId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        ownedBy(projects.userId, userId, projects.deletedAt),
      ),
    )
    .limit(1);

  return assertOwnedRecord(project);
}

export async function createProjectForUser(userId: string, input: ProjectInput) {
  const [project] = await db
    .insert(projects)
    .values({
      userId: requireUserId(userId),
      ...input,
      status: "idea",
      description: input.description || null,
      startDate: input.startDate || null,
      targetCompletionDate: input.targetCompletionDate || null,
      successCriteria: input.successCriteria || null,
      stopCriteria: input.stopCriteria || null,
    })
    .returning();

  return assertOwnedRecord(project);
}

export async function updateProjectForUser(
  userId: string,
  projectId: string,
  input: ProjectInput,
) {
  const [project] = await db
    .update(projects)
    .set({
      ...input,
      description: input.description || null,
      startDate: input.startDate || null,
      targetCompletionDate: input.targetCompletionDate || null,
      successCriteria: input.successCriteria || null,
      stopCriteria: input.stopCriteria || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projects.id, projectId),
        ownedBy(projects.userId, userId, projects.deletedAt),
      ),
    )
    .returning();

  return assertOwnedRecord(project);
}

export async function transitionProjectForUser(
  userId: string,
  projectId: string,
  nextStatus: ProjectStatus,
) {
  const current = await getProjectForUser(userId, projectId);
  const currentStatus = current.status as ProjectStatus;

  assertProjectTransition(currentStatus, nextStatus);

  const [project] = await db
    .update(projects)
    .set({
      status: nextStatus,
      actualCompletionDate:
        nextStatus === "completed"
          ? new Date().toISOString().slice(0, 10)
          : current.actualCompletionDate,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projects.id, projectId),
        ownedBy(projects.userId, userId, projects.deletedAt),
      ),
    )
    .returning();

  return assertOwnedRecord(project);
}

/**
 * Archive keeps a project visible for historical reporting.
 * Soft delete is a separate, destructive operation and is only allowed after
 * cancellation or archival. Normal reads always exclude soft-deleted records.
 */
export async function softDeleteProjectForUser(userId: string, projectId: string) {
  const current = await getProjectForUser(userId, projectId);
  const status = current.status as ProjectStatus;

  if (!canSoftDeleteProject(status)) {
    throw new Error("Only cancelled or archived projects can be deleted.");
  }

  const [project] = await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(projects.id, projectId),
        ownedBy(projects.userId, userId, projects.deletedAt),
      ),
    )
    .returning();

  return assertOwnedRecord(project);
}
