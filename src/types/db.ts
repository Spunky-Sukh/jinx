export type AppRole = "super_admin" | "mentor" | "trainee";
export type WorkStatus = "pending" | "in_progress" | "hold" | "failed" | "complete";
export type WorkLocation = "home" | "office";
export type Gender = "male" | "female";

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MasterRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface TrainingPeriod {
  id: string;
  label: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
}

export interface Mentor {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  team_id: string;
  is_active: boolean;
  created_at: string;
  team?: MasterRow;
}

export interface Trainee {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  alt_phone: string | null;
  gender: Gender;
  city: string;
  college_id: string | null;
  course_id: string | null;
  company_id: string | null;
  system_id: string | null;
  team_id: string;
  mentor_id: string;
  training_period_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  // joined
  college?: MasterRow;
  course?: MasterRow;
  company?: MasterRow;
  system?: MasterRow;
  team?: MasterRow;
  mentor?: Mentor;
  training_period?: TrainingPeriod;
}

export interface WorkLog {
  id: string;
  trainee_id: string;
  task_name: string;
  description: string;
  location: WorkLocation;
  work_date: string;
  status: WorkStatus;
  mentor_id: string;
  mentor_remarks: string | null;
  created_at: string;
  updated_at: string;
  trainee?: Trainee;
  mentor?: Mentor;
}

export type MasterTable =
  | "teams"
  | "colleges"
  | "courses"
  | "systems"
  | "companies";
