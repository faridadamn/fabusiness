import { TIME_ACTIVITY_CATEGORIES, TIME_ACTIVITY_LABELS } from "@/domain/time-tracking/categories";
import { createManualTimeEntryAction } from "@/features/time-tracking/actions";
import { requireSessionUser } from "@/server/auth/session";
import { getTimeSummaryForUser, listTimeEntriesForUser, listTimeEntryOptionsForUser } from "@/server/repositories/time-entries";

export const dynamic = "force-dynamic";

function monthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    today: now.toISOString().slice(0, 10),
  };
}

function hours(minutes: number) {
  return `${(Number(minutes) / 60).toFixed(1)} h`;
}

export default async function TimeTrackingPage() {
  const userId = await requireSessionUser();
  const { startDate, endDate, today } = monthBounds();
  const [entries, summary, options] = await Promise.all([
    listTimeEntriesForUser(userId, startDate, endDate),
    getTimeSummaryForUser(userId, startDate, endDate),
    listTimeEntryOptionsForUser(userId),
  ]);

  const revenueRatio = Number(summary.totalMinutes) > 0
    ? (Number(summary.revenueMinutes) / Number(summary.totalMinutes)) * 100
    : 0;

  return (
    <section className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TIME TRACKING</p>
          <h1 className="page-title">Track where the work actually goes</h1>
          <p className="page-description">Catat waktu manual terlebih dahulu. Data bulan berjalan langsung memperbarui actual minutes task dan actual hours project.</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="card metric-card"><span>Total hours</span><strong>{hours(Number(summary.totalMinutes))}</strong><p>Bulan berjalan</p></div>
        <div className="card metric-card"><span>Revenue hours</span><strong>{hours(Number(summary.revenueMinutes))}</strong><p>{revenueRatio.toFixed(0)}% dari waktu tercatat</p></div>
        <div className="card metric-card"><span>Billable hours</span><strong>{hours(Number(summary.billableMinutes))}</strong><p>Waktu yang bisa ditagihkan</p></div>
        <div className="card metric-card"><span>Entries</span><strong>{Number(summary.entryCount)}</strong><p>{startDate} — {endDate}</p></div>
      </div>

      <div className="card form-card">
        <div className="card-header-row"><div><p className="eyebrow">MANUAL ENTRY</p><h2>Record completed work</h2></div></div>
        <form action={createManualTimeEntryAction} className="form-grid">
          <label className="field"><span>Date</span><input type="date" name="entryDate" defaultValue={today} required /></label>
          <label className="field"><span>Duration in minutes</span><input type="number" name="durationMinutes" min="1" max="1440" step="1" required /></label>
          <label className="field"><span>Activity category</span><select name="activityCategory" defaultValue="revenue_generating">{TIME_ACTIVITY_CATEGORIES.map((category) => <option value={category} key={category}>{TIME_ACTIVITY_LABELS[category]}</option>)}</select></label>
          <label className="field"><span>Project</span><select name="projectId" defaultValue=""><option value="">Unassigned</option>{options.projectOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field"><span>Task</span><select name="taskId" defaultValue=""><option value="">Unassigned</option>{options.taskOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field"><span>Revenue engine</span><select name="revenueEngineId" defaultValue=""><option value="">Unassigned</option>{options.revenueEngineOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field field-span-2"><span>Notes</span><textarea name="notes" rows={3} maxLength={2000} /></label>
          <label className="checkbox-field field-span-2"><input type="checkbox" name="isBillable" /><span>Billable work</span></label>
          <div className="form-actions field-span-2"><button className="button button-primary" type="submit">Save time entry</button></div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-row"><div><p className="eyebrow">THIS MONTH</p><h2>Recent entries</h2></div></div>
        {entries.length === 0 ? <p className="muted">Belum ada waktu tercatat bulan ini.</p> : <div className="project-list">{entries.map((entry) => <div className="project-row" key={entry.id}><div><strong>{TIME_ACTIVITY_LABELS[entry.activityCategory as keyof typeof TIME_ACTIVITY_LABELS]}</strong><p>{entry.entryDate}{entry.notes ? ` · ${entry.notes}` : ""}</p></div><div className="entry-meta"><strong>{entry.durationMinutes} min</strong>{entry.isBillable ? <span className="badge">billable</span> : null}</div></div>)}</div>}
      </div>
    </section>
  );
}
