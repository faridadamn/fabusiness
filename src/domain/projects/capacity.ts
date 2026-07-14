export const ACTIVE_PROJECT_LIMITS = {
  main: 3,
  experiment: 2,
} as const;

export const MIN_CAPACITY_OVERRIDE_REASON_LENGTH = 20;

export type ActiveProjectBucket = keyof typeof ACTIVE_PROJECT_LIMITS;

export function getActiveProjectBucket(projectType: string): ActiveProjectBucket {
  return projectType.trim().toLowerCase() === "experiment" ? "experiment" : "main";
}

export function canActivateProject(
  bucket: ActiveProjectBucket,
  currentActiveCount: number,
): boolean {
  return currentActiveCount < ACTIVE_PROJECT_LIMITS[bucket];
}

export function assertActiveProjectCapacity(
  bucket: ActiveProjectBucket,
  currentActiveCount: number,
): void {
  const limit = ACTIVE_PROJECT_LIMITS[bucket];

  if (!canActivateProject(bucket, currentActiveCount)) {
    throw new Error(
      `Active project limit reached for ${bucket}: ${currentActiveCount}/${limit}. Pause or complete another project first.`,
    );
  }
}

export function normalizeCapacityOverrideReason(reason: string | null | undefined): string {
  const normalized = reason?.trim() ?? "";

  if (normalized.length < MIN_CAPACITY_OVERRIDE_REASON_LENGTH) {
    throw new Error(
      `Override reason must contain at least ${MIN_CAPACITY_OVERRIDE_REASON_LENGTH} characters.`,
    );
  }

  return normalized;
}

export function getRemainingActiveSlots(
  bucket: ActiveProjectBucket,
  currentActiveCount: number,
): number {
  return Math.max(ACTIVE_PROJECT_LIMITS[bucket] - currentActiveCount, 0);
}
