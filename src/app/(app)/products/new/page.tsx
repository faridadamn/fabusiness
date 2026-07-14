import Link from "next/link";

import { createProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/product-form";
import { requireSessionUser } from "@/server/auth/session";
import { listRevenueEngineOptionsForUser } from "@/server/repositories/revenue-engines";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const userId = await requireSessionUser();
  const engines = await listRevenueEngineOptionsForUser(userId);

  return (
    <section className="stack-lg content-narrow">
      <div className="page-heading"><div><p className="eyebrow">NEW PRODUCT</p><h1 className="page-title">Start with the customer problem</h1><p className="page-description">Simpan asumsi produk terlebih dahulu. Status awal selalu idea dan belum boleh langsung dianggap siap dibangun.</p></div><Link href="/products" className="button button-secondary">Back</Link></div>
      <div className="card form-card"><ProductForm action={createProductAction} engines={engines} submitLabel="Create product" /></div>
    </section>
  );
}
