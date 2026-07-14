import { z } from "zod";

import { TIME_ACTIVITY_CATEGORIES } from "@/domain/time-tracking/categories";

export const manualTimeEntrySchema = z.object({
  entryDate: z.string().date(),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  activityCategory: z.enum(TIME_ACTIVITY_CATEGORIES),
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  revenueEngineId: z.string().uuid().optional(),
  isBillable: z.boolean(),
  notes: z.string().trim().max(2000).optional(),
});

export type ManualTimeEntryValues = z.infer<typeof manualTimeEntrySchema>;

export function parseManualTimeEntry(formData: FormData) {
  return manualTimeEntrySchema.parse({
    entryDate: formData.get("entryDate"),
    durationMinutes: formData.get("durationMinutes"),
    activityCategory: formData.get("activityCategory"),
    taskId: formData.get("taskId") || undefined,
    projectId: formData.get("projectId") || undefined,
    revenueEngineId: formData.get("revenueEngineId") || undefined,
    isBillable: formData.get("isBillable") === "on",
    notes: formData.get("notes") || undefined,
  });
}
