import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Clock, ListChecks, PauseCircle, XCircle } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, EmptyState, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/features/dashboard/components/DashboardBits";
import { StatusChart } from "@/features/dashboard/components/StatusChart";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";
import { TrainingProgress } from "@/features/trainees/components/TrainingProgress";
import { useTrainee } from "@/features/trainees/hooks/useTrainees";
import { useWorkLogs } from "@/features/work-logs/hooks/useWorkLogs";
import { formatDate } from "@/lib/date";

/** Mentor view of one assigned trainee: profile + training status + work history. */
export function MentorTraineeDetailPage() {
  const { id } = useParams();
  const { data: trainee, isLoading } = useTrainee(id);
  const { data: logs, isLoading: ll } = useWorkLogs(id ? { traineeId: id } : {});

  if (isLoading) return <Spinner />;
  if (!trainee)
    return (
      <EmptyState
        title="Trainee not found"
        hint="They may not be assigned to you, or no longer exist."
      />
    );

  const all = logs ?? [];
  const count = (s: string) => all.filter((l) => l.status === s).length;

  return (
    <>
      <Link
        to="/mentor/trainees"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my trainees
      </Link>

      <PageHeader
        title={trainee.full_name}
        subtitle={`${trainee.team?.name ?? "—"} · ${trainee.training_period?.label ?? "—"}`}
        action={trainee.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Inactive</Badge>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Total logs" value={all.length} icon={<ListChecks className="h-5 w-5" />} />
        <StatTile label="Complete" value={count("complete")} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatTile label="Pending" value={count("pending")} icon={<Clock className="h-5 w-5" />} />
        <StatTile label="Hold" value={count("hold")} tone="warning" icon={<PauseCircle className="h-5 w-5" />} />
        <StatTile label="Failed" value={count("failed")} tone="danger" icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {ll ? <Spinner /> : <StatusChart logs={all} />}

          <Card>
            <CardHeader>
              <h3 className="font-display text-lg">Work history</h3>
            </CardHeader>
            <CardBody>
              {ll ? (
                <Spinner />
              ) : !all.length ? (
                <EmptyState title="No work logs yet" hint="This trainee hasn't logged any work." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {all.map((log) => (
                    <WorkLogCard key={log.id} log={log} showTrainee={false} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardBody className="flex flex-col gap-3">
              <h3 className="font-display text-lg">Training</h3>
              <TrainingProgress start={trainee.start_date} end={trainee.end_date} />
              <Row label="Start" value={formatDate(trainee.start_date)} />
              <Row label="End" value={formatDate(trainee.end_date)} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-3">
              <h3 className="font-display text-lg">Profile</h3>
              <Row label="Email" value={trainee.email} />
              <Row label="Phone" value={trainee.phone} />
              <Row label="Alt. phone" value={trainee.alt_phone ?? undefined} />
              <Row label="Gender" value={trainee.gender === "male" ? "Male" : "Female"} />
              <Row label="City" value={trainee.city} />
              <Row label="College" value={trainee.college?.name} />
              <Row label="Course" value={trainee.course?.name} />
              <Row label="Company" value={trainee.company?.name} />
              <Row label="System" value={trainee.system?.name} />
              <Row label="Mentor" value={trainee.mentor?.full_name} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="truncate text-right font-medium">{value || "—"}</span>
    </div>
  );
}
