import { CheckCircle2, Clock, GraduationCap, ListChecks, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui";
import { StatTile } from "./DashboardBits";
import { StatusChart } from "./StatusChart";
import { useWorkLogs } from "@/features/work-logs/hooks/useWorkLogs";
import { useTrainees } from "@/features/trainees/hooks/useTrainees";

/** Mentor dashboard — scoped to own trainees by RLS. */
export function MentorDashboard() {
  const { data: logs, isLoading } = useWorkLogs();
  const all = logs ?? [];
  const c = (s: string) => all.filter((l) => l.status === s).length;
  const trainees = new Set(all.map((l) => l.trainee_id)).size;

  return (
    <>
      <PageHeader title="Mentor Dashboard" subtitle="Your trainees and their progress." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Trainees" value={trainees} icon={<GraduationCap className="h-5 w-5" />} />
        <StatTile label="Total logs" value={all.length} icon={<ListChecks className="h-5 w-5" />} />
        <StatTile label="Complete" value={c("complete")} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatTile label="Failed" value={c("failed")} tone="danger" icon={<XCircle className="h-5 w-5" />} />
      </div>
      {isLoading ? <Spinner /> : <StatusChart logs={all} />}
    </>
  );
}

/** Super-admin dashboard — sees everything. */
export function AdminDashboard() {
  const { data: trainees, isLoading: lt } = useTrainees();
  const { data: logs, isLoading: ll } = useWorkLogs();
  const all = logs ?? [];
  const c = (s: string) => all.filter((l) => l.status === s).length;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Program-wide overview." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Trainees" value={lt ? "…" : trainees?.length ?? 0} icon={<GraduationCap className="h-5 w-5" />} />
        <StatTile label="Total logs" value={all.length} icon={<ListChecks className="h-5 w-5" />} />
        <StatTile label="Complete" value={c("complete")} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatTile label="Pending" value={c("pending")} icon={<Clock className="h-5 w-5" />} />
      </div>
      {ll ? <Spinner /> : <StatusChart logs={all} />}
    </>
  );
}
