import { signOut } from "@/auth";
import { requireSessionUser } from "@/server/auth/session";
import { listProjectsForUser } from "@/server/repositories/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireSessionUser();
  const projects = await listProjectsForUser(userId);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="status-row">
          <span className="status-dot" aria-hidden="true" />
          <span>Authenticated workspace</span>
        </div>

        <p className="eyebrow">FA BUSINESS OS</p>
        <h1>Command center foundation is connected.</h1>
        <p className="hero-copy">
          Session identity, Neon database access, and project ownership filtering
          are now wired into the first protected screen.
        </p>

        <div className="foundation-list">
          <p>
            Active project records: <strong>{projects.length}</strong>
          </p>
          {projects.length === 0 ? (
            <p>No project has been created for this account.</p>
          ) : (
            <ul>
              {projects.slice(0, 5).map((project) => (
                <li key={project.id}>{project.name}</li>
              ))}
            </ul>
          )}
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit">Keluar</button>
        </form>
      </section>
    </main>
  );
}
