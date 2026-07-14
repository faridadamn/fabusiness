import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projectScores, projects } from "@/db/schema";
import { scoreProject, type ProjectScoreInput } from "@/domain/projects/scoring";
import { assertOwnedRecord, ownedBy } from "@/server/auth/ownership";

export async function listProjectScoresForUser(userId: string, projectId: string) {
  await assertProjectOwnership(userId, projectId);
  return db.select().from(projectScores)
    .where(and(eq(projectScores.userId, userId), eq(projectScores.projectId, projectId)))
    .orderBy(desc(projectScores.createdAt));
}

async function assertProjectOwnership(userId: string, projectId: string) {
  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), ownedBy(projects.userId, userId, projects.deletedAt)))
    .limit(1);
  return assertOwnedRecord(project);
}

export async function createProjectScoreForUser(
  userId: string,
  projectId: string,
  input: ProjectScoreInput,
  overrideReason?: string | null,
) {
  await assertProjectOwnership(userId, projectId);
  const result = scoreProject(input);
  const [score] = await db.insert(projectScores).values({
    userId,
    projectId,
    ...input,
    totalScore: String(result.totalScore),
    recommendation: result.recommendation,
    overrideReason: overrideReason?.trim() || null,
  }).returning();
  return assertOwnedRecord(score);
}
