import { useMemo, useState } from "react";
import { Pencil, Power, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  ChipGroup,
  EmptyState,
  Input,
  Pagination,
  Select,
  Spinner,
  useToast,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTraineesPage, useTraineeMutations } from "@/features/trainees/hooks/useTrainees";
import { TRAINEE_SORT_OPTIONS, TRAINEE_SORTS } from "@/features/trainees/constants";
import { TraineeFormModal } from "@/features/trainees/components/TraineeFormModal";
import { useMentors } from "@/features/mentors/hooks/useMentors";
import { useMaster } from "@/features/masters/hooks/useMasters";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { PAGE_SIZE } from "@/lib/pagination";
import { formatDate } from "@/lib/date";
import type { Trainee } from "@/types/db";

type StatusFilter = "all" | "active" | "inactive";

export function AdminTraineesPage() {
  const { notify } = useToast();
  const { setActive } = useTraineeMutations();
  const { data: teams } = useMaster("teams");
  const { data: mentors } = useMentors();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Trainee | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [teamId, setTeamId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);

  const query = useMemo(() => {
    const s = TRAINEE_SORTS[sort];
    return {
      search: search || undefined,
      status,
      teamId: teamId || undefined,
      mentorId: mentorId || undefined,
      sortBy: s.sortBy,
      sortDir: s.sortDir,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [search, status, teamId, mentorId, sort, page]);

  const { data, isLoading, isFetching } = useTraineesPage(query);
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;

  // Any filter change resets to the first page.
  const onSearch = (v: string) => { setSearchInput(v); setPage(0); };
  const onStatus = (v: StatusFilter) => { setStatus(v); setPage(0); };
  const onTeam = (v: string) => { setTeamId(v); setPage(0); };
  const onMentor = (v: string) => { setMentorId(v); setPage(0); };
  const onSort = (v: string) => { setSort(v); setPage(0); };

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }
  function openEdit(t: Trainee) {
    setEditTarget(t);
    setFormOpen(true);
  }
  async function toggleActive(t: Trainee) {
    try {
      await setActive.mutateAsync({ id: t.id, is_active: !t.is_active });
      notify(t.is_active ? "Trainee deactivated" : "Trainee reactivated");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed to update status", "error");
    }
  }

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
        title="Trainees"
        subtitle="Register and manage trainees."
        action={
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Register trainee
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Search</span>
          <Input placeholder="Name, email or city…" value={searchInput} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <div className="min-w-[150px]">
          <span className="mb-1 block text-xs font-medium text-muted">Team</span>
          <Select options={teamOptions} value={teamId || ""} onChange={onTeam} />
        </div>
        <div className="min-w-[170px]">
          <span className="mb-1 block text-xs font-medium text-muted">Mentor</span>
          <Select options={mentorOptions} value={mentorId || ""} onChange={onMentor} searchable />
        </div>
        <div className="min-w-[150px]">
          <span className="mb-1 block text-xs font-medium text-muted">Sort</span>
          <Select options={TRAINEE_SORT_OPTIONS} value={sort} onChange={onSort} />
        </div>
      </div>

      <div className="mb-4">
        <ChipGroup
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "all", label: "All" },
          ]}
          value={status}
          onChange={(v) => onStatus(v as StatusFilter)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !rows.length ? (
        <EmptyState title="No trainees" hint="No trainees match these filters." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((t) => (
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
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={t.is_active ? "subtle" : "primary"}
                      onClick={() => toggleActive(t)}
                      loading={setActive.isPending && setActive.variables?.id === t.id}
                    >
                      <Power className="h-3.5 w-3.5" /> {t.is_active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      <TraineeFormModal open={formOpen} onClose={() => setFormOpen(false)} trainee={editTarget} />
    </>
  );
}
