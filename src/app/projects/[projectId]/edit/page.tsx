import Link from "next/link";

import { getActiveProjectBucket } from "@/domain/projects/capacity";
import {
  transitionProjectAction,
  updateProjectAction,
} from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/project-form";
import { requireSessionUser } from "@/server/auth/session";
import {
  getActiveProjectCapacityForUser,
  getProjectForUser,
  type ProjectStatus,
} from "@/server/repositories/projects";

const nextActions: Record<ProjectStatus, ProjectStatus[]> = {
  idea: ["active", "cancelled", "archived"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const userId = await requireSessionUser();
  const [project, capacity] = await Promise.all([
    getProjectForUser(userId, projectId),
    getActiveProjectCapacityForUser(userId),
  ]);
  const status = project.status as ProjectStatus;
  const projectBucket = getActiveProjectBucket(project.projectType);
  const activationBlocked = capacity[projectBucket].remaining === 0;

  return (
    <section className="stack-lg content-narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT DETAIL</p>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-description">
            Status saat ini: <strong>{project.status}</strong>
          </p>
        </div>
        <Link href="/projects" className="button button-secondary">
          Back
        </Link>
      </div>

      <div className="card form-card">
        <ProjectForm
          action={updateProjectAction.bind(null, project.id)}
          submitLabel="Save changes"
          initialValues={{
            name: project.name,
            description: project.description ?? "",
            projectType: project.projectType,
            priority: project.priority as "low" | "medium" | "high" | "critical",
            startDate: project.startDate ?? "",
            targetCompletionDate: project.targetCompletionDate ?? "",
            estimatedHours: Number(project.estimatedHours),
            revenuePotential: Number(project.revenuePotential),
            successCriteria: project.successCriteria ?? "",
            stopCriteria: project.stopCriteria ?? "",
          }}
        />
      </div>

      <div className="card">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">LIFECYCLE</p>
            <h2>Move this project forward</h2>
          </div>
          <span className="badge">{status}</span>
        </div>

        {nextActions[status].length === 0 ? (
          <p className="muted">Project ini sudah berada pada status final.</p>
        ) : (
          <div className="action-row">
            {nextActions[status].map((nextStatus) => {
              const isBlockedActivation = nextStatus === "active" && activationBlocked;

              if (isBlockedActivation) {
                return null;
              }

              return (
                <form
                  key={nextStatus}
                  action={transitionProjectAction.bind(null, project.id)}
                >
                  <input type="hidden" name="nextStatus" value={nextStatus} />
                  <button className="button button-secondary" type="submit">
                    Mark as {nextStatus}
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </div>

      {nextActions[status].includes("active") && activationBlocked ? (
        <div className="card override-card">
          <div>
            <p className="eyebrow">CAPACITY OVERRIDE</p>
            <h2>{projectBucket === "experiment" ? "Experiment" : "Main project"} capacity is full</h2>
            <p className="muted">
              Saat ini ada {capacity[projectBucket].active}/{capacity[projectBucket].limit} project aktif.
              Override hanya digunakan untuk komitmen yang memang lebih penting daripada batas fokus normal.
            </p>
          </div>

          <form action={transitionProjectAction.bind(null, project.id)} className="override-form">
            <input type="hidden" name="nextStatus" value="active" />
            <input type="hidden" name="overrideCapacity" value="true" />
            <label className="field field-wide">
              Alasan override
              <textarea
                name="overrideReason"
                rows={4}
                minLength={20}
                required
                placeholder="Jelaskan komitmen bisnis, deadline, atau alasan strategis yang membenarkan tambahan project aktif."
              />
            </label>
            <button className="button button-secondary" type="submit">
              Activate with audited override
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
