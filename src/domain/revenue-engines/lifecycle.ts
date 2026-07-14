export const REVENUE_ENGINE_STATUSES = [
  "idea",
  "validating",
  "active",
  "paused",
  "stopped",
] as const;

export type RevenueEngineStatus = (typeof REVENUE_ENGINE_STATUSES)[number];

export const REVENUE_ENGINE_TRANSITIONS: Record<
  RevenueEngineStatus,
  readonly RevenueEngineStatus[]
> = {
  idea: ["validating", "active", "stopped"],
  validating: ["active", "paused", "stopped"],
  active: ["paused", "stopped"],
  paused: ["validating", "active", "stopped"],
  stopped: [],
};

export function canTransitionRevenueEngine(
  currentStatus: RevenueEngineStatus,
  nextStatus: RevenueEngineStatus,
): boolean {
  return REVENUE_ENGINE_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertRevenueEngineTransition(
  currentStatus: RevenueEngineStatus,
  nextStatus: RevenueEngineStatus,
): void {
  if (!canTransitionRevenueEngine(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid revenue engine transition: ${currentStatus} -> ${nextStatus}`,
    );
  }
}
