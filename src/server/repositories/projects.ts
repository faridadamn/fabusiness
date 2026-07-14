import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import {
  ACTIVE_PROJECT_LIMITS,
  assertActiveProjectCapacity,
  getActiveProjectBucket,
  getRemainingActiveSlots,
  type ActiveProjectBucket,
} from "@/domain/projects/capacity";
import {
  assertProjectTransition,
  canSoftDeleteProject,
  type ProjectStatus,
} from "@/domain/projects/lifecycle";
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

export type ActiveProjectCapacity = Record<
  ActiveProjectBucket,
  { active: number; limit: number; remaining: number }
>;

export async function listProjectsForUser(userId: string) {
  return db
    .select()
    .from(projects)
    .where(ownedBy(projects.userId, userId, projects.deletedAt))
    .orderBy(desc(projects.updatedAt));
}

export async function getActiveProjectCapacityForUser(
  userId: string,
): Promise<ActiveProjectCapacity> {
  const activeProjects = await db
    .select({ projectType: projects.projectType })
    .from(projects)
    .where(
      and(
        ownedBy(projects.userId, userId, projects.deletedAt),
        eq(projects.status, "active"),
      ),
    );

  const counts: Record<ActiveProjectBucket, number> = {
    main: 0,
    experiment: 0,
  };

  for (const project of activeProjects) {
    counts[getActiveProjectBucket(project.projectType)] += 1;
  }

  return {
    main: {
      active: counts.main,
      limit: ACTIVE_PROJECT_LIMITS.main,
      remaining: getRemainingActiveSlots("main", counts.main),
    },
    experiment: {
      active: counts.experiment,
      limit: ACTIVE_PROJECT_LIMITS.experiment,
      remaining: getRemainingActiveSlots("experiment", counts.experiment),
    },
  };
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
  const current = await getProjectForUser(userId, projectId);

  if (current.status === "active") {
    const currentBucket = getActiveProjectBucket(current.projectType);
    const nextBucket = getActiveProjectBucket(input.projectType);

    if (currentBucket !== nextBucket) {
      const capacity = await getActiveProjectCapacityForUser(userId);
      assertActiveProjectCapacity(nextBucket, capacity[nextBucket].active);
    }
  }

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

  if (nextStatus === "active" && currentStatus !== "active") {
    const bucket = getActiveProjectBucket(current.projectType);
    const capacity = await getActiveProjectCapacityForUser(userId);
    assertActiveProjectCapacity(bucket, capacity[bucket].active);
  }

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
