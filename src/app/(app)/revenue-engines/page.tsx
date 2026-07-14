import Link from "next/link";

import { requireSessionUser } from "@/server/auth/session";
import { listRevenueEnginesForUser } from "@/server/repositories/revenue-engines";

export const dynamic = "force-dynamic";

export default async function RevenueEnginesPage() {
  const userId = await requireSessionUser();
  const engines = await listRevenueEnginesForUser(userId);
  const active = engines.filter((engine) => engine.status === "active");
  const monthlyTarget = active.reduce(
    (total, engine) => total + Number(engine.monthlyTarget),
    0,
  );

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">REVENUE PORTFOLIO</p>
          <h1 className="page-title">Revenue engines</h1>
          <p className="page-description">
            Kelola jalur pendapatan sebagai portfolio yang dapat divalidasi, diaktifkan, dipause, atau dihentikan.
          </p>
        </div>
        <Link href="/revenue-engines/new" className="button button-primary">New revenue engine</Link>
      </div>

      <div className="metric-grid">
        <article className="card metric-card"><span>Total engines</span><strong>{engines.length}</strong></article>
        <article className="card metric-card"><span>Active engines</span><strong>{active.length}</strong></article>
        <article className="card metric-card"><span>Recurring active</span><strong>{active.filter((engine) => engine.isRecurring).length}</strong></article>
        <article className="card metric-card"><span>Monthly target</span><strong>Rp {monthlyTarget.toLocaleString("id-ID")}</strong></article>
      </div>

      {engines.length === 0 ? (
        <div className="empty-state">
          <h2>Belum ada revenue engine</h2>
          <p>Buat jalur pendapatan pertama, tentukan target bulanan dan tanggal review.</p>
          <Link href="/revenue-engines/new" className="button button-primary">Create revenue engine</Link>
        </div>
      ) : (
        <div className="card-grid">
          {engines.map((engine) => (
            <article className="card" key={engine.id}>
              <div className="card-header-row">
                <div><span className="badge">{engine.status}</span><h2>{engine.name}</h2></div>
                <span className="muted">{engine.incomeType}</span>
              </div>
              <p className="muted">{engine.description || "No description yet."}</p>
              <dl className="project-facts">
                <div><dt>Monthly target</dt><dd>Rp {Number(engine.monthlyTarget).toLocaleString("id-ID")}</dd></div>
                <div><dt>Ticket size</dt><dd>Rp {Number(engine.averageTicketSize).toLocaleString("id-ID")}</dd></div>
                <div><dt>Recurring</dt><dd>{engine.isRecurring ? "Yes" : "No"}</dd></div>
              </dl>
              <Link href={`/revenue-engines/${engine.id}/edit`} className="button button-secondary">Open engine</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
