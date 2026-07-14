import "server-only";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { projects, revenueTransactions } from "@/db/schema";
import { assertOwnedRecord, requireUserId } from "@/server/auth/ownership";
import { getRevenueEngineForUser } from "./revenue-engines";

export type RevenueTransactionInput = {
  transactionType: "income" | "expense";
  amount: string;
  occurredOn: string;
  description: string;
  projectId?: string | null;
};

export type RevenueLedgerFilter = {
  startDate?: string;
  endDate?: string;
};

async function assertProjectBelongsToEngine(
  userId: string,
  engineId: string,
  projectId?: string | null,
) {
  if (!projectId) return;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
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

export async function createRevenueTransactionForUser(
  userId: string,
  engineId: string,
  input: RevenueTransactionInput,
) {
  await getRevenueEngineForUser(userId, engineId);
  await assertProjectBelongsToEngine(userId, engineId, input.projectId);

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

  return assertOwnedRecord(transaction);
}

export async function updateRevenueTransactionForUser(
  userId: string,
  engineId: string,
  transactionId: string,
  input: RevenueTransactionInput,
) {
  await getRevenueEngineForUser(userId, engineId);
  await assertProjectBelongsToEngine(userId, engineId, input.projectId);

  const [transaction] = await db
    .update(revenueTransactions)
    .set({
      projectId: input.projectId || null,
      transactionType: input.transactionType,
      amount: input.amount,
      occurredOn: input.occurredOn,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(revenueTransactions.id, transactionId),
        eq(revenueTransactions.userId, userId),
        eq(revenueTransactions.revenueEngineId, engineId),
        sql`${revenueTransactions.deletedAt} is null`,
      ),
    )
    .returning();

  return assertOwnedRecord(transaction);
}

export async function softDeleteRevenueTransactionForUser(
  userId: string,
  engineId: string,
  transactionId: string,
) {
  await getRevenueEngineForUser(userId, engineId);

  const [transaction] = await db
    .update(revenueTransactions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(revenueTransactions.id, transactionId),
        eq(revenueTransactions.userId, userId),
        eq(revenueTransactions.revenueEngineId, engineId),
        sql`${revenueTransactions.deletedAt} is null`,
      ),
    )
    .returning();

  return assertOwnedRecord(transaction);
}

export async function getRevenueLedgerForUser(
  userId: string,
  engineId: string,
  filter: RevenueLedgerFilter = {},
) {
  await getRevenueEngineForUser(userId, engineId);

  const conditions = [
    eq(revenueTransactions.userId, userId),
    eq(revenueTransactions.revenueEngineId, engineId),
    sql`${revenueTransactions.deletedAt} is null`,
  ];

  if (filter.startDate) conditions.push(gte(revenueTransactions.occurredOn, filter.startDate));
  if (filter.endDate) conditions.push(lte(revenueTransactions.occurredOn, filter.endDate));

  const whereClause = and(...conditions);

  const [summary] = await db
    .select({
      income: sql<string>`coalesce(sum(case when ${revenueTransactions.transactionType} = 'income' then ${revenueTransactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${revenueTransactions.transactionType} = 'expense' then ${revenueTransactions.amount} else 0 end), 0)`,
    })
    .from(revenueTransactions)
    .where(whereClause);

  const transactions = await db
    .select()
    .from(revenueTransactions)
    .where(whereClause)
    .orderBy(desc(revenueTransactions.occurredOn), desc(revenueTransactions.createdAt))
    .limit(50);

  const income = Number(summary?.income ?? 0);
  const expense = Number(summary?.expense ?? 0);

  return {
    filter,
    summary: { income, expense, net: income - expense },
    transactions,
  };
}
