import { supabase } from "@/lib/supabase";
import type { Paged } from "@/lib/pagination";
import type { Trainee } from "@/types/db";

const SELECT = `
  *,
  college:colleges(*),
  course:courses(*),
  company:companies(*),
  system:systems(*),
  team:teams(*),
  mentor:mentors(*),
  training_period:training_periods(*)
`;

/** Unpaginated list — used for dropdowns and dashboard counts. */
export async function listTrainees(): Promise<Trainee[]> {
  const { data, error } = await supabase
    .from("trainees")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Trainee[];
}

export type TraineeSortBy = "full_name" | "created_at" | "start_date" | "end_date";

export interface TraineeQuery {
  /** Free-text over name / email / city. */
  search?: string;
  status?: "all" | "active" | "inactive";
  teamId?: string;
  mentorId?: string;
  sortBy?: TraineeSortBy;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

function safeSearch(s: string): string {
  return s.replace(/[,()%*]/g, " ").trim();
}

/** Paginated + sorted + filtered list for the admin trainees page. */
export async function listTraineesPage(f: TraineeQuery = {}): Promise<Paged<Trainee>> {
  const page = f.page ?? 0;
  const pageSize = f.pageSize ?? 12;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("trainees")
    .select(SELECT, { count: "exact" })
    .order(f.sortBy ?? "created_at", { ascending: f.sortDir === "asc" })
    .range(from, to);

  if (f.status && f.status !== "all") q = q.eq("is_active", f.status === "active");
  if (f.teamId) q = q.eq("team_id", f.teamId);
  if (f.mentorId) q = q.eq("mentor_id", f.mentorId);
  if (f.search) {
    const s = safeSearch(f.search);
    if (s) q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,city.ilike.%${s}%`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: data as Trainee[], count: count ?? 0 };
}

/** Trainee record for the currently logged-in trainee. */
export async function getMyTrainee(): Promise<Trainee | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("trainees")
    .select(SELECT)
    .eq("profile_id", uid)
    .maybeSingle();
  if (error) throw error;
  return data as Trainee | null;
}

export interface NewTrainee {
  full_name: string;
  email: string;
  password?: string;
  phone: string;
  alt_phone?: string;
  gender: "male" | "female";
  city: string;
  college_id?: string;
  course_id?: string;
  company_id?: string;
  system_id?: string;
  team_id: string;
  mentor_id: string;
  training_period_id: string;
  start_date: string;
  end_date: string;
}

export async function registerTrainee(input: NewTrainee): Promise<Trainee> {
  // 1) Provision auth user (service-role Edge Function) + send welcome email.
  const { data: fn, error: fnErr } = await supabase.functions.invoke("register-user", {
    body: {
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      role: "trainee",
      password: input.password,
    },
  });
  if (fnErr) throw fnErr;
  const profileId = (fn as { user_id: string }).user_id;

  // 2) Insert trainee row.
  const { data, error } = await supabase
    .from("trainees")
    .insert({
      profile_id: profileId,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      alt_phone: input.alt_phone ?? null,
      gender: input.gender,
      city: input.city,
      college_id: input.college_id ?? null,
      course_id: input.course_id ?? null,
      company_id: input.company_id ?? null,
      system_id: input.system_id ?? null,
      team_id: input.team_id,
      mentor_id: input.mentor_id,
      training_period_id: input.training_period_id,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Trainee;
}

/** Fields an admin may edit after a trainee is created. Email is omitted on
 *  purpose — it is the login identity and is owned by Supabase Auth. */
export interface TraineePatch {
  full_name?: string;
  phone?: string;
  alt_phone?: string | null;
  gender?: "male" | "female";
  city?: string;
  college_id?: string | null;
  course_id?: string | null;
  company_id?: string | null;
  system_id?: string | null;
  team_id?: string;
  mentor_id?: string;
  training_period_id?: string;
  start_date?: string;
  end_date?: string;
}

export async function updateTrainee(id: string, patch: TraineePatch): Promise<Trainee> {
  const { data, error } = await supabase
    .from("trainees")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Trainee;
}

export async function setTraineeActive(id: string, is_active: boolean) {
  const { error } = await supabase.from("trainees").update({ is_active }).eq("id", id);
  if (error) throw error;
}
