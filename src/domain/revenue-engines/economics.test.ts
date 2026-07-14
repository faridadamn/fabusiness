import { describe, expect, it } from "vitest";

import {
  calculateRevenuePerHour,
  calculateTargetProgress,
} from "./economics";

describe("revenue engine economics", () => {
  it("calculates revenue per hour", () => {
    expect(calculateRevenuePerHour(1_000_000, 10)).toBe(100_000);
  });

  it("returns null when no hours are recorded", () => {
    expect(calculateRevenuePerHour(1_000_000, 0)).toBeNull();
  });

  it("calculates target progress as a percentage", () => {
    expect(calculateTargetProgress(5_000_000, 10_000_000)).toBe(50);
  });

  it("returns null when monthly target is zero", () => {
    expect(calculateTargetProgress(0, 0)).toBeNull();
  });

  it("rejects negative values", () => {
    expect(() => calculateRevenuePerHour(-1, 10)).toThrow();
    expect(() => calculateRevenuePerHour(1, -10)).toThrow();
    expect(() => calculateTargetProgress(-1, 10)).toThrow();
  });
});
