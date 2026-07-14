import Link from "next/link";

import { getActiveProjectBucket } from "@/domain/projects/capacity";
import { PROJECT_SCORE_FIELDS } from "@/domain/projects/scoring";
import { transitionProjectAction, updateProjectAction } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/project-form";
import { createProjectScoreAction } from "@/features/projects/scoring-actions";
import { requireSessionUser } from "@/server/auth/session";
import { listProjectScoresForUser } from "@/server/repositories/project-scores";
import {
  getActiveProjectCapacityForUser,
  getProjectForUser,
  type ProjectStatus,
} from "@/server/repositories/projects";
import { listRevenueEngineOptionsForUser } from "@/server/repositories/revenue-engines";

const nextActions: Record<ProjectStatus, ProjectStatus[]> = {
  idea: ["active", "cancelled", "archived"], active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled", "archived"], completed: ["archived"], cancelled: ["archived"], archived: [],
};

const labels: Record<string, string> = {
  revenuePotential: "Revenue potential", speedToRevenue: "Speed to revenue", marketDemand: "Market demand",
  skillFit: "Skill fit", easeOfValidation: "Validation ease", probabilityOfCompletion: "Completion probability",
  recurringIncomePotential: "Recurring potential", strategicFit: "Strategic fit",
  assetCreationPotential: "Asset creation", complexity: "Complexity", riskScore: "Risk",
};

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const userId = await requireSessionUser();
  const [project, capacity, scores, revenueEngines] = await Promise.all([
    getProjectForUser(userId, projectId),
    getActiveProjectCapacityForUser(userId),
    listProjectScoresForUser(userId, projectId),
    listRevenueEngineOptionsForUser(userId),
  ]);
  const status = project.status as ProjectStatus;
  const projectBucket = getActiveProjectBucket(project.projectType);
  const activationBlocked = capacity[projectBucket].remaining === 0;
  const latestScore = scores[0];

  return (
    <section className="stack-lg content-narrow">
      <div className="page-heading"><div><p className="eyebrow">PROJECT DETAIL</p><h1 className="page-title">{project.name}</h1><p className="page-description">Status saat ini: <strong>{project.status}</strong></p></div><Link href="/projects" className="button button-secondary">Back</Link></div>

      <div className="card form-card"><ProjectForm action={updateProjectAction.bind(null, project.id)} revenueEngines={revenueEngines} submitLabel="Save changes" initialValues={{ name: project.name, description: project.description ?? "", projectType: project.projectType, priority: project.priority as "low" | "medium" | "high" | "critical", revenueEngineId: project.revenueEngineId ?? undefined, startDate: project.startDate ?? "", targetCompletionDate: project.targetCompletionDate ?? "", estimatedHours: Number(project.estimatedHours), revenuePotential: Number(project.revenuePotential), successCriteria: project.successCriteria ?? "", stopCriteria: project.stopCriteria ?? "" }} /></div>

      <div className="card">
        <div className="card-header-row"><div><p className="eyebrow">PROJECT SCORE</p><h2>Score the opportunity</h2></div>{latestScore ? <div className="score-summary"><strong>{Number(latestScore.totalScore).toFixed(1)}</strong><span className="badge">{latestScore.recommendation}</span></div> : null}</div>
        <form action={createProjectScoreAction.bind(null, project.id)} className="form-grid">
          {PROJECT_SCORE_FIELDS.map((field) => <label className="field" key={field}>{labels[field]}<input type="number" name={field} min="1" max="10" step="1" defaultValue="5" required /></label>)}
          <label className="field field-wide">Override or decision note<textarea name="overrideReason" rows={3} placeholder="Optional context when your final decision differs from the recommendation." /></label>
          <div className="form-actions field-wide"><button className="button button-primary" type="submit">Calculate and save score</button></div>
        </form>
        {scores.length > 0 ? <div className="score-history"><h3>Score history</h3>{scores.slice(0, 5).map((score) => <div className="project-row" key={score.id}><div><strong>{Number(score.totalScore).toFixed(1)} — {score.recommendation}</strong><p>{new Date(score.createdAt).toLocaleString("id-ID")}</p></div>{score.overrideReason ? <span className="muted">Decision note saved</span> : null}</div>)}</div> : <p className="muted">Belum ada score. Nilai setiap faktor 1–10 untuk menghasilkan rekomendasi awal.</p>}
      </div>

      <div className="card"><div className="card-header-row"><div><p className="eyebrow">LIFECYCLE</p><h2>Move this project forward</h2></div><span className="badge">{status}</span></div>{nextActions[status].length === 0 ? <p className="muted">Project ini sudah berada pada status final.</p> : <div className="action-row">{nextActions[status].map((nextStatus) => nextStatus === "active" && activationBlocked ? null : <form key={nextStatus} action={transitionProjectAction.bind(null, project.id)}><input type="hidden" name="nextStatus" value={nextStatus} /><button className="button button-secondary" type="submit">Mark as {nextStatus}</button></form>)}</div>}</div>

      {nextActions[status].includes("active") && activationBlocked ? <div className="card override-card"><div><p className="eyebrow">CAPACITY OVERRIDE</p><h2>{projectBucket === "experiment" ? "Experiment" : "Main project"} capacity is full</h2><p className="muted">Saat ini ada {capacity[projectBucket].active}/{capacity[projectBucket].limit} project aktif. Override hanya digunakan untuk komitmen yang lebih penting daripada batas fokus normal.</p></div><form action={transitionProjectAction.bind(null, project.id)} className="override-form"><input type="hidden" name="nextStatus" value="active" /><input type="hidden" name="overrideCapacity" value="true" /><label className="field field-wide">Alasan override<textarea name="overrideReason" rows={4} minLength={20} required placeholder="Jelaskan alasan strategis yang membenarkan tambahan project aktif." /></label><button className="button button-secondary" type="submit">Activate with audited override</button></form></div> : null}
    </section>
  );
}
