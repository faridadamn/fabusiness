import { describe, expect, it } from "vitest";

import {
  assertProjectTransition,
  canSoftDeleteProject,
  canTransitionProject,
  PROJECT_STATUSES,
} from "./lifecycle";

describe("project lifecycle", () => {
  it("defines every supported status", () => {
    expect(PROJECT_STATUSES).toEqual([
      "idea",
      "active",
      "paused",
      "completed",
      "cancelled",
      "archived",
    ]);
  });

  it("allows intended forward transitions", () => {
    expect(canTransitionProject("idea", "active")).toBe(true);
    expect(canTransitionProject("active", "paused")).toBe(true);
    expect(canTransitionProject("paused", "active")).toBe(true);
    expect(canTransitionProject("active", "completed")).toBe(true);
    expect(canTransitionProject("completed", "archived")).toBe(true);
  });

  it("rejects invalid reopening and terminal transitions", () => {
    expect(canTransitionProject("completed", "active")).toBe(false);
    expect(canTransitionProject("cancelled", "active")).toBe(false);
    expect(canTransitionProject("archived", "idea")).toBe(false);
    expect(() => assertProjectTransition("archived", "active")).toThrow(
      "Invalid project transition: archived -> active",
    );
  });

  it("only allows destructive soft delete for cancelled or archived projects", () => {
    expect(canSoftDeleteProject("idea")).toBe(false);
    expect(canSoftDeleteProject("active")).toBe(false);
    expect(canSoftDeleteProject("paused")).toBe(false);
    expect(canSoftDeleteProject("completed")).toBe(false);
    expect(canSoftDeleteProject("cancelled")).toBe(true);
    expect(canSoftDeleteProject("archived")).toBe(true);
  });
});
