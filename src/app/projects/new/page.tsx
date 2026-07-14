import Link from "next/link";

import { createProjectAction } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/project-form";

export default function NewProjectPage() {
  return (
    <section className="stack-lg content-narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">NEW PROJECT</p>
          <h1 className="page-title">Create a focused project</h1>
          <p className="page-description">Tentukan nilai bisnis, batas waktu, success criteria, dan kondisi berhenti sebelum eksekusi dimulai.</p>
        </div>
        <Link href="/projects" className="button button-secondary">Back</Link>
      </div>
      <div className="card form-card">
        <ProjectForm action={createProjectAction} submitLabel="Create project" />
      </div>
    </section>
  );
}
