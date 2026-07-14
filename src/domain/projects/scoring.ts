export const PROJECT_SCORE_FIELDS = [
  "revenuePotential",
  "speedToRevenue",
  "marketDemand",
  "skillFit",
  "easeOfValidation",
  "probabilityOfCompletion",
  "recurringIncomePotential",
  "strategicFit",
  "assetCreationPotential",
  "complexity",
  "riskScore",
] as const;

export type ProjectScoreField = (typeof PROJECT_SCORE_FIELDS)[number];
export type ProjectScoreInput = Record<ProjectScoreField, number>;
export type ProjectRecommendation = "prioritize" | "validate" | "defer" | "stop";

const WEIGHTS: Record<ProjectScoreField, number> = {
  revenuePotential: 1.4,
  speedToRevenue: 1.2,
  marketDemand: 1.3,
  skillFit: 1,
  easeOfValidation: 1,
  probabilityOfCompletion: 1.1,
  recurringIncomePotential: 1.1,
  strategicFit: 1,
  assetCreationPotential: 0.9,
  complexity: -0.9,
  riskScore: -0.8,
};

export function assertScoreRange(input: ProjectScoreInput): void {
  for (const field of PROJECT_SCORE_FIELDS) {
    const value = input[field];
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      throw new Error(`${field} must be an integer from 1 to 10.`);
    }
  }
}

export function calculateProjectScore(input: ProjectScoreInput): number {
  assertScoreRange(input);
  const positiveWeight = Object.values(WEIGHTS).filter((weight) => weight > 0).reduce((a, b) => a + b, 0);
  const penaltyWeight = Math.abs(Object.values(WEIGHTS).filter((weight) => weight < 0).reduce((a, b) => a + b, 0));
  const positive = PROJECT_SCORE_FIELDS.reduce((sum, field) => sum + input[field] * Math.max(WEIGHTS[field], 0), 0);
  const penalty = PROJECT_SCORE_FIELDS.reduce((sum, field) => sum + input[field] * Math.abs(Math.min(WEIGHTS[field], 0)), 0);
  const normalized = ((positive / positiveWeight) - (penalty / penaltyWeight) * 0.35) * 10;
  return Math.max(0, Math.min(100, Math.round(normalized * 100) / 100));
}

export function getProjectRecommendation(totalScore: number): ProjectRecommendation {
  if (totalScore >= 72) return "prioritize";
  if (totalScore >= 55) return "validate";
  if (totalScore >= 38) return "defer";
  return "stop";
}

export function scoreProject(input: ProjectScoreInput) {
  const totalScore = calculateProjectScore(input);
  return { totalScore, recommendation: getProjectRecommendation(totalScore) };
}
