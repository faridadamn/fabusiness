import Link from "next/link";

import {
  transitionProjectAction,
  updateProjectAction,
} from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/project-form";
import { requireSessionUser } from "@/server/auth/session";
import {
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
  const project = await getProjectForUser(userId, projectId);
  const status = project.status as ProjectStatus;

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
            {nextActions[status].map((nextStatus) => (
              <form
                key={nextStatus}
                action={transitionProjectAction.bind(null, project.id)}
              >
                <input type="hidden" name="nextStatus" value={nextStatus} />
                <button className="button button-secondary" type="submit">
                  Mark as {nextStatus}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
