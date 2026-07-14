import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, productValidations, products, revenueEngines } from "@/db/schema";
import {
  assertProductTransition,
  normalizeBuildOverrideReason,
  type ProductStatus,
} from "@/domain/products/lifecycle";
import { assertOwnedRecord, ownedBy, requireUserId } from "@/server/auth/ownership";

export type ProductInput = {
  name: string;
  description?: string | null;
  productType: string;
  price: string;
  targetCustomer?: string | null;
  problemStatement?: string | null;
  revenueEngineId?: string | null;
};

export type ProductValidationInput = {
  hypothesis: string;
  validationMethod: string;
  result: "positive" | "negative" | "inconclusive";
  evidenceUrl?: string | null;
  notes?: string | null;
  validatedOn: string;
};

async function assertOwnedRevenueEngine(userId: string, engineId?: string | null) {
  if (!engineId) return;
  const [engine] = await db.select({ id: revenueEngines.id }).from(revenueEngines).where(and(
    eq(revenueEngines.id, engineId),
    ownedBy(revenueEngines.userId, userId, revenueEngines.deletedAt),
  )).limit(1);
  if (!engine) throw new Error("Revenue engine does not belong to this user.");
}

export async function listProductsForUser(userId: string) {
  return db.select().from(products)
    .where(ownedBy(products.userId, userId, products.deletedAt))
    .orderBy(desc(products.updatedAt));
}

export async function getProductForUser(userId: string, productId: string) {
  const [product] = await db.select().from(products).where(and(
    eq(products.id, productId),
    ownedBy(products.userId, userId, products.deletedAt),
  )).limit(1);
  return assertOwnedRecord(product);
}

export async function listProductValidationsForUser(userId: string, productId: string) {
  await getProductForUser(userId, productId);
  return db.select().from(productValidations).where(and(
    eq(productValidations.userId, userId),
    eq(productValidations.productId, productId),
    sql`${productValidations}.deleted_at is null`,
  )).orderBy(desc(productValidations.validatedOn), desc(productValidations.createdAt));
}

export async function createProductForUser(userId: string, input: ProductInput) {
  await assertOwnedRevenueEngine(userId, input.revenueEngineId);
  const [product] = await db.insert(products).values({
    userId: requireUserId(userId),
    ...input,
    description: input.description || null,
    targetCustomer: input.targetCustomer || null,
    problemStatement: input.problemStatement || null,
    revenueEngineId: input.revenueEngineId || null,
    status: "idea",
  }).returning();
  return assertOwnedRecord(product);
}

export async function updateProductForUser(userId: string, productId: string, input: ProductInput) {
  await getProductForUser(userId, productId);
  await assertOwnedRevenueEngine(userId, input.revenueEngineId);
  const [product] = await db.update(products).set({
    ...input,
    description: input.description || null,
    targetCustomer: input.targetCustomer || null,
    problemStatement: input.problemStatement || null,
    revenueEngineId: input.revenueEngineId || null,
    updatedAt: new Date(),
  }).where(and(eq(products.id, productId), ownedBy(products.userId, userId, products.deletedAt))).returning();
  return assertOwnedRecord(product);
}

export async function createProductValidationForUser(userId: string, productId: string, input: ProductValidationInput) {
  await getProductForUser(userId, productId);
  const [validation] = await db.insert(productValidations).values({
    userId: requireUserId(userId),
    productId,
    ...input,
    evidenceUrl: input.evidenceUrl || null,
    notes: input.notes || null,
  }).returning();
  return validation;
}

export async function updateProductValidationForUser(
  userId: string,
  productId: string,
  validationId: string,
  input: ProductValidationInput,
) {
  await getProductForUser(userId, productId);
  const currentResult = await db.execute<{
    id: string;
    hypothesis: string;
    validation_method: string;
    result: string;
    evidence_url: string | null;
    notes: string | null;
    validated_on: string;
  }>(sql`select id, hypothesis, validation_method, result, evidence_url, notes, validated_on
      from product_validations
      where id = ${validationId} and product_id = ${productId} and user_id = ${userId} and deleted_at is null
      limit 1`);
  const current = currentResult.rows[0];
  if (!current) throw new Error("Validation record not found.");

  await db.execute(sql`update product_validations set
    hypothesis = ${input.hypothesis}, validation_method = ${input.validationMethod}, result = ${input.result},
    evidence_url = ${input.evidenceUrl || null}, notes = ${input.notes || null}, validated_on = ${input.validatedOn}, updated_at = now()
    where id = ${validationId} and product_id = ${productId} and user_id = ${userId} and deleted_at is null`);

  await db.insert(auditLogs).values({
    userId: requireUserId(userId), action: "product.validation_updated", entityType: "product_validation", entityId: validationId,
    oldValues: current,
    newValues: input,
  });
}

export async function softDeleteProductValidationForUser(userId: string, productId: string, validationId: string) {
  await getProductForUser(userId, productId);
  const currentResult = await db.execute<{ id: string; result: string; hypothesis: string }>(sql`
    update product_validations set deleted_at = now(), updated_at = now()
    where id = ${validationId} and product_id = ${productId} and user_id = ${userId} and deleted_at is null
    returning id, result, hypothesis`);
  const current = currentResult.rows[0];
  if (!current) throw new Error("Validation record not found.");

  await db.insert(auditLogs).values({
    userId: requireUserId(userId), action: "product.validation_deleted", entityType: "product_validation", entityId: validationId,
    oldValues: current,
    newValues: { deleted: true },
  });
}

export async function transitionProductForUser(
  userId: string,
  productId: string,
  nextStatus: ProductStatus,
  options: { overrideValidation?: boolean; overrideReason?: string | null } = {},
) {
  const current = await getProductForUser(userId, productId);
  const currentStatus = current.status as ProductStatus;
  let overrideReason: string | undefined;

  if (nextStatus === "building" && currentStatus !== "validated" && currentStatus !== "paused") {
    if (!options.overrideValidation) throw new Error("Product must be validated before building.");
    overrideReason = normalizeBuildOverrideReason(options.overrideReason);
  } else {
    assertProductTransition(currentStatus, nextStatus);
  }

  if (nextStatus === "validated") {
    const [positiveCount] = await db.select({ count: sql<number>`count(*)` }).from(productValidations).where(and(
      eq(productValidations.userId, userId), eq(productValidations.productId, productId), eq(productValidations.result, "positive"),
      sql`${productValidations}.deleted_at is null`,
    ));
    if (Number(positiveCount?.count ?? 0) === 0) throw new Error("At least one positive validation is required.");
  }

  const [product] = await db.update(products).set({
    status: nextStatus,
    launchedAt: nextStatus === "launched" ? new Date() : current.launchedAt,
    updatedAt: new Date(),
  }).where(and(eq(products.id, productId), ownedBy(products.userId, userId, products.deletedAt))).returning();

  if (overrideReason) {
    await db.insert(auditLogs).values({
      userId: requireUserId(userId), action: "product.validation_override", entityType: "product", entityId: productId,
      oldValues: { status: currentStatus }, newValues: { status: nextStatus, overrideReason },
    });
  }
  return assertOwnedRecord(product);
}
