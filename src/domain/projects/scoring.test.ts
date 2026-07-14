import { describe, expect, it } from "vitest";
import { calculateProjectScore, getProjectRecommendation, scoreProject } from "./scoring";

const strong = {
  revenuePotential: 9, speedToRevenue: 8, marketDemand: 9, skillFit: 8,
  easeOfValidation: 8, probabilityOfCompletion: 8, recurringIncomePotential: 8,
  strategicFit: 9, assetCreationPotential: 8, complexity: 3, riskScore: 3,
};

describe("project scoring", () => {
  it("returns a normalized score and recommendation", () => {
    const result = scoreProject(strong);
    expect(result.totalScore).toBeGreaterThanOrEqual(72);
    expect(result.recommendation).toBe("prioritize");
  });

  it("penalizes complexity and risk", () => {
    const risky = { ...strong, complexity: 10, riskScore: 10 };
    expect(calculateProjectScore(risky)).toBeLessThan(calculateProjectScore(strong));
  });

  it("rejects values outside one to ten", () => {
    expect(() => calculateProjectScore({ ...strong, marketDemand: 11 })).toThrow("marketDemand");
  });

  it("uses stable recommendation thresholds", () => {
    expect(getProjectRecommendation(72)).toBe("prioritize");
    expect(getProjectRecommendation(55)).toBe("validate");
    expect(getProjectRecommendation(38)).toBe("defer");
    expect(getProjectRecommendation(20)).toBe("stop");
  });
});
