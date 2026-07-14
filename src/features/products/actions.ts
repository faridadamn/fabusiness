"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PRODUCT_STATUSES, type ProductStatus } from "@/domain/products/lifecycle";
import { requireSessionUser } from "@/server/auth/session";
import {
  createProductForUser,
  createProductValidationForUser,
  transitionProductForUser,
  updateProductForUser,
} from "@/server/repositories/products";

const productSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  productType: z.string().trim().min(2).max(60),
  price: z.coerce.number().min(0).max(999999999999),
  targetCustomer: z.string().trim().max(500).optional(),
  problemStatement: z.string().trim().max(1000).optional(),
  revenueEngineId: z.string().uuid().optional(),
});

const validationSchema = z.object({
  hypothesis: z.string().trim().min(5).max(1000),
  validationMethod: z.string().trim().min(3).max(500),
  result: z.enum(["positive", "negative", "inconclusive"]),
  evidenceUrl: z.string().url().optional(),
  notes: z.string().trim().max(2000).optional(),
  validatedOn: z.string().date(),
});

function parseProduct(formData: FormData) {
  const values = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    productType: formData.get("productType"),
    price: formData.get("price"),
    targetCustomer: formData.get("targetCustomer") || undefined,
    problemStatement: formData.get("problemStatement") || undefined,
    revenueEngineId: formData.get("revenueEngineId") || undefined,
  });
  return { ...values, price: String(values.price) };
}

export async function createProductAction(formData: FormData) {
  const userId = await requireSessionUser();
  const product = await createProductForUser(userId, parseProduct(formData));
  revalidatePath("/products");
  redirect(`/products/${product.id}/edit`);
}

export async function updateProductAction(productId: string, formData: FormData) {
  const userId = await requireSessionUser();
  await updateProductForUser(userId, productId, parseProduct(formData));
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}

export async function createProductValidationAction(productId: string, formData: FormData) {
  const userId = await requireSessionUser();
  const values = validationSchema.parse({
    hypothesis: formData.get("hypothesis"),
    validationMethod: formData.get("validationMethod"),
    result: formData.get("result"),
    evidenceUrl: formData.get("evidenceUrl") || undefined,
    notes: formData.get("notes") || undefined,
    validatedOn: formData.get("validatedOn"),
  });
  await createProductValidationForUser(userId, productId, values);
  revalidatePath(`/products/${productId}/edit`);
}

export async function transitionProductAction(productId: string, formData: FormData) {
  const userId = await requireSessionUser();
  const nextStatus = z.enum(PRODUCT_STATUSES).parse(formData.get("nextStatus")) as ProductStatus;
  await transitionProductForUser(userId, productId, nextStatus, {
    overrideValidation: formData.get("overrideValidation") === "true",
    overrideReason: String(formData.get("overrideReason") || ""),
  });
  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
}
