import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  projectType: z.string().trim().min(2).max(60),
  priority: z.enum(["low", "medium", "high", "critical"]),
  startDate: z.string().optional(),
  targetCompletionDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).max(100000),
  revenuePotential: z.coerce.number().min(0).max(999999999999),
  successCriteria: z.string().trim().max(2000).optional(),
  stopCriteria: z.string().trim().max(2000).optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function parseProjectFormData(formData: FormData) {
  return projectFormSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    projectType: formData.get("projectType"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate") || undefined,
    targetCompletionDate: formData.get("targetCompletionDate") || undefined,
    estimatedHours: formData.get("estimatedHours"),
    revenuePotential: formData.get("revenuePotential"),
    successCriteria: formData.get("successCriteria") || undefined,
    stopCriteria: formData.get("stopCriteria") || undefined,
  });
}
