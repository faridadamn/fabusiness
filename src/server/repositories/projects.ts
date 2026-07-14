import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, projects, revenueEngines } from "@/db/schema";
import {
  ACTIVE_PROJECT_LIMITS,
  assertActiveProjectCapacity,
  canActivateProject,
  getActiveProjectBucket,
  getRemainingActiveSlots,
  normalizeCapacityOverrideReason,
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
  revenueEngineId?: string | null;
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

export type ProjectTransitionOptions = {
  overrideCapacity?: boolean;
  overrideReason?: string | null;
};

async function assertOwnedRevenueEngineAssignment(
  userId: string,
  revenueEngineId?: string | null,
) {
  if (!revenueEngineId) return null;

  const [engine] = await db
    .select({ id: revenueEngines.id })
    .from(revenueEngines)
    .where(
      and(
        eq(revenueEngines.id, revenueEngineId),
        ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt),
      ),
    )
    .limit(1);

  if (!engine) {
    throw new Error("Revenue engine was not found or is not accessible.");
  }

  return engine.id;
}

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
  const revenueEngineId = await assertOwnedRevenueEngineAssignment(
    userId,
    input.revenueEngineId,
  );

  const [project] = await db
    .insert(projects)
    .values({
      userId: requireUserId(userId),
      ...input,
      revenueEngineId,
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
  const revenueEngineId = await assertOwnedRevenueEngineAssignment(
    userId,
    input.revenueEngineId,
  );

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
      revenueEngineId,
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
  options: ProjectTransitionOptions = {},
) {
  const current = await getProjectForUser(userId, projectId);
  const currentStatus = current.status as ProjectStatus;

  assertProjectTransition(currentStatus, nextStatus);

  let capacityOverrideAudit:
    | {
        bucket: ActiveProjectBucket;
        activeCount: number;
        limit: number;
        reason: string;
      }
    | undefined;

  if (nextStatus === "active" && currentStatus !== "active") {
    const bucket = getActiveProjectBucket(current.projectType);
    const capacity = await getActiveProjectCapacityForUser(userId);
    const activeCount = capacity[bucket].active;

    if (!canActivateProject(bucket, activeCount)) {
      if (!options.overrideCapacity) {
        assertActiveProjectCapacity(bucket, activeCount);
      }

      capacityOverrideAudit = {
        bucket,
        activeCount,
        limit: ACTIVE_PROJECT_LIMITS[bucket],
        reason: normalizeCapacityOverrideReason(options.overrideReason),
      };
    }
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

  const updatedProject = assertOwnedRecord(project);

  if (capacityOverrideAudit) {
    await db.insert(auditLogs).values({
      userId: requireUserId(userId),
      action: "project.capacity_override",
      entityType: "project",
      entityId: projectId,
      oldValues: {
        status: currentStatus,
        activeCount: capacityOverrideAudit.activeCount,
        limit: capacityOverrideAudit.limit,
        bucket: capacityOverrideAudit.bucket,
      },
      newValues: {
        status: nextStatus,
        overrideReason: capacityOverrideAudit.reason,
      },
    });
  }

  return updatedProject;
}

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
