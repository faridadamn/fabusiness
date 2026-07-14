import Link from "next/link";

import {
  calculateRevenuePerHour,
  calculateTargetProgress,
} from "@/domain/revenue-engines/economics";
import {
  REVENUE_ENGINE_TRANSITIONS,
  type RevenueEngineStatus,
} from "@/domain/revenue-engines/lifecycle";
import {
  transitionRevenueEngineAction,
  updateRevenueEngineAction,
} from "@/features/revenue-engines/actions";
import { RevenueEngineForm } from "@/features/revenue-engines/revenue-engine-form";
import {
  createRevenueTransactionAction,
  deleteRevenueTransactionAction,
  updateRevenueTransactionAction,
} from "@/features/revenue-engines/transaction-actions";
import { requireSessionUser } from "@/server/auth/session";
import {
  getRevenueEngineForUser,
  getRevenueEngineProductSummaryForUser,
  getRevenueEngineProjectSummaryForUser,
} from "@/server/repositories/revenue-engines";
import { getRevenueLedgerForUser } from "@/server/repositories/revenue-transactions";

export const dynamic = "force-dynamic";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatRate = (value: number | null) =>
  value === null ? "Belum tersedia" : `${formatCurrency(value)}/jam`;

export default async function EditRevenueEnginePage({
  params,
  searchParams,
}: {
  params: Promise<{ engineId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const { engineId } = await params;
  const filters = await searchParams;
  const userId = await requireSessionUser();
  const [engine, portfolio, productPortfolio, ledger] = await Promise.all([
    getRevenueEngineForUser(userId, engineId),
    getRevenueEngineProjectSummaryForUser(userId, engineId),
    getRevenueEngineProductSummaryForUser(userId, engineId),
    getRevenueLedgerForUser(userId, engineId, {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
  ]);
  const status = engine.status as RevenueEngineStatus;
  const actualRevenue = ledger.summary.income;
  const expense = ledger.summary.expense;
  const netRevenue = ledger.summary.net;
  const revenuePotential = Number(portfolio.summary.revenuePotential);
  const actualHours = Number(portfolio.summary.actualHours);
  const estimatedHours = Number(portfolio.summary.estimatedHours);
  const targetProgress = calculateTargetProgress(actualRevenue, Number(engine.monthlyTarget));
  const actualRevenuePerHour = calculateRevenuePerHour(actualRevenue, actualHours);
  const potentialRevenuePerHour = calculateRevenuePerHour(revenuePotential, estimatedHours);

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">REVENUE ENGINE DETAIL</p>
          <h1 className="page-title">{engine.name}</h1>
          <p className="page-description">Status saat ini: <strong>{status}</strong></p>
        </div>
        <Link href="/revenue-engines" className="button button-secondary">Back</Link>
      </div>

      <form className="card ledger-filter" method="get">
        <div><p className="eyebrow">REPORTING PERIOD</p><h2>Filter ledger and financial metrics</h2></div>
        <label className="field">Start date<input name="startDate" type="date" defaultValue={filters.startDate ?? ""} /></label>
        <label className="field">End date<input name="endDate" type="date" defaultValue={filters.endDate ?? ""} /></label>
        <div className="action-row"><button className="button button-primary" type="submit">Apply period</button><Link className="button button-ghost" href={`/revenue-engines/${engine.id}/edit`}>Clear</Link></div>
      </form>

      <div className="metric-grid">
        <div className="card metric-card"><span>Actual income</span><strong>{formatCurrency(actualRevenue)}</strong><p>{targetProgress === null ? "Target belum ditetapkan" : `${targetProgress.toFixed(1)}% dari target bulanan`}</p></div>
        <div className="card metric-card"><span>Expense</span><strong>{formatCurrency(expense)}</strong><p>Biaya pada periode terpilih</p></div>
        <div className="card metric-card"><span>Net revenue</span><strong>{formatCurrency(netRevenue)}</strong><p>Income dikurangi expense</p></div>
        <div className="card metric-card"><span>Revenue per hour</span><strong>{formatRate(actualRevenuePerHour)}</strong><p>{actualHours.toFixed(1)} jam aktual project</p></div>
      </div>

      <div className="engine-detail-grid">
        <div className="stack-lg">
          <div className="card form-card">
            <RevenueEngineForm action={updateRevenueEngineAction.bind(null, engine.id)} submitLabel="Save changes" initialValues={{
              name: engine.name, description: engine.description ?? "", incomeType: engine.incomeType,
              monthlyTarget: Number(engine.monthlyTarget), isRecurring: engine.isRecurring,
              averageTicketSize: Number(engine.averageTicketSize), targetCustomer: engine.targetCustomer ?? "",
              startDate: engine.startDate ?? "", reviewDate: engine.reviewDate ?? "",
            }} />
          </div>

          <div className="card">
            <div className="card-header-row"><div><p className="eyebrow">TRANSACTION LEDGER</p><h2>Record actual income or expense</h2></div><span className="badge">{ledger.transactions.length}</span></div>
            <form action={createRevenueTransactionAction.bind(null, engine.id)} className="form-grid">
              <label className="field">Type<select name="transactionType" defaultValue="income"><option value="income">Income</option><option value="expense">Expense</option></select></label>
              <label className="field">Amount<input name="amount" type="number" min="1" step="1000" required /></label>
              <label className="field">Date<input name="occurredOn" type="date" required /></label>
              <label className="field">Linked project<select name="projectId" defaultValue=""><option value="">No project</option>{portfolio.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label className="field field-wide">Description<input name="description" minLength={3} maxLength={500} required /></label>
              <div className="form-actions field-wide"><button className="button button-primary" type="submit">Save transaction</button></div>
            </form>
            {ledger.transactions.length > 0 ? (
              <div className="transaction-list">{ledger.transactions.map((transaction) => (
                <details className="transaction-item" key={transaction.id}>
                  <summary><div><strong>{transaction.description}</strong><p>{transaction.occurredOn} · {transaction.source}</p></div><div className="project-economics"><strong>{transaction.transactionType === "expense" ? "−" : "+"}{formatCurrency(Number(transaction.amount))}</strong><span>{transaction.transactionType}</span></div></summary>
                  <form action={updateRevenueTransactionAction.bind(null, engine.id, transaction.id)} className="form-grid transaction-edit-form">
                    <label className="field">Type<select name="transactionType" defaultValue={transaction.transactionType}><option value="income">Income</option><option value="expense">Expense</option></select></label>
                    <label className="field">Amount<input name="amount" type="number" min="1" step="1000" defaultValue={Number(transaction.amount)} required /></label>
                    <label className="field">Date<input name="occurredOn" type="date" defaultValue={transaction.occurredOn} required /></label>
                    <label className="field">Linked project<select name="projectId" defaultValue={transaction.projectId ?? ""}><option value="">No project</option>{portfolio.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
                    <label className="field field-wide">Description<input name="description" defaultValue={transaction.description} minLength={3} maxLength={500} required /></label>
                    <div className="form-actions field-wide"><button className="button button-primary" type="submit">Save edit</button></div>
                  </form>
                  <form action={deleteRevenueTransactionAction.bind(null, engine.id, transaction.id)} className="transaction-delete-form"><button className="button button-ghost" type="submit">Soft delete transaction</button></form>
                </details>
              ))}</div>
            ) : <p className="muted">Tidak ada transaksi pada periode yang dipilih.</p>}
          </div>
        </div>

        <div className="stack-lg">
          <div className="card">
            <div className="card-header-row"><div><p className="eyebrow">LINKED PROJECTS</p><h2>Work contributing to this engine</h2></div><span className="badge">{portfolio.projects.length}</span></div>
            <div className="capacity-grid">
              <div className="capacity-card"><span>Potential RPH</span><strong>{formatRate(potentialRevenuePerHour)}</strong><small>{formatCurrency(revenuePotential)} / {estimatedHours.toFixed(1)} jam</small></div>
              <div className="capacity-card"><span>Active projects</span><strong>{portfolio.summary.activeProjects}</strong><small>{portfolio.summary.linkedProjects} total linked</small></div>
            </div>
            {portfolio.projects.length === 0 ? <p className="muted">Belum ada project yang dihubungkan ke revenue engine ini.</p> : (
              <div className="project-list">{portfolio.projects.map((project) => <Link key={project.id} href={`/projects/${project.id}/edit`} className="project-row"><div><strong>{project.name}</strong><p>{project.status} · {formatCurrency(Number(project.revenuePotential))} potential</p></div><div className="project-economics"><strong>{Number(project.actualHours).toFixed(1)} jam</strong><span>{Number(project.estimatedHours).toFixed(1)} jam estimasi</span></div></Link>)}</div>
            )}
          </div>

          <div className="card">
            <div className="card-header-row"><div><p className="eyebrow">LINKED PRODUCTS</p><h2>Offers monetized by this engine</h2></div><span className="badge">{productPortfolio.products.length}</span></div>
            <div className="capacity-grid">
              <div className="capacity-card"><span>Launched</span><strong>{productPortfolio.summary.launchedProducts}</strong><small>{productPortfolio.summary.linkedProducts} total linked</small></div>
              <div className="capacity-card"><span>In development</span><strong>{Number(productPortfolio.summary.buildingProducts) + Number(productPortfolio.summary.validatedProducts)}</strong><small>validated + building</small></div>
            </div>
            {productPortfolio.products.length === 0 ? <p className="muted">Belum ada product yang dihubungkan ke revenue engine ini.</p> : (
              <div className="project-list">{productPortfolio.products.map((product) => <Link key={product.id} href={`/products/${product.id}/edit`} className="project-row"><div><strong>{product.name}</strong><p>{product.productType} · {product.status}</p></div><div className="project-economics"><strong>{formatCurrency(Number(product.price))}</strong><span>{product.launchedAt ? `launched ${product.launchedAt.toLocaleDateString("id-ID")}` : "not launched"}</span></div></Link>)}</div>
            )}
          </div>

          <div className="card">
            <div className="card-header-row"><div><p className="eyebrow">LIFECYCLE</p><h2>Make an explicit portfolio decision</h2></div><span className="badge">{status}</span></div>
            {REVENUE_ENGINE_TRANSITIONS[status].length === 0 ? <p className="muted">Revenue engine ini sudah dihentikan dan menjadi histori keputusan.</p> : (
              <div className="action-row">{REVENUE_ENGINE_TRANSITIONS[status].map((nextStatus) => <form key={nextStatus} action={transitionRevenueEngineAction.bind(null, engine.id)}><input type="hidden" name="nextStatus" value={nextStatus} /><button className="button button-secondary" type="submit">Mark as {nextStatus}</button></form>)}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
