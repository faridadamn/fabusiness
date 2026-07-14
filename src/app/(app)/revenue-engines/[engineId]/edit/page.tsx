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
import { requireSessionUser } from "@/server/auth/session";
import {
  getRevenueEngineForUser,
  getRevenueEngineProjectSummaryForUser,
} from "@/server/repositories/revenue-engines";

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
}: {
  params: Promise<{ engineId: string }>;
}) {
  const { engineId } = await params;
  const userId = await requireSessionUser();
  const [engine, portfolio] = await Promise.all([
    getRevenueEngineForUser(userId, engineId),
    getRevenueEngineProjectSummaryForUser(userId, engineId),
  ]);
  const status = engine.status as RevenueEngineStatus;
  const actualRevenue = Number(portfolio.summary.actualRevenue);
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
          <p className="page-description">
            Status saat ini: <strong>{status}</strong>
          </p>
        </div>
        <Link href="/revenue-engines" className="button button-secondary">
          Back
        </Link>
      </div>

      <div className="metric-grid">
        <div className="card metric-card">
          <span>Linked projects</span>
          <strong>{portfolio.summary.linkedProjects}</strong>
          <p>{portfolio.summary.activeProjects} sedang aktif</p>
        </div>
        <div className="card metric-card">
          <span>Actual revenue</span>
          <strong>{formatCurrency(actualRevenue)}</strong>
          <p>{targetProgress === null ? "Target belum ditetapkan" : `${targetProgress.toFixed(1)}% dari target bulanan`}</p>
        </div>
        <div className="card metric-card">
          <span>Actual revenue per hour</span>
          <strong>{formatRate(actualRevenuePerHour)}</strong>
          <p>{actualHours.toFixed(1)} jam aktual tercatat</p>
        </div>
        <div className="card metric-card">
          <span>Potential revenue per hour</span>
          <strong>{formatRate(potentialRevenuePerHour)}</strong>
          <p>{formatCurrency(revenuePotential)} potential / {estimatedHours.toFixed(1)} jam estimasi</p>
        </div>
      </div>

      <div className="engine-detail-grid">
        <div className="card form-card">
          <RevenueEngineForm
            action={updateRevenueEngineAction.bind(null, engine.id)}
            submitLabel="Save changes"
            initialValues={{
              name: engine.name,
              description: engine.description ?? "",
              incomeType: engine.incomeType,
              monthlyTarget: Number(engine.monthlyTarget),
              isRecurring: engine.isRecurring,
              averageTicketSize: Number(engine.averageTicketSize),
              targetCustomer: engine.targetCustomer ?? "",
              startDate: engine.startDate ?? "",
              reviewDate: engine.reviewDate ?? "",
            }}
          />
        </div>

        <div className="stack-lg">
          <div className="card">
            <div className="card-header-row">
              <div>
                <p className="eyebrow">LINKED PROJECTS</p>
                <h2>Work contributing to this engine</h2>
              </div>
              <span className="badge">{portfolio.projects.length}</span>
            </div>

            {portfolio.projects.length === 0 ? (
              <p className="muted">Belum ada project yang dihubungkan ke revenue engine ini.</p>
            ) : (
              <div className="project-list">
                {portfolio.projects.map((project) => {
                  const projectActualHours = Number(project.actualHours);
                  const projectActualRevenue = Number(project.actualRevenue);
                  const projectRate = calculateRevenuePerHour(projectActualRevenue, projectActualHours);

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}/edit`}
                      className="project-row"
                    >
                      <div>
                        <strong>{project.name}</strong>
                        <p>
                          {project.status} · {formatCurrency(Number(project.revenuePotential))} potential
                        </p>
                      </div>
                      <div className="project-economics">
                        <strong>{formatRate(projectRate)}</strong>
                        <span>{projectActualHours.toFixed(1)} jam aktual</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <div>
                <p className="eyebrow">LIFECYCLE</p>
                <h2>Make an explicit portfolio decision</h2>
              </div>
              <span className="badge">{status}</span>
            </div>

            {REVENUE_ENGINE_TRANSITIONS[status].length === 0 ? (
              <p className="muted">Revenue engine ini sudah dihentikan dan menjadi histori keputusan.</p>
            ) : (
              <div className="action-row">
                {REVENUE_ENGINE_TRANSITIONS[status].map((nextStatus) => (
                  <form key={nextStatus} action={transitionRevenueEngineAction.bind(null, engine.id)}>
                    <input type="hidden" name="nextStatus" value={nextStatus} />
                    <button className="button button-secondary" type="submit">
                      Mark as {nextStatus}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
