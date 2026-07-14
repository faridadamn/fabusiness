import { z } from "zod";

export const revenueEngineSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  incomeType: z.string().trim().min(2).max(80),
  monthlyTarget: z.coerce.number().min(0).max(1_000_000_000_000),
  isRecurring: z.boolean(),
  averageTicketSize: z.coerce.number().min(0).max(1_000_000_000_000),
  targetCustomer: z.string().trim().max(240).optional(),
  startDate: z.string().optional(),
  reviewDate: z.string().optional(),
});

export function parseRevenueEngineFormData(formData: FormData) {
  return revenueEngineSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    incomeType: formData.get("incomeType"),
    monthlyTarget: formData.get("monthlyTarget"),
    isRecurring: formData.get("isRecurring") === "on",
    averageTicketSize: formData.get("averageTicketSize"),
    targetCustomer: formData.get("targetCustomer") || undefined,
    startDate: formData.get("startDate") || undefined,
    reviewDate: formData.get("reviewDate") || undefined,
  });
}
