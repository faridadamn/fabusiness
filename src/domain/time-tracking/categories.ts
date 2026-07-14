export const TIME_ACTIVITY_CATEGORIES = [
  "revenue_generating",
  "marketing",
  "product_development",
  "client_delivery",
  "administration",
  "learning",
  "maintenance",
  "personal",
  "distraction",
] as const;

export type TimeActivityCategory = (typeof TIME_ACTIVITY_CATEGORIES)[number];

export const TIME_ACTIVITY_LABELS: Record<TimeActivityCategory, string> = {
  revenue_generating: "Revenue generating",
  marketing: "Marketing",
  product_development: "Product development",
  client_delivery: "Client delivery",
  administration: "Administration",
  learning: "Learning",
  maintenance: "Maintenance",
  personal: "Personal",
  distraction: "Distraction",
};

export function isRevenueGeneratingCategory(category: TimeActivityCategory) {
  return category === "revenue_generating" || category === "client_delivery";
}
