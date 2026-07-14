"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSessionUser } from "@/server/auth/session";
import {
  createRevenueTransactionForUser,
  softDeleteRevenueTransactionForUser,
  updateRevenueTransactionForUser,
} from "@/server/repositories/revenue-transactions";

const transactionSchema = z.object({
  transactionType: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive().max(999999999999),
  occurredOn: z.string().date(),
  description: z.string().trim().min(3).max(500),
  projectId: z.string().uuid().optional(),
});

function parseTransactionFormData(formData: FormData) {
  return transactionSchema.parse({
    transactionType: formData.get("transactionType"),
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
    description: formData.get("description"),
    projectId: formData.get("projectId") || undefined,
  });
}

function revalidateRevenueEngine(engineId: string) {
  revalidatePath("/revenue-engines");
  revalidatePath(`/revenue-engines/${engineId}/edit`);
}

export async function createRevenueTransactionAction(
  engineId: string,
  formData: FormData,
) {
  const userId = await requireSessionUser();
  const values = parseTransactionFormData(formData);

  await createRevenueTransactionForUser(userId, engineId, {
    ...values,
    amount: String(values.amount),
  });

  revalidateRevenueEngine(engineId);
}

export async function updateRevenueTransactionAction(
  engineId: string,
  transactionId: string,
  formData: FormData,
) {
  const userId = await requireSessionUser();
  const values = parseTransactionFormData(formData);

  await updateRevenueTransactionForUser(userId, engineId, transactionId, {
    ...values,
    amount: String(values.amount),
  });

  revalidateRevenueEngine(engineId);
}

export async function deleteRevenueTransactionAction(
  engineId: string,
  transactionId: string,
) {
  const userId = await requireSessionUser();
  await softDeleteRevenueTransactionForUser(userId, engineId, transactionId);
  revalidateRevenueEngine(engineId);
}
