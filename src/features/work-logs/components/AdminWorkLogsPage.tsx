import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button, EmptyState, Pagination, Select, Spinner, useToast } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, type FiltersValue } from "@/features/dashboard/components/DashboardBits";
import { useWorkLogsPage } from "@/features/work-logs/hooks/useWorkLogs";
import { listWorkLogs } from "@/features/work-logs/api/workLogs.api";
import { WORKLOG_SORT_OPTIONS, WORKLOG_SORTS } from "@/features/work-logs/constants";
import { WorkLogCard } from "@/features/work-logs/components/WorkLogCard";
import { useTrainees } from "@/features/trainees/hooks/useTrainees";
import { useMentors } from "@/features/mentors/hooks/useMentors";
import { useMaster } from "@/features/masters/hooks/useMasters";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { exportWorkLogsCsv } from "@/features/work-logs/export";
import { PAGE_SIZE } from "@/lib/pagination";

const emptyFilters: FiltersValue = { status: "", location: "", from: "", to: "" };

/** Super-admin: read-only view of every trainee's work logs. */
export function AdminWorkLogsPage() {
  const { notify } = useToast();
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [sort, setSort] = useState("date_desc");
  const [traineeId, setTraineeId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const { data: trainees } = useTrainees();
  const { data: mentors } = useMentors();
  const { data: teams } = useMaster("teams");

  const query = useMemo(() => {
    const s = WORKLOG_SORTS[sort];
    return {
      traineeId: traineeId || undefined,
      teamId: teamId || undefined,
      mentorId: mentorId || undefined,
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
  }, [traineeId, teamId, mentorId, filters, search, sort, page]);

  const { data, isLoading, isFetching } = useWorkLogsPage(query);
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;

  // Any filter change resets to the first page.
  const onFilters = (v: FiltersValue) => { setFilters(v); setPage(0); };
  const onSearch = (v: string) => { setSearchInput(v); setPage(0); };
  const onSort = (v: string) => { setSort(v); setPage(0); };
  const onTrainee = (v: string) => { setTraineeId(v); setPage(0); };
  const onTeam = (v: string) => { setTeamId(v); setPage(0); };
  const onMentor = (v: string) => { setMentorId(v); setPage(0); };

  async function handleExport() {
    setExporting(true);
    try {
      // Export every row matching the current filters, not just this page.
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

  const traineeOptions = [
    { value: "", label: "All trainees" },
    ...(trainees ?? []).map((t) => ({ value: t.id, label: t.full_name })),
  ];
  const teamOptions = [
    { value: "", label: "All teams" },
    ...(teams ?? []).map((t) => ({ value: t.id, label: t.name })),
  ];
  const mentorOptions = [
    { value: "", label: "All mentors" },
    ...(mentors ?? []).map((m) => ({ value: m.id, label: m.full_name })),
  ];

  return (
    <>
      <PageHeader
        title="Work Logs"
        subtitle="Read-only view across all trainees."
        action={
          <Button variant="outline" onClick={handleExport} loading={exporting}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <span className="mb-1 block text-xs font-medium text-muted">Trainee</span>
          <Select options={traineeOptions} value={traineeId || ""} onChange={onTrainee} searchable />
        </div>
        <div className="min-w-[150px]">
          <span className="mb-1 block text-xs font-medium text-muted">Team</span>
          <Select options={teamOptions} value={teamId || ""} onChange={onTeam} />
        </div>
        <div className="min-w-[170px]">
          <span className="mb-1 block text-xs font-medium text-muted">Mentor</span>
          <Select options={mentorOptions} value={mentorId || ""} onChange={onMentor} searchable />
        </div>
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
        <EmptyState title="No work logs" hint="No entries match these filters." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((log) => (
              <WorkLogCard key={log.id} log={log} showTrainee />
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </>
  );
}
