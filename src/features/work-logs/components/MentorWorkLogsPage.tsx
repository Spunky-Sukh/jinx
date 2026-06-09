import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button, EmptyState, Pagination, Spinner, useToast } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, type FiltersValue } from "@/features/dashboard/components/DashboardBits";
import { useWorkLogsPage } from "@/features/work-logs/hooks/useWorkLogs";
import { listWorkLogs } from "@/features/work-logs/api/workLogs.api";
import { WORKLOG_SORT_OPTIONS, WORKLOG_SORTS } from "@/features/work-logs/constants";
import { exportWorkLogsCsv } from "@/features/work-logs/export";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";
import { ReviewModal } from "@/features/work-logs/components/ReviewModal";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { PAGE_SIZE } from "@/lib/pagination";
import type { WorkLog } from "@/types/db";

const emptyFilters: FiltersValue = { status: "", location: "", from: "", to: "" };

/** Mentor sees only their own trainees' logs (enforced by RLS). */
export function MentorWorkLogsPage() {
  const { notify } = useToast();
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [reviewing, setReviewing] = useState<WorkLog | null>(null);

  const query = useMemo(() => {
    const s = WORKLOG_SORTS[sort];
    return {
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
  }, [filters, search, sort, page]);

  const { data, isLoading, isFetching } = useWorkLogsPage(query);
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;

  const onFilters = (v: FiltersValue) => { setFilters(v); setPage(0); };
  const onSearch = (v: string) => { setSearchInput(v); setPage(0); };
  const onSort = (v: string) => { setSort(v); setPage(0); };

  async function handleExport() {
    setExporting(true);
    try {
      const all = await listWorkLogs(query);
      if (!all.length) return notify("Nothing to export for these filters", "error");
      exportWorkLogsCsv(all, { withTrainee: true });
      notify(`Exported ${all.length} logs`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Trainee Work"
        subtitle="Review and mark your trainees' work."
        action={
          <Button variant="outline" onClick={handleExport} loading={exporting}>
            <Download className="h-4 w-4" /> Export CSV
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
        <EmptyState title="No work logs" hint="Your trainees haven't logged work matching these filters." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((log) => (
              <WorkLogCard key={log.id} log={log} showTrainee onReview={setReviewing} />
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      <ReviewModal open={!!reviewing} onClose={() => setReviewing(null)} log={reviewing} />
    </>
  );
}
