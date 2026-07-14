type EngineOption = { id: string; name: string; status: string };

type ProductValues = {
  name: string;
  description: string;
  productType: string;
  price: number;
  targetCustomer: string;
  problemStatement: string;
  revenueEngineId: string;
};

export function ProductForm({
  action,
  engines,
  initialValues,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  engines: EngineOption[];
  initialValues?: Partial<ProductValues>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="form-grid">
      <label className="field field-wide">Product name<input name="name" required minLength={3} maxLength={120} defaultValue={initialValues?.name ?? ""} /></label>
      <label className="field">Product type<input name="productType" required defaultValue={initialValues?.productType ?? "digital-product"} /></label>
      <label className="field">Price<input name="price" type="number" min="0" step="1000" defaultValue={initialValues?.price ?? 0} required /></label>
      <label className="field field-wide">Revenue engine<select name="revenueEngineId" defaultValue={initialValues?.revenueEngineId ?? ""}><option value="">Unassigned</option>{engines.map((engine) => <option key={engine.id} value={engine.id}>{engine.name} · {engine.status}</option>)}</select></label>
      <label className="field field-wide">Target customer<input name="targetCustomer" maxLength={500} defaultValue={initialValues?.targetCustomer ?? ""} /></label>
      <label className="field field-wide">Problem statement<textarea name="problemStatement" rows={3} maxLength={1000} defaultValue={initialValues?.problemStatement ?? ""} /></label>
      <label className="field field-wide">Description<textarea name="description" rows={4} maxLength={2000} defaultValue={initialValues?.description ?? ""} /></label>
      <div className="form-actions field-wide"><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  );
}
