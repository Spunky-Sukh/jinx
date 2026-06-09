import { useMemo, useState } from "react";
import { EmptyState, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, type FiltersValue } from "@/features/dashboard/components/DashboardBits";
import { useWorkLogs } from "@/features/work-logs/hooks/useWorkLogs";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";
import { ReviewModal } from "@/features/work-logs/components/ReviewModal";
import type { WorkLog } from "@/types/db";

const emptyFilters: FiltersValue = { status: "", location: "", from: "", to: "" };

/** Mentor sees only their own trainees' logs (enforced by RLS). */
export function MentorWorkLogsPage() {
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [reviewing, setReviewing] = useState<WorkLog | null>(null);

  const queryFilters = useMemo(
    () => ({
      status: filters.status || undefined,
      location: filters.location || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [filters]
  );
  const { data: logs, isLoading } = useWorkLogs(queryFilters);

  return (
    <>
      <PageHeader title="Trainee Work" subtitle="Review and mark your trainees' work." />
      <div className="mb-6">
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !logs?.length ? (
        <EmptyState title="No work logs" hint="Your trainees haven't logged work matching these filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {logs.map((log) => (
            <WorkLogCard key={log.id} log={log} showTrainee onReview={setReviewing} />
          ))}
        </div>
      )}

      <ReviewModal open={!!reviewing} onClose={() => setReviewing(null)} log={reviewing} />
    </>
  );
}
