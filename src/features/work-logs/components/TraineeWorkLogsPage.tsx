import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, EmptyState, Spinner, useToast } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, type FiltersValue } from "@/features/dashboard/components/DashboardBits";
import { useMyTrainee } from "@/features/trainees/hooks/useTrainees";
import { useWorkLogs, useWorkLogMutations } from "@/features/work-logs/hooks/useWorkLogs";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";
import { WorkLogFormModal } from "@/features/work-logs/components/WorkLogFormModal";
import type { WorkLog } from "@/types/db";

const emptyFilters: FiltersValue = { status: "", location: "", from: "", to: "" };

export function TraineeWorkLogsPage() {
  const { notify } = useToast();
  const { data: trainee, isLoading: loadingTrainee } = useMyTrainee();
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkLog | null>(null);
  const { remove } = useWorkLogMutations();

  const queryFilters = useMemo(
    () => ({
      traineeId: trainee?.id,
      status: filters.status || undefined,
      location: filters.location || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [trainee?.id, filters]
  );

  const { data: logs, isLoading } = useWorkLogs(queryFilters);

  if (loadingTrainee) return <Spinner />;
  if (!trainee)
    return <EmptyState title="No trainee profile found" hint="Contact your administrator." />;

  return (
    <>
      <PageHeader
        title="My Work"
        subtitle="Log your daily tasks. Completed entries are locked."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add work log
          </Button>
        }
      />

      <div className="mb-6">
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !logs?.length ? (
        <EmptyState title="No work logs yet" hint="Add your first entry to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {logs.map((log) => (
            <WorkLogCard
              key={log.id}
              log={log}
              onEdit={(l) => {
                setEditing(l);
                setOpen(true);
              }}
              onDelete={async (l) => {
                try {
                  await remove.mutateAsync(l.id);
                  notify("Deleted");
                } catch (e) {
                  notify(e instanceof Error ? e.message : "Failed", "error");
                }
              }}
            />
          ))}
        </div>
      )}

      <WorkLogFormModal open={open} onClose={() => setOpen(false)} trainee={trainee} editing={editing} />
    </>
  );
}
