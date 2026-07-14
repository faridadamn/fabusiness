import { describe, expect, it } from "vitest";

import {
  ACTIVE_PROJECT_LIMITS,
  MIN_CAPACITY_OVERRIDE_REASON_LENGTH,
  assertActiveProjectCapacity,
  canActivateProject,
  getActiveProjectBucket,
  getRemainingActiveSlots,
  normalizeCapacityOverrideReason,
} from "./capacity";

describe("active project capacity", () => {
  it("uses three main slots and two experiment slots", () => {
    expect(ACTIVE_PROJECT_LIMITS).toEqual({ main: 3, experiment: 2 });
  });

  it("classifies experiment separately and all other types as main", () => {
    expect(getActiveProjectBucket("experiment")).toBe("experiment");
    expect(getActiveProjectBucket(" Experiment ")).toBe("experiment");
    expect(getActiveProjectBucket("product")).toBe("main");
    expect(getActiveProjectBucket("client")).toBe("main");
  });

  it("allows activation while a slot remains", () => {
    expect(canActivateProject("main", 2)).toBe(true);
    expect(canActivateProject("experiment", 1)).toBe(true);
  });

  it("blocks activation at the limit", () => {
    expect(canActivateProject("main", 3)).toBe(false);
    expect(canActivateProject("experiment", 2)).toBe(false);
    expect(() => assertActiveProjectCapacity("main", 3)).toThrow(
      "Active project limit reached",
    );
  });

  it("requires a meaningful override reason", () => {
    expect(MIN_CAPACITY_OVERRIDE_REASON_LENGTH).toBe(20);
    expect(() => normalizeCapacityOverrideReason("too short")).toThrow(
      "Override reason must contain at least 20 characters.",
    );
    expect(
      normalizeCapacityOverrideReason(
        "Urgent client commitment with signed delivery deadline.",
      ),
    ).toBe("Urgent client commitment with signed delivery deadline.");
  });

  it("never returns negative remaining slots", () => {
    expect(getRemainingActiveSlots("main", 1)).toBe(2);
    expect(getRemainingActiveSlots("main", 5)).toBe(0);
  });
});
