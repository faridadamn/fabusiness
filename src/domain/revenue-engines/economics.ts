export type RevenuePerHourResult = number | null;

export function calculateRevenuePerHour(
  revenue: number,
  hours: number,
): RevenuePerHourResult {
  if (!Number.isFinite(revenue) || revenue < 0) {
    throw new Error("Revenue must be a finite non-negative number.");
  }

  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error("Hours must be a finite non-negative number.");
  }

  if (hours === 0) {
    return null;
  }

  return revenue / hours;
}

export function calculateTargetProgress(
  actualRevenue: number,
  monthlyTarget: number,
): number | null {
  if (!Number.isFinite(actualRevenue) || actualRevenue < 0) {
    throw new Error("Actual revenue must be a finite non-negative number.");
  }

  if (!Number.isFinite(monthlyTarget) || monthlyTarget < 0) {
    throw new Error("Monthly target must be a finite non-negative number.");
  }

  if (monthlyTarget === 0) {
    return null;
  }

  return (actualRevenue / monthlyTarget) * 100;
}
