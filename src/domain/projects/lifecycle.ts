export const PROJECT_STATUSES = [
  "idea",
  "active",
  "paused",
  "completed",
  "cancelled",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  idea: ["active", "cancelled", "archived"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export function canTransitionProject(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): boolean {
  return PROJECT_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertProjectTransition(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): void {
  if (!canTransitionProject(currentStatus, nextStatus)) {
    throw new Error(`Invalid project transition: ${currentStatus} -> ${nextStatus}`);
  }
}

export function canSoftDeleteProject(status: ProjectStatus): boolean {
  return status === "cancelled" || status === "archived";
}
