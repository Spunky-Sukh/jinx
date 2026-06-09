import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, EmptyState, Pagination, Spinner, useToast } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, type FiltersValue } from "@/features/dashboard/components/DashboardBits";
import { useMyTrainee } from "@/features/trainees/hooks/useTrainees";
import { useWorkLogsPage, useWorkLogMutations } from "@/features/work-logs/hooks/useWorkLogs";
import { WORKLOG_SORT_OPTIONS, WORKLOG_SORTS } from "@/features/work-logs/constants";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";
import { WorkLogFormModal } from "@/features/work-logs/components/WorkLogFormModal";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { PAGE_SIZE } from "@/lib/pagination";
import type { WorkLog } from "@/types/db";

const emptyFilters: FiltersValue = { status: "", location: "", from: "", to: "" };

export function TraineeWorkLogsPage() {
  const { notify } = useToast();
  const { data: trainee, isLoading: loadingTrainee } = useMyTrainee();
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkLog | null>(null);
  const { remove } = useWorkLogMutations();

  const query = useMemo(() => {
    const s = WORKLOG_SORTS[sort];
    return {
      traineeId: trainee?.id,
      status: filters.status || undefined,
      location: filters.location || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      search: search || undefined,
      sortBy: s.sortBy,
      sortDir: s.sortDir,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [trainee?.id, filters, search, sort, page]);

  const { data, isLoading, isFetching } = useWorkLogsPage(query);
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;

  const onFilters = (v: FiltersValue) => { setFilters(v); setPage(0); };
  const onSearch = (v: string) => { setSearchInput(v); setPage(0); };
  const onSort = (v: string) => { setSort(v); setPage(0); };

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
        <FilterBar
          value={filters}
          onChange={onFilters}
          search={searchInput}
          onSearch={onSearch}
          sort={sort}
          onSort={onSort}
          sortOptions={WORKLOG_SORT_OPTIONS}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !rows.length ? (
        <EmptyState title="No work logs yet" hint="Add your first entry to get started." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((log) => (
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
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      <WorkLogFormModal open={open} onClose={() => setOpen(false)} trainee={trainee} editing={editing} />
    </>
  );
}
