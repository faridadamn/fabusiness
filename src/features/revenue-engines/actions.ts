"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { RevenueEngineStatus } from "@/domain/revenue-engines/lifecycle";
import { requireSessionUser } from "@/server/auth/session";
import {
  createRevenueEngineForUser,
  transitionRevenueEngineForUser,
  updateRevenueEngineForUser,
} from "@/server/repositories/revenue-engines";
import { parseRevenueEngineFormData } from "./schema";

function toRepositoryInput(formData: FormData) {
  const values = parseRevenueEngineFormData(formData);

  return {
    ...values,
    monthlyTarget: String(values.monthlyTarget),
    averageTicketSize: String(values.averageTicketSize),
  };
}

export async function createRevenueEngineAction(formData: FormData) {
  const userId = await requireSessionUser();
  const engine = await createRevenueEngineForUser(
    userId,
    toRepositoryInput(formData),
  );
  revalidatePath("/");
  revalidatePath("/revenue-engines");
  redirect(`/revenue-engines/${engine.id}/edit`);
}

export async function updateRevenueEngineAction(
  engineId: string,
  formData: FormData,
) {
  const userId = await requireSessionUser();
  await updateRevenueEngineForUser(userId, engineId, toRepositoryInput(formData));
  revalidatePath("/");
  revalidatePath("/revenue-engines");
  revalidatePath(`/revenue-engines/${engineId}/edit`);
}

export async function transitionRevenueEngineAction(
  engineId: string,
  formData: FormData,
) {
  const userId = await requireSessionUser();
  const nextStatus = String(formData.get("nextStatus")) as RevenueEngineStatus;
  await transitionRevenueEngineForUser(userId, engineId, nextStatus);
  revalidatePath("/");
  revalidatePath("/revenue-engines");
  revalidatePath(`/revenue-engines/${engineId}/edit`);
}
