import { supabase } from "@/lib/supabase";
import type { Mentor } from "@/types/db";

const SELECT = "*, team:teams(*)";

export async function listMentors(): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select(SELECT)
    .order("full_name");
  if (error) throw error;
  return data as Mentor[];
}

export async function listMentorsByTeam(teamId: string): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select(SELECT)
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return data as Mentor[];
}

export interface NewMentor {
  full_name: string;
  email: string;
  phone?: string;
  team_id: string;
  password?: string;
}

/**
 * Registers a mentor: provisions the auth user via the `register-user` Edge
 * Function (service-role), then inserts the mentor master row linked to the
 * created profile. Requires the function to be deployed.
 */
export async function registerMentor(input: NewMentor): Promise<Mentor> {
  const { data: fn, error: fnErr } = await supabase.functions.invoke("register-user", {
    body: {
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      role: "mentor",
      password: input.password,
    },
  });
  if (fnErr) throw fnErr;
  const profileId = (fn as { user_id: string }).user_id;

  const { data, error } = await supabase
    .from("mentors")
    .insert({
      profile_id: profileId,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone ?? null,
      team_id: input.team_id,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Mentor;
}

/** Fields an admin may edit after a mentor is created. Email is omitted — it is
 *  the login identity and is owned by Supabase Auth. */
export interface MentorPatch {
  full_name?: string;
  phone?: string | null;
  team_id?: string;
}

export async function updateMentor(id: string, patch: MentorPatch): Promise<Mentor> {
  const { data, error } = await supabase
    .from("mentors")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Mentor;
}

export async function setMentorActive(id: string, is_active: boolean) {
  const { error } = await supabase.from("mentors").update({ is_active }).eq("id", id);
  if (error) throw error;
}
