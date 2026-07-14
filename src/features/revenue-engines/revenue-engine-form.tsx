type RevenueEngineFormValues = {
  name?: string;
  description?: string;
  incomeType?: string;
  monthlyTarget?: number;
  isRecurring?: boolean;
  averageTicketSize?: number;
  targetCustomer?: string;
  startDate?: string;
  reviewDate?: string;
};

export function RevenueEngineForm({
  action,
  submitLabel,
  initialValues = {},
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: RevenueEngineFormValues;
}) {
  return (
    <form action={action} className="form-grid">
      <label className="field field-span-2">
        Nama revenue engine
        <input name="name" required minLength={2} defaultValue={initialValues.name} />
      </label>

      <label className="field field-span-2">
        Deskripsi
        <textarea name="description" rows={4} defaultValue={initialValues.description} />
      </label>

      <label className="field">
        Income type
        <select name="incomeType" required defaultValue={initialValues.incomeType ?? "service"}>
          <option value="service">Service</option>
          <option value="product">Digital product</option>
          <option value="affiliate">Affiliate</option>
          <option value="subscription">Subscription</option>
          <option value="content">Content monetization</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="field">
        Target customer
        <input name="targetCustomer" defaultValue={initialValues.targetCustomer} />
      </label>

      <label className="field">
        Monthly target (IDR)
        <input type="number" min="0" step="1000" name="monthlyTarget" required defaultValue={initialValues.monthlyTarget ?? 0} />
      </label>

      <label className="field">
        Average ticket size (IDR)
        <input type="number" min="0" step="1000" name="averageTicketSize" required defaultValue={initialValues.averageTicketSize ?? 0} />
      </label>

      <label className="field">
        Start date
        <input type="date" name="startDate" defaultValue={initialValues.startDate} />
      </label>

      <label className="field">
        Review date
        <input type="date" name="reviewDate" defaultValue={initialValues.reviewDate} />
      </label>

      <label className="checkbox-field field-span-2">
        <input type="checkbox" name="isRecurring" defaultChecked={initialValues.isRecurring} />
        <span>Recurring income engine</span>
      </label>

      <div className="form-actions field-span-2">
        <button className="button button-primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
