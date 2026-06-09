import { useMemo, useState } from "react";
import { EmptyState, Spinner, Select } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, type FiltersValue } from "@/features/dashboard/components/DashboardBits";
import { useWorkLogs } from "@/features/work-logs/hooks/useWorkLogs";
import { useTrainees } from "@/features/trainees/hooks/useTrainees";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";

const emptyFilters: FiltersValue = { status: "", location: "", from: "", to: "" };

/** Super-admin: read-only view of every trainee's work logs. */
export function AdminWorkLogsPage() {
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [traineeId, setTraineeId] = useState<string>("");
  const { data: trainees } = useTrainees();

  const queryFilters = useMemo(
    () => ({
      traineeId: traineeId || undefined,
      status: filters.status || undefined,
      location: filters.location || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [traineeId, filters]
  );
  const { data: logs, isLoading } = useWorkLogs(queryFilters);

  const traineeOptions = [
    { value: "", label: "All trainees" },
    ...(trainees ?? []).map((t) => ({ value: t.id, label: t.full_name })),
  ];

  return (
    <>
      <PageHeader title="Work Logs" subtitle="Read-only view across all trainees." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <span className="mb-1 block text-xs font-medium text-muted">Trainee</span>
          <Select options={traineeOptions} value={traineeId || ""} onChange={setTraineeId} searchable />
        </div>
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !logs?.length ? (
        <EmptyState title="No work logs" hint="No entries match these filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {logs.map((log) => (
            <WorkLogCard key={log.id} log={log} showTrainee />
          ))}
        </div>
      )}
    </>
  );
}
