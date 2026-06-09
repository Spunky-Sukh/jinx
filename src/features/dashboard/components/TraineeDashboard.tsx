import { CheckCircle2, Clock, ListChecks, PauseCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Spinner, Card, CardBody } from "@/components/ui";
import { StatTile } from "./DashboardBits";
import { StatusChart } from "./StatusChart";
import { useMyTrainee } from "@/features/trainees/hooks/useTrainees";
import { useWorkLogs } from "@/features/work-logs/hooks/useWorkLogs";
import { formatDate } from "@/lib/date";

export function TraineeDashboard() {
  const { data: trainee, isLoading: lt } = useMyTrainee();
  const { data: logs, isLoading: ll } = useWorkLogs(trainee ? { traineeId: trainee.id } : {});

  if (lt) return <Spinner />;
  if (!trainee) return <EmptyState title="No trainee profile" hint="Contact your administrator." />;

  const all = logs ?? [];
  const count = (s: string) => all.filter((l) => l.status === s).length;

  return (
    <>
      <PageHeader title={`Welcome, ${trainee.full_name.split(" ")[0]}`} subtitle="Your training at a glance." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Total logs" value={all.length} icon={<ListChecks className="h-5 w-5" />} />
        <StatTile label="Complete" value={count("complete")} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatTile label="Pending" value={count("pending")} icon={<Clock className="h-5 w-5" />} />
        <StatTile label="Hold" value={count("hold")} tone="warning" icon={<PauseCircle className="h-5 w-5" />} />
        <StatTile label="Failed" value={count("failed")} tone="danger" icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {ll ? <Spinner /> : <StatusChart logs={all} />}
        </div>
        <Card>
          <CardBody className="flex flex-col gap-3 text-sm">
            <h3 className="font-display text-lg">Training details</h3>
            <Row label="Team" value={trainee.team?.name} />
            <Row label="Mentor" value={trainee.mentor?.full_name} />
            <Row label="Course" value={trainee.course?.name} />
            <Row label="Period" value={trainee.training_period?.label} />
            <Row label="Start" value={formatDate(trainee.start_date)} />
            <Row label="End" value={formatDate(trainee.end_date)} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
