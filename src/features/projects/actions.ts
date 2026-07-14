"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionUser } from "@/server/auth/session";
import {
  createProjectForUser,
  transitionProjectForUser,
  updateProjectForUser,
  type ProjectStatus,
} from "@/server/repositories/projects";
import { parseProjectFormData } from "./schema";

function toRepositoryInput(formData: FormData) {
  const values = parseProjectFormData(formData);

  return {
    ...values,
    estimatedHours: String(values.estimatedHours),
    revenuePotential: String(values.revenuePotential),
  };
}

export async function createProjectAction(formData: FormData) {
  const userId = await requireSessionUser();
  const project = await createProjectForUser(userId, toRepositoryInput(formData));
  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}/edit`);
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const userId = await requireSessionUser();
  await updateProjectForUser(userId, projectId, toRepositoryInput(formData));
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}/edit`);
}

export async function transitionProjectAction(projectId: string, formData: FormData) {
  const userId = await requireSessionUser();
  const nextStatus = String(formData.get("nextStatus")) as ProjectStatus;
  const overrideCapacity = formData.get("overrideCapacity") === "true";
  const overrideReason = String(formData.get("overrideReason") ?? "");

  await transitionProjectForUser(userId, projectId, nextStatus, {
    overrideCapacity,
    overrideReason,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}/edit`);
}
