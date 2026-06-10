import { Card, CardBody, EmptyState, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrainingProgress } from "@/features/trainees/components/TrainingProgress";
import { ChangePasswordCard } from "@/features/auth/components/ChangePasswordCard";
import { useMyTrainee } from "@/features/trainees/hooks/useTrainees";
import { formatDate } from "@/lib/date";

/** Trainee self-service: view own profile + change password. */
export function TraineeProfilePage() {
  const { data: trainee, isLoading } = useMyTrainee();

  if (isLoading) return <Spinner />;

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your details and account settings." />

      {!trainee ? (
        <EmptyState title="No trainee profile" hint="Contact your administrator." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardBody className="flex flex-col gap-3">
                <h3 className="font-display text-lg">Personal</h3>
                <Row label="Full name" value={trainee.full_name} />
                <Row label="Email" value={trainee.email} />
                <Row label="Phone" value={trainee.phone} />
                <Row label="Alt. phone" value={trainee.alt_phone ?? undefined} />
                <Row label="Gender" value={trainee.gender === "male" ? "Male" : "Female"} />
                <Row label="City" value={trainee.city} />
                <Row label="College" value={trainee.college?.name} />
                <Row label="Course" value={trainee.course?.name} />
                <Row label="Company" value={trainee.company?.name} />
                <Row label="System" value={trainee.system?.name} />
              </CardBody>
            </Card>

            <ChangePasswordCard />
          </div>

          <Card>
            <CardBody className="flex flex-col gap-3">
              <h3 className="font-display text-lg">Training</h3>
              <TrainingProgress start={trainee.start_date} end={trainee.end_date} />
              <Row label="Team" value={trainee.team?.name} />
              <Row label="Mentor" value={trainee.mentor?.full_name} />
              <Row label="Period" value={trainee.training_period?.label} />
              <Row label="Start" value={formatDate(trainee.start_date)} />
              <Row label="End" value={formatDate(trainee.end_date)} />
            </CardBody>
          </Card>
        </div>
      )}
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
