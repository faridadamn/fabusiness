"use server";

import { revalidatePath } from "next/cache";

import { PROJECT_SCORE_FIELDS, type ProjectScoreInput } from "@/domain/projects/scoring";
import { requireSessionUser } from "@/server/auth/session";
import { createProjectScoreForUser } from "@/server/repositories/project-scores";

export async function createProjectScoreAction(projectId: string, formData: FormData) {
  const userId = await requireSessionUser();
  const input = Object.fromEntries(
    PROJECT_SCORE_FIELDS.map((field) => [field, Number(formData.get(field))]),
  ) as ProjectScoreInput;

  await createProjectScoreForUser(
    userId,
    projectId,
    input,
    String(formData.get("overrideReason") ?? ""),
  );

  revalidatePath(`/projects/${projectId}/edit`);
  revalidatePath("/projects");
}
