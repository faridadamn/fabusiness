import Link from "next/link";

import {
  PRODUCT_TRANSITIONS,
  type ProductStatus,
} from "@/domain/products/lifecycle";
import {
  createProductValidationAction,
  transitionProductAction,
  updateProductAction,
} from "@/features/products/actions";
import { ProductForm } from "@/features/products/product-form";
import { requireSessionUser } from "@/server/auth/session";
import {
  getProductForUser,
  listProductValidationsForUser,
} from "@/server/repositories/products";
import { listRevenueEngineOptionsForUser } from "@/server/repositories/revenue-engines";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const userId = await requireSessionUser();
  const [product, validations, engines] = await Promise.all([
    getProductForUser(userId, productId),
    listProductValidationsForUser(userId, productId),
    listRevenueEngineOptionsForUser(userId),
  ]);
  const status = product.status as ProductStatus;
  const hasPositiveValidation = validations.some((validation) => validation.result === "positive");

  return (
    <section className="stack-lg">
      <div className="page-heading"><div><p className="eyebrow">PRODUCT DETAIL</p><h1 className="page-title">{product.name}</h1><p className="page-description">Status saat ini: <strong>{status}</strong></p></div><Link href="/products" className="button button-secondary">Back</Link></div>
      <div className="engine-detail-grid">
        <div className="stack-lg">
          <div className="card form-card"><ProductForm action={updateProductAction.bind(null, product.id)} engines={engines} submitLabel="Save changes" initialValues={{ name: product.name, description: product.description ?? "", productType: product.productType, price: Number(product.price), targetCustomer: product.targetCustomer ?? "", problemStatement: product.problemStatement ?? "", revenueEngineId: product.revenueEngineId ?? "" }} /></div>
          <div className="card">
            <div className="card-header-row"><div><p className="eyebrow">VALIDATION RECORD</p><h2>Capture evidence, not optimism</h2></div><span className="badge">{validations.length}</span></div>
            <form action={createProductValidationAction.bind(null, product.id)} className="form-grid">
              <label className="field field-wide">Hypothesis<textarea name="hypothesis" rows={3} minLength={5} required placeholder="Target customer will pay for..." /></label>
              <label className="field">Validation method<input name="validationMethod" minLength={3} required placeholder="Interview, preorder, landing page..." /></label>
              <label className="field">Result<select name="result" defaultValue="inconclusive"><option value="positive">Positive</option><option value="negative">Negative</option><option value="inconclusive">Inconclusive</option></select></label>
              <label className="field">Validation date<input type="date" name="validatedOn" required /></label>
              <label className="field">Evidence URL<input type="url" name="evidenceUrl" placeholder="https://" /></label>
              <label className="field field-wide">Notes<textarea name="notes" rows={3} maxLength={2000} /></label>
              <div className="form-actions field-wide"><button className="button button-primary" type="submit">Save validation</button></div>
            </form>
            {validations.length === 0 ? <p className="muted">Belum ada evidence. Product belum dapat ditandai validated.</p> : <div className="score-history">{validations.map((validation) => <div className="project-row" key={validation.id}><div><strong>{validation.hypothesis}</strong><p>{validation.validationMethod} · {validation.validatedOn}</p></div><div className="project-economics"><strong>{validation.result}</strong><span>{validation.evidenceUrl ? "Evidence linked" : "No URL"}</span></div></div>)}</div>}
          </div>
        </div>
        <div className="stack-lg">
          <div className="card">
            <div className="card-header-row"><div><p className="eyebrow">LIFECYCLE</p><h2>Advance only with evidence</h2></div><span className="badge">{status}</span></div>
            {!hasPositiveValidation && status === "validating" ? <p className="muted">Minimal satu validation result positif diperlukan sebelum status validated.</p> : null}
            <div className="action-row">{PRODUCT_TRANSITIONS[status].map((nextStatus) => <form key={nextStatus} action={transitionProductAction.bind(null, product.id)}><input type="hidden" name="nextStatus" value={nextStatus} /><button className="button button-secondary" type="submit">Mark as {nextStatus}</button></form>)}</div>
          </div>
          {(status === "idea" || status === "validating") ? <div className="card override-card"><p className="eyebrow">VALIDATION OVERRIDE</p><h2>Build before validation</h2><p className="muted">Gunakan hanya ketika ada komitmen eksternal yang lebih kuat daripada validation gate. Keputusan dicatat ke audit log.</p><form action={transitionProductAction.bind(null, product.id)} className="override-form"><input type="hidden" name="nextStatus" value="building" /><input type="hidden" name="overrideValidation" value="true" /><label className="field field-wide">Override reason<textarea name="overrideReason" minLength={20} rows={4} required /></label><button className="button button-secondary" type="submit">Build with audited override</button></form></div> : null}
        </div>
      </div>
    </section>
  );
}
