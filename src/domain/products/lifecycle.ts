export const PRODUCT_STATUSES = [
  "idea",
  "validating",
  "validated",
  "building",
  "launched",
  "paused",
  "retired",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  idea: ["validating", "retired"],
  validating: ["validated", "retired"],
  validated: ["building", "retired"],
  building: ["launched", "paused", "retired"],
  launched: ["paused", "retired"],
  paused: ["building", "retired"],
  retired: [],
};

export function canTransitionProduct(from: ProductStatus, to: ProductStatus) {
  return PRODUCT_TRANSITIONS[from].includes(to);
}

export function assertProductTransition(from: ProductStatus, to: ProductStatus) {
  if (!canTransitionProduct(from, to)) {
    throw new Error(`Invalid product transition: ${from} -> ${to}`);
  }
}

export function normalizeBuildOverrideReason(reason?: string | null) {
  const normalized = reason?.trim() ?? "";
  if (normalized.length < 20) {
    throw new Error("Build override reason must be at least 20 characters.");
  }
  return normalized;
}
