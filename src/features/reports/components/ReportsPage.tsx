import { useMemo, useState } from "react";
import { CheckCircle2, Download, ListChecks, Percent, Printer } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  ChipGroup,
  EmptyState,
  Select,
  Spinner,
  useToast,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/features/dashboard/components/DashboardBits";
import { StatusChart } from "@/features/dashboard/components/StatusChart";
import { TrainingProgress } from "@/features/trainees/components/TrainingProgress";
import { useWorkLogs } from "@/features/work-logs/hooks/useWorkLogs";
import { exportWorkLogsCsv } from "@/features/work-logs/export";
import { STATUS_OPTIONS } from "@/features/work-logs/constants";
import { useTrainees } from "@/features/trainees/hooks/useTrainees";
import { useMaster } from "@/features/masters/hooks/useMasters";
import { formatDate } from "@/lib/date";

type Mode = "trainee" | "team";

const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

/** Super-admin reporting: per-trainee or per-team work-log reports with export + print. */
export function ReportsPage() {
  const { notify } = useToast();
  const { data: trainees } = useTrainees();
  const { data: teams } = useMaster("teams");

  const [mode, setMode] = useState<Mode>("trainee");
  const [traineeId, setTraineeId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const target = mode === "trainee" ? traineeId : teamId;
  const selectedTrainee = (trainees ?? []).find((t) => t.id === traineeId);
  const selectedTeam = (teams ?? []).find((t) => t.id === teamId);

  const filters = useMemo(
    () => ({
      traineeId: mode === "trainee" ? traineeId || undefined : undefined,
      teamId: mode === "team" ? teamId || undefined : undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [mode, traineeId, teamId, from, to]
  );

  const { data: logs, isLoading } = useWorkLogs(filters);
  const all = logs ?? [];
  const completed = all.filter((l) => l.status === "complete").length;
  const completionPct = all.length ? Math.round((completed / all.length) * 100) : 0;

  function handleExport() {
    if (!all.length) return notify("Nothing to export", "error");
    exportWorkLogsCsv(all, { withTrainee: mode === "team" });
    notify(`Exported ${all.length} logs`);
  }

  const traineeOptions = (trainees ?? []).map((t) => ({ value: t.id, label: t.full_name }));
  const teamOptions = (teams ?? []).map((t) => ({ value: t.id, label: t.name }));

  const heading =
    mode === "trainee"
      ? selectedTrainee?.full_name ?? "Select a trainee"
      : selectedTeam?.name ?? "Select a team";
  const rangeLabel =
    from || to ? `${from ? formatDate(from) : "start"} – ${to ? formatDate(to) : "today"}` : "All dates";

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Reports" subtitle="Per-trainee and per-team work-log reports." />

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <ChipGroup
            options={[
              { value: "trainee", label: "By trainee" },
              { value: "team", label: "By team" },
            ]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
          {mode === "trainee" ? (
            <div className="min-w-[220px]">
              <span className="mb-1 block text-xs font-medium text-muted">Trainee</span>
              <Select options={traineeOptions} value={traineeId || null} onChange={setTraineeId} searchable placeholder="Select trainee" />
            </div>
          ) : (
            <div className="min-w-[220px]">
              <span className="mb-1 block text-xs font-medium text-muted">Team</span>
              <Select options={teamOptions} value={teamId || null} onChange={setTeamId} placeholder="Select team" />
            </div>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <div className="ml-auto flex items-end gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!all.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()} disabled={!target}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      {!target ? (
        <EmptyState title="Pick a target" hint={`Choose a ${mode} to build a report.`} />
      ) : isLoading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Printable summary header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl">{heading}</h2>
              <p className="text-sm text-muted">
                {mode === "trainee" ? "Trainee report" : "Team report"} · {rangeLabel}
              </p>
            </div>
            <Badge tone={completionPct >= 80 ? "success" : completionPct >= 40 ? "warning" : "default"}>
              {completionPct}% complete
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatTile label="Total logs" value={all.length} icon={<ListChecks className="h-5 w-5" />} />
            <StatTile label="Completed" value={completed} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatTile label="Completion" value={`${completionPct}%`} tone="info" icon={<Percent className="h-5 w-5" />} />
          </div>

          {mode === "trainee" && selectedTrainee && (
            <Card>
              <CardBody>
                <TrainingProgress start={selectedTrainee.start_date} end={selectedTrainee.end_date} />
              </CardBody>
            </Card>
          )}

          <StatusChart logs={all} />

          {!all.length ? (
            <EmptyState title="No logs in range" hint="Try widening the date range." />
          ) : (
            <Card>
              <CardBody className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      {mode === "team" && <th className="px-4 py-3">Trainee</th>}
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Mentor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {all.map((l) => (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(l.work_date)}</td>
                        {mode === "team" && <td className="px-4 py-3">{l.trainee?.full_name ?? "—"}</td>}
                        <td className="px-4 py-3">{l.task_name}</td>
                        <td className="px-4 py-3">{l.location === "home" ? "Home" : "Office"}</td>
                        <td className="px-4 py-3">{STATUS_LABEL[l.status] ?? l.status}</td>
                        <td className="px-4 py-3">{l.mentor?.full_name ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
