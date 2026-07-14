import { signOut } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireSessionUser } from "@/server/auth/session";
import { listProjectsForUser } from "@/server/repositories/projects";
import { getUserProfile } from "@/server/repositories/users";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireSessionUser();
  const [projects, profile] = await Promise.all([
    listProjectsForUser(userId),
    getUserProfile(userId),
  ]);

  const activeProjects = projects.filter((project) => project.status === "active");
  const totalPotential = projects.reduce(
    (sum, project) => sum + Number(project.revenuePotential || 0),
    0,
  );

  return (
    <AppShell userLabel={profile.displayName}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMMAND CENTER</p>
          <h1>Good work starts with a clear decision.</h1>
          <p className="page-description">
            Your workspace is connected to Neon and every project query is scoped to your authenticated account.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="ghost">Sign out</Button>
        </form>
      </div>

      <section className="metric-grid" aria-label="Business metrics">
        <Card className="metric-card">
          <p>All projects</p>
          <strong>{projects.length}</strong>
          <span>Owned by this account</span>
        </Card>
        <Card className="metric-card">
          <p>Active projects</p>
          <strong>{activeProjects.length}</strong>
          <span>Execution focus</span>
        </Card>
        <Card className="metric-card">
          <p>Revenue potential</p>
          <strong>Rp {totalPotential.toLocaleString("id-ID")}</strong>
          <span>Across visible projects</span>
        </Card>
        <Card className="metric-card">
          <p>Daily capacity</p>
          <strong>{profile.dailyCapacityMinutes} min</strong>
          <span>{profile.timezone}</span>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <h2>Current projects</h2>
            <p>The first five projects returned by the ownership-safe repository.</p>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="empty-state">
              <strong>No projects yet</strong>
              <p>Your project workspace is ready for Phase 1 CRUD implementation.</p>
            </div>
          ) : (
            <div className="project-list">
              {projects.slice(0, 5).map((project) => (
                <article className="project-row" key={project.id}>
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.projectType}</p>
                  </div>
                  <span className="badge">{project.status}</span>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
