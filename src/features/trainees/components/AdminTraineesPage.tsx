import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Badge, Button, Card, CardBody, EmptyState, Input, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTrainees } from "@/features/trainees/hooks/useTrainees";
import { TraineeRegistrationModal } from "@/features/trainees/components/TraineeRegistrationModal";
import { formatDate } from "@/lib/date";

export function AdminTraineesPage() {
  const { data: trainees, isLoading } = useTrainees();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = (trainees ?? []).filter(
    (t) =>
      t.full_name.toLowerCase().includes(q.toLowerCase()) ||
      t.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Trainees"
        subtitle="Register and manage trainees."
        action={
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Register trainee
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !filtered.length ? (
        <EmptyState title="No trainees" hint="Register your first trainee." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{t.full_name}</p>
                    <p className="text-xs text-muted">{t.email}</p>
                  </div>
                  {!t.is_active && <Badge tone="danger">Inactive</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="info">{t.team?.name}</Badge>
                  {t.course && <Badge>{t.course.name}</Badge>}
                  {t.training_period && <Badge tone="primary">{t.training_period.label}</Badge>}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted">
                  <span>Mentor: {t.mentor?.full_name ?? "—"}</span>
                  <span>City: {t.city}</span>
                  <span>Start: {formatDate(t.start_date)}</span>
                  <span>End: {formatDate(t.end_date)}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <TraineeRegistrationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
