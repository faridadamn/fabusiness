import Link from "next/link";

import {
  transitionRevenueEngineAction,
  updateRevenueEngineAction,
} from "@/features/revenue-engines/actions";
import { RevenueEngineForm } from "@/features/revenue-engines/revenue-engine-form";
import {
  REVENUE_ENGINE_TRANSITIONS,
  type RevenueEngineStatus,
} from "@/domain/revenue-engines/lifecycle";
import { requireSessionUser } from "@/server/auth/session";
import { getRevenueEngineForUser } from "@/server/repositories/revenue-engines";

export const dynamic = "force-dynamic";

export default async function EditRevenueEnginePage({
  params,
}: {
  params: Promise<{ engineId: string }>;
}) {
  const { engineId } = await params;
  const userId = await requireSessionUser();
  const engine = await getRevenueEngineForUser(userId, engineId);
  const status = engine.status as RevenueEngineStatus;

  return (
    <section className="stack-lg content-narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">REVENUE ENGINE DETAIL</p>
          <h1 className="page-title">{engine.name}</h1>
          <p className="page-description">Status saat ini: <strong>{status}</strong></p>
        </div>
        <Link href="/revenue-engines" className="button button-secondary">Back</Link>
      </div>

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
                <button className="button button-secondary" type="submit">Mark as {nextStatus}</button>
              </form>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
