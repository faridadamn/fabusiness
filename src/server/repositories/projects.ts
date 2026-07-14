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

const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  idea: ["active", "cancelled", "archived"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export async function transitionProjectForUser(
  userId: string,
  projectId: string,
  nextStatus: ProjectStatus,
) {
  const current = await getProjectForUser(userId, projectId);
  const currentStatus = current.status as ProjectStatus;

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid project transition: ${currentStatus} -> ${nextStatus}`);
  }

  const [project] = await db
    .update(projects)
    .set({
      status: nextStatus,
      actualCompletionDate: nextStatus === "completed" ? new Date().toISOString().slice(0, 10) : current.actualCompletionDate,
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
