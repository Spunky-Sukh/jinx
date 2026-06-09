import { supabase } from "@/lib/supabase";
import type { Paged } from "@/lib/pagination";
import type { WorkLog, WorkLocation, WorkStatus } from "@/types/db";

// Inner-join the trainee so we can both read its name and filter logs by the
// trainee's team (work_logs has no team_id of its own). trainee_id is NOT NULL,
// so the inner join never drops rows.
const SELECT =
  "*, trainee:trainees!inner(id, full_name, team_id), mentor:mentors(id, full_name)";

export interface WorkLogFilters {
  status?: WorkStatus;
  location?: WorkLocation;
  from?: string;
  to?: string;
  traineeId?: string;
  mentorId?: string;
  teamId?: string;
  /** Free-text search over task name + description. */
  search?: string;
}

export type WorkLogSortBy = "work_date" | "status";

export interface WorkLogQuery extends WorkLogFilters {
  sortBy?: WorkLogSortBy;
  sortDir?: "asc" | "desc";
  /** Zero-based page index. */
  page?: number;
  pageSize?: number;
}

// PostgREST `.or()` is comma/paren-delimited; strip characters that would break it.
function safeSearch(s: string): string {
  return s.replace(/[,()%*]/g, " ").trim();
}

type WorkLogBuilder = ReturnType<ReturnType<typeof supabase.from>["select"]>;

function applyFilters(q: WorkLogBuilder, f: WorkLogFilters): WorkLogBuilder {
  if (f.status) q = q.eq("status", f.status);
  if (f.location) q = q.eq("location", f.location);
  if (f.from) q = q.gte("work_date", f.from);
  if (f.to) q = q.lte("work_date", f.to);
  if (f.traineeId) q = q.eq("trainee_id", f.traineeId);
  if (f.mentorId) q = q.eq("mentor_id", f.mentorId);
  if (f.teamId) q = q.eq("trainee.team_id", f.teamId);
  if (f.search) {
    const s = safeSearch(f.search);
    if (s) q = q.or(`task_name.ilike.%${s}%,description.ilike.%${s}%`);
  }
  return q;
}

/**
 * RLS scopes rows automatically by role; filters narrow further.
 * Unpaginated — used for dashboards and exports (capped at Supabase's row limit).
 */
export async function listWorkLogs(f: WorkLogFilters = {}): Promise<WorkLog[]> {
  let q = supabase.from("work_logs").select(SELECT).order("work_date", { ascending: false });
  q = applyFilters(q, f);
  const { data, error } = await q;
  if (error) throw error;
  return data as WorkLog[];
}

/** Paginated + sorted variant for list views. */
export async function listWorkLogsPage(f: WorkLogQuery = {}): Promise<Paged<WorkLog>> {
  const page = f.page ?? 0;
  const pageSize = f.pageSize ?? 12;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("work_logs")
    .select(SELECT, { count: "exact" })
    .order(f.sortBy ?? "work_date", { ascending: f.sortDir === "asc" })
    .range(from, to);
  q = applyFilters(q, f);

  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: data as WorkLog[], count: count ?? 0 };
}

export interface NewWorkLog {
  trainee_id: string;
  task_name: string;
  description: string;
  location: WorkLocation;
  work_date: string;
  status: WorkStatus;
  mentor_id: string;
}

export async function createWorkLog(input: NewWorkLog) {
  const { error } = await supabase.from("work_logs").insert(input);
  if (error) throw error;
}

export type WorkLogPatch = Partial<
  Pick<WorkLog, "task_name" | "description" | "location" | "work_date" | "status" | "mentor_id">
>;

export async function updateWorkLog(id: string, patch: WorkLogPatch) {
  const { error } = await supabase.from("work_logs").update(patch).eq("id", id);
  if (error) throw error;
}

/** Mentor review: set status + remarks on a trainee's log. */
export async function reviewWorkLog(id: string, status: WorkStatus, remarks: string) {
  const { error } = await supabase
    .from("work_logs")
    .update({ status, mentor_remarks: remarks })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteWorkLog(id: string) {
  const { error } = await supabase.from("work_logs").delete().eq("id", id);
  if (error) throw error;
}
