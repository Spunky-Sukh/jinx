import { supabase } from "@/lib/supabase";
import type { WorkLog, WorkLocation, WorkStatus } from "@/types/db";

const SELECT = "*, trainee:trainees(id, full_name), mentor:mentors(id, full_name)";

export interface WorkLogFilters {
  status?: WorkStatus;
  location?: WorkLocation;
  from?: string;
  to?: string;
  traineeId?: string;
  mentorId?: string;
}

/** RLS scopes rows automatically by role; filters narrow further. */
export async function listWorkLogs(f: WorkLogFilters = {}): Promise<WorkLog[]> {
  let q = supabase.from("work_logs").select(SELECT).order("work_date", { ascending: false });
  if (f.status) q = q.eq("status", f.status);
  if (f.location) q = q.eq("location", f.location);
  if (f.from) q = q.gte("work_date", f.from);
  if (f.to) q = q.lte("work_date", f.to);
  if (f.traineeId) q = q.eq("trainee_id", f.traineeId);
  if (f.mentorId) q = q.eq("mentor_id", f.mentorId);
  const { data, error } = await q;
  if (error) throw error;
  return data as WorkLog[];
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
