import { describe, expect, it } from "vitest";

import {
  assertRevenueEngineTransition,
  canTransitionRevenueEngine,
  REVENUE_ENGINE_STATUSES,
} from "./lifecycle";

describe("revenue engine lifecycle", () => {
  it("supports the approved statuses", () => {
    expect(REVENUE_ENGINE_STATUSES).toEqual([
      "idea",
      "validating",
      "active",
      "paused",
      "stopped",
    ]);
  });

  it("allows an idea to move into validation or activation", () => {
    expect(canTransitionRevenueEngine("idea", "validating")).toBe(true);
    expect(canTransitionRevenueEngine("idea", "active")).toBe(true);
  });

  it("allows paused engines to resume", () => {
    expect(canTransitionRevenueEngine("paused", "active")).toBe(true);
    expect(canTransitionRevenueEngine("paused", "validating")).toBe(true);
  });

  it("keeps stopped engines terminal", () => {
    expect(canTransitionRevenueEngine("stopped", "active")).toBe(false);
    expect(() => assertRevenueEngineTransition("stopped", "active")).toThrow(
      "Invalid revenue engine transition",
    );
  });
});
