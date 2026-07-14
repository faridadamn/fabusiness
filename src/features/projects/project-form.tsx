import type { ProjectFormValues } from "./schema";

export type RevenueEngineOption = {
  id: string;
  name: string;
  status: string;
};

export function ProjectForm({
  action,
  initialValues,
  revenueEngines = [],
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: Partial<ProjectFormValues>;
  revenueEngines?: RevenueEngineOption[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="form-grid">
      <label className="field field-span-2">
        <span>Project name</span>
        <input name="name" required minLength={3} maxLength={120} defaultValue={initialValues?.name ?? ""} />
      </label>

      <label className="field field-span-2">
        <span>Description</span>
        <textarea name="description" rows={4} maxLength={2000} defaultValue={initialValues?.description ?? ""} />
      </label>

      <label className="field">
        <span>Project type</span>
        <input name="projectType" required defaultValue={initialValues?.projectType ?? "business"} />
      </label>

      <label className="field">
        <span>Priority</span>
        <select name="priority" defaultValue={initialValues?.priority ?? "medium"}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>

      <label className="field field-span-2">
        <span>Revenue engine</span>
        <select name="revenueEngineId" defaultValue={initialValues?.revenueEngineId ?? ""}>
          <option value="">Unassigned</option>
          {revenueEngines.map((engine) => (
            <option key={engine.id} value={engine.id}>
              {engine.name} ({engine.status})
            </option>
          ))}
        </select>
        <small className="muted">Hubungkan project hanya bila ada jalur pendapatan yang jelas.</small>
      </label>

      <label className="field">
        <span>Start date</span>
        <input type="date" name="startDate" defaultValue={initialValues?.startDate ?? ""} />
      </label>

      <label className="field">
        <span>Target completion</span>
        <input type="date" name="targetCompletionDate" defaultValue={initialValues?.targetCompletionDate ?? ""} />
      </label>

      <label className="field">
        <span>Estimated hours</span>
        <input type="number" name="estimatedHours" min="0" step="0.5" defaultValue={initialValues?.estimatedHours ?? 0} />
      </label>

      <label className="field">
        <span>Revenue potential</span>
        <input type="number" name="revenuePotential" min="0" step="1000" defaultValue={initialValues?.revenuePotential ?? 0} />
      </label>

      <label className="field field-span-2">
        <span>Success criteria</span>
        <textarea name="successCriteria" rows={3} maxLength={2000} defaultValue={initialValues?.successCriteria ?? ""} />
      </label>

      <label className="field field-span-2">
        <span>Stop criteria</span>
        <textarea name="stopCriteria" rows={3} maxLength={2000} defaultValue={initialValues?.stopCriteria ?? ""} />
      </label>

      <div className="form-actions field-span-2">
        <button className="button button-primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
