import type { TraineeSortBy } from "./api/trainees.api";

export const TRAINEE_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "start", label: "Start date" },
  { value: "end", label: "End date" },
];

export const TRAINEE_SORTS: Record<string, { sortBy: TraineeSortBy; sortDir: "asc" | "desc" }> = {
  newest: { sortBy: "created_at", sortDir: "desc" },
  name_asc: { sortBy: "full_name", sortDir: "asc" },
  name_desc: { sortBy: "full_name", sortDir: "desc" },
  start: { sortBy: "start_date", sortDir: "asc" },
  end: { sortBy: "end_date", sortDir: "asc" },
};
