import Link from "next/link";

import { createRevenueEngineAction } from "@/features/revenue-engines/actions";
import { RevenueEngineForm } from "@/features/revenue-engines/revenue-engine-form";

export default function NewRevenueEnginePage() {
  return (
    <section className="stack-lg content-narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">NEW REVENUE ENGINE</p>
          <h1 className="page-title">Define a path to revenue</h1>
          <p className="page-description">Mulai sebagai idea, tentukan target ekonomi dan tanggal review sebelum mengaktifkannya.</p>
        </div>
        <Link href="/revenue-engines" className="button button-secondary">Back</Link>
      </div>
      <div className="card form-card">
        <RevenueEngineForm action={createRevenueEngineAction} submitLabel="Create revenue engine" />
      </div>
    </section>
  );
}
