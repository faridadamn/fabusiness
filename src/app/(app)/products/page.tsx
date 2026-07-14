import Link from "next/link";

import { requireSessionUser } from "@/server/auth/session";
import { listProductsForUser } from "@/server/repositories/products";

export const dynamic = "force-dynamic";

const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
}).format(value);

export default async function ProductsPage() {
  const userId = await requireSessionUser();
  const products = await listProductsForUser(userId);
  const launched = products.filter((product) => product.status === "launched").length;
  const validating = products.filter((product) => product.status === "validating").length;
  const building = products.filter((product) => product.status === "building").length;

  return (
    <section className="stack-lg">
      <div className="page-heading"><div><p className="eyebrow">PRODUCT PORTFOLIO</p><h1 className="page-title">Validate before you build</h1><p className="page-description">Kelola produk dari ide, validasi, pembangunan, peluncuran, hingga keputusan berhenti.</p></div><Link href="/products/new" className="button button-primary">New product</Link></div>
      <div className="metric-grid">
        <div className="card metric-card"><span>Total products</span><strong>{products.length}</strong><p>Seluruh portfolio</p></div>
        <div className="card metric-card"><span>Validating</span><strong>{validating}</strong><p>Mencari bukti pasar</p></div>
        <div className="card metric-card"><span>Building</span><strong>{building}</strong><p>Sedang dibuat</p></div>
        <div className="card metric-card"><span>Launched</span><strong>{launched}</strong><p>Sudah tersedia</p></div>
      </div>
      {products.length === 0 ? <div className="empty-state"><h2>Belum ada produk</h2><p>Mulai dari satu masalah pelanggan yang spesifik, bukan langsung dari fitur.</p><Link href="/products/new" className="button button-primary">Create first product</Link></div> : <div className="card-grid">{products.map((product) => <Link className="card" href={`/products/${product.id}/edit`} key={product.id}><div className="card-header-row"><div><p className="eyebrow">{product.productType}</p><h2>{product.name}</h2></div><span className="badge">{product.status}</span></div><p className="muted">{product.problemStatement || product.description || "Belum ada problem statement."}</p><div className="project-facts"><div><dt>Price</dt><dd>{formatCurrency(Number(product.price))}</dd></div><div><dt>Customer</dt><dd>{product.targetCustomer || "Unspecified"}</dd></div><div><dt>Engine</dt><dd>{product.revenueEngineId ? "Linked" : "Unassigned"}</dd></div></div></Link>)}</div>}
    </section>
  );
}
