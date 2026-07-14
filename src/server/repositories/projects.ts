import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { assertOwnedRecord, ownedBy } from "@/server/auth/ownership";

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
