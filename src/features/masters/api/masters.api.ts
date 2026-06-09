import { supabase } from "@/lib/supabase";
import type { MasterRow, MasterTable, TrainingPeriod } from "@/types/db";

// ---- Generic name-based masters (teams, colleges, courses, systems, companies)
export async function listMaster(table: MasterTable): Promise<MasterRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data as MasterRow[];
}

export async function createMaster(table: MasterTable, name: string) {
  const { error } = await supabase.from(table).insert({ name });
  if (error) throw error;
}

export async function updateMaster(
  table: MasterTable,
  id: string,
  patch: Partial<Pick<MasterRow, "name" | "is_active">>
) {
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteMaster(table: MasterTable, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// ---- Training periods master (label + duration_days)
export async function listTrainingPeriods(): Promise<TrainingPeriod[]> {
  const { data, error } = await supabase
    .from("training_periods")
    .select("*")
    .order("duration_days", { ascending: true });
  if (error) throw error;
  return data as TrainingPeriod[];
}

export async function createTrainingPeriod(label: string, duration_days: number) {
  const { error } = await supabase.from("training_periods").insert({ label, duration_days });
  if (error) throw error;
}

export async function updateTrainingPeriod(
  id: string,
  patch: Partial<Pick<TrainingPeriod, "label" | "duration_days" | "is_active">>
) {
  const { error } = await supabase.from("training_periods").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTrainingPeriod(id: string) {
  const { error } = await supabase.from("training_periods").delete().eq("id", id);
  if (error) throw error;
}
