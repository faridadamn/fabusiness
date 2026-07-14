import Link from "next/link";

import { requireSessionUser } from "@/server/auth/session";
import { listProjectsForUser } from "@/server/repositories/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const userId = await requireSessionUser();
  const projects = await listProjectsForUser(userId);

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT PORTFOLIO</p>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">Kelola project dari ide sampai selesai tanpa kehilangan ownership dan konteks bisnis.</p>
        </div>
        <Link href="/projects/new" className="button button-primary">New project</Link>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h2>Belum ada project</h2>
          <p>Buat project pertama dan tentukan success criteria serta stop criteria sejak awal.</p>
          <Link href="/projects/new" className="button button-primary">Create project</Link>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <article className="card" key={project.id}>
              <div className="card-header-row">
                <div>
                  <span className="badge">{project.status}</span>
                  <h2>{project.name}</h2>
                </div>
                <span className="muted">{project.priority}</span>
              </div>
              <p className="muted">{project.description || "No description yet."}</p>
              <dl className="project-facts">
                <div><dt>Type</dt><dd>{project.projectType}</dd></div>
                <div><dt>Estimated</dt><dd>{project.estimatedHours} h</dd></div>
                <div><dt>Revenue potential</dt><dd>Rp {Number(project.revenuePotential).toLocaleString("id-ID")}</dd></div>
              </dl>
              <Link href={`/projects/${project.id}/edit`} className="button button-secondary">Open project</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
