import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { projects, revenueTransactions } from "@/db/schema";
import { requireUserId } from "@/server/auth/ownership";
import { getRevenueEngineForUser } from "./revenue-engines";

export type RevenueTransactionInput = {
  transactionType: "income" | "expense";
  amount: string;
  occurredOn: string;
  description: string;
  projectId?: string | null;
};

export async function createRevenueTransactionForUser(
  userId: string,
  engineId: string,
  input: RevenueTransactionInput,
) {
  await getRevenueEngineForUser(userId, engineId);

  if (input.projectId) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.userId, userId),
          eq(projects.revenueEngineId, engineId),
          sql`${projects.deletedAt} is null`,
        ),
      )
      .limit(1);

    if (!project) {
      throw new Error("Project must belong to this revenue engine and user.");
    }
  }

  const [transaction] = await db
    .insert(revenueTransactions)
    .values({
      userId: requireUserId(userId),
      revenueEngineId: engineId,
      projectId: input.projectId || null,
      transactionType: input.transactionType,
      amount: input.amount,
      occurredOn: input.occurredOn,
      description: input.description,
      source: "manual",
    })
    .returning();

  return transaction;
}

export async function getRevenueLedgerForUser(userId: string, engineId: string) {
  await getRevenueEngineForUser(userId, engineId);

  const [summary] = await db
    .select({
      income: sql<string>`coalesce(sum(case when ${revenueTransactions.transactionType} = 'income' then ${revenueTransactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${revenueTransactions.transactionType} = 'expense' then ${revenueTransactions.amount} else 0 end), 0)`,
    })
    .from(revenueTransactions)
    .where(
      and(
        eq(revenueTransactions.userId, userId),
        eq(revenueTransactions.revenueEngineId, engineId),
        sql`${revenueTransactions.deletedAt} is null`,
      ),
    );

  const transactions = await db
    .select()
    .from(revenueTransactions)
    .where(
      and(
        eq(revenueTransactions.userId, userId),
        eq(revenueTransactions.revenueEngineId, engineId),
        sql`${revenueTransactions.deletedAt} is null`,
      ),
    )
    .orderBy(desc(revenueTransactions.occurredOn), desc(revenueTransactions.createdAt))
    .limit(20);

  const income = Number(summary?.income ?? 0);
  const expense = Number(summary?.expense ?? 0);

  return {
    summary: { income, expense, net: income - expense },
    transactions,
  };
}
