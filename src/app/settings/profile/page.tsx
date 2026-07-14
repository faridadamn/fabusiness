import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireSessionUser } from "@/server/auth/session";
import { getUserProfile } from "@/server/repositories/users";

import { updateProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const userId = await requireSessionUser();
  const profile = await getUserProfile(userId);

  return (
    <AppShell userLabel={profile.displayName}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Profile & working capacity</h1>
          <p className="page-description">
            These values control scheduling assumptions, currency display, and daily workload limits.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h2>Personal configuration</h2>
            <p>Your email is managed by the connected login provider.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="form-grid">
            <label className="field">
              <span>Display name</span>
              <input name="displayName" defaultValue={profile.displayName} required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={profile.email} readOnly disabled />
            </label>
            <label className="field">
              <span>Timezone</span>
              <input name="timezone" defaultValue={profile.timezone} required />
            </label>
            <label className="field">
              <span>Currency</span>
              <input name="currencyCode" defaultValue={profile.currencyCode} required maxLength={3} />
            </label>
            <label className="field field-wide">
              <span>Daily focused-work capacity (minutes)</span>
              <input
                name="dailyCapacityMinutes"
                type="number"
                min={30}
                max={1440}
                defaultValue={profile.dailyCapacityMinutes}
                required
              />
            </label>
            <div className="form-actions field-wide">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
