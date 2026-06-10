import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { Badge, Card, CardBody, EmptyState, Input, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrainingProgress } from "@/features/trainees/components/TrainingProgress";
import { useMyTrainees } from "@/features/trainees/hooks/useTrainees";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

/** Mentor view: the trainees assigned to me, each linking to a status page. */
export function MentorTraineesPage() {
  const { data, isLoading } = useMyTrainees();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 250).trim().toLowerCase();

  const trainees = useMemo(() => {
    const all = data ?? [];
    if (!search) return all;
    return all.filter(
      (t) =>
        t.full_name.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search) ||
        t.city.toLowerCase().includes(search)
    );
  }, [data, search]);

  return (
    <>
      <PageHeader title="My Trainees" subtitle="Trainees assigned to you — open one to see their status." />

      <div className="mb-6 max-w-sm">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email or city…"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : !trainees.length ? (
        <EmptyState
          title={data?.length ? "No matches" : "No trainees assigned"}
          hint={data?.length ? "Try a different search." : "An admin assigns trainees to you."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trainees.map((t) => (
            <Link key={t.id} to={`/mentor/trainees/${t.id}`} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{t.full_name}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="h-3 w-3" /> {t.city}
                      </p>
                    </div>
                    {!t.is_active && <Badge tone="warning">Inactive</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {t.team && <Badge tone="default">{t.team.name}</Badge>}
                    {t.training_period && <Badge tone="default">{t.training_period.label}</Badge>}
                  </div>

                  <div className="mt-auto">
                    <TrainingProgress start={t.start_date} end={t.end_date} />
                  </div>

                  <span className="inline-flex items-center gap-1 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View status <ChevronRight className="h-4 w-4" />
                  </span>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
