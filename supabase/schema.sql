-- =====================================================================
--  JINX — Trainee Work Tracker : Postgres / Supabase schema
--  Run in the Supabase SQL editor (or `supabase db push`).
--  Idempotent-ish: safe to re-run on a fresh project.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
--  ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('super_admin', 'mentor', 'trainee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_status as enum ('pending', 'in_progress', 'hold', 'failed', 'complete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_location as enum ('home', 'office');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_t as enum ('male', 'female');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
--  MASTER TABLES (managed by super_admin)
-- ---------------------------------------------------------------------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,             -- IT, SAP, IT Asset ...
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,             -- B.Tech, BCA ...
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,             -- HP, Dell ...
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,             -- ITL, SI ...
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trainee-days master: defines selectable training periods + duration.
create table if not exists training_periods (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,            -- "45 Days", "6 Months"
  duration_days integer not null check (duration_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  PROFILES  (1:1 with auth.users) — holds role + identity for everyone
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'trainee',
  full_name text not null default '',
  email text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  MENTORS  (registered via Mentor master; also become app users)
-- ---------------------------------------------------------------------
create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles (id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  team_id uuid not null references teams (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_mentors_team on mentors (team_id);

-- ---------------------------------------------------------------------
--  TRAINEES
-- ---------------------------------------------------------------------
create table if not exists trainees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles (id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text not null,
  alt_phone text,
  gender gender_t not null,
  city text not null,                       -- address: city only
  college_id uuid references colleges (id),
  course_id uuid references courses (id),
  company_id uuid references companies (id),
  system_id uuid references systems (id),   -- optional
  team_id uuid not null references teams (id),
  mentor_id uuid not null references mentors (id),
  training_period_id uuid not null references training_periods (id),
  start_date date not null,
  end_date date not null,                   -- auto-derived from period
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_trainees_mentor on trainees (mentor_id);
create index if not exists idx_trainees_team on trainees (team_id);

-- ---------------------------------------------------------------------
--  WORK LOGS  (daily entries by trainees)
-- ---------------------------------------------------------------------
create table if not exists work_logs (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references trainees (id) on delete cascade,
  task_name text not null,
  description text not null default '',
  location work_location not null,
  work_date date not null default current_date,
  status work_status not null default 'pending',
  mentor_id uuid not null references mentors (id),  -- defaults to trainee's mentor
  mentor_remarks text,                              -- mentor feedback
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_work_logs_trainee on work_logs (trainee_id);
create index if not exists idx_work_logs_mentor on work_logs (mentor_id);
create index if not exists idx_work_logs_date on work_logs (work_date desc);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_work_logs_touch on work_logs;
create trigger trg_work_logs_touch before update on work_logs
  for each row execute function touch_updated_at();

-- A completed log is locked: block UPDATE when the *existing* row is complete.
create or replace function block_completed_edit()
returns trigger language plpgsql as $$
begin
  if old.status = 'complete' and current_setting('jinx.bypass_lock', true) is distinct from 'on' then
    raise exception 'Completed work logs cannot be edited';
  end if;
  return new;
end $$;

drop trigger if exists trg_work_logs_lock on work_logs;
create trigger trg_work_logs_lock before update on work_logs
  for each row execute function block_completed_edit();

-- ---------------------------------------------------------------------
--  HELPER FUNCTIONS for RLS (security definer to avoid recursion)
-- ---------------------------------------------------------------------
create or replace function auth_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function my_mentor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from mentors where profile_id = auth.uid()
$$;

create or replace function my_trainee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from trainees where profile_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
--  ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table profiles          enable row level security;
alter table teams             enable row level security;
alter table colleges          enable row level security;
alter table courses           enable row level security;
alter table systems           enable row level security;
alter table companies         enable row level security;
alter table training_periods  enable row level security;
alter table mentors           enable row level security;
alter table trainees          enable row level security;
alter table work_logs         enable row level security;

-- profiles: a user sees own profile; super_admin sees all
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles for select
  using (id = auth.uid() or auth_role() = 'super_admin');
drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles for all
  using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

-- Masters: everyone authenticated may READ active rows; only super_admin writes.
do $$
declare t text;
begin
  foreach t in array array['teams','colleges','courses','systems','companies','training_periods']
  loop
    execute format('drop policy if exists %1$s_read on %1$s;', t);
    execute format('create policy %1$s_read on %1$s for select to authenticated using (true);', t);
    execute format('drop policy if exists %1$s_write on %1$s;', t);
    execute format($f$create policy %1$s_write on %1$s for all
        using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');$f$, t);
  end loop;
end $$;

-- mentors: super_admin full; everyone authenticated can read (for dropdowns)
drop policy if exists mentors_read on mentors;
create policy mentors_read on mentors for select to authenticated using (true);
drop policy if exists mentors_write on mentors;
create policy mentors_write on mentors for all
  using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');

-- trainees:
--   super_admin: all rows, full write
--   mentor: only own trainees (read)
--   trainee: own record (read)
drop policy if exists trainees_admin on trainees;
create policy trainees_admin on trainees for all
  using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');
drop policy if exists trainees_mentor_read on trainees;
create policy trainees_mentor_read on trainees for select
  using (mentor_id = my_mentor_id());
drop policy if exists trainees_self_read on trainees;
create policy trainees_self_read on trainees for select
  using (profile_id = auth.uid());

-- work_logs:
--   trainee: full CRUD on own logs (completed-lock enforced by trigger)
--   mentor: read own trainees' logs + update (remarks/status) on them
--   super_admin: read all
drop policy if exists wl_trainee_select on work_logs;
create policy wl_trainee_select on work_logs for select
  using (trainee_id = my_trainee_id());
drop policy if exists wl_trainee_insert on work_logs;
create policy wl_trainee_insert on work_logs for insert
  with check (trainee_id = my_trainee_id());
drop policy if exists wl_trainee_update on work_logs;
create policy wl_trainee_update on work_logs for update
  using (trainee_id = my_trainee_id()) with check (trainee_id = my_trainee_id());
drop policy if exists wl_trainee_delete on work_logs;
create policy wl_trainee_delete on work_logs for delete
  using (trainee_id = my_trainee_id());

drop policy if exists wl_mentor_select on work_logs;
create policy wl_mentor_select on work_logs for select
  using (mentor_id = my_mentor_id());
drop policy if exists wl_mentor_update on work_logs;
create policy wl_mentor_update on work_logs for update
  using (mentor_id = my_mentor_id()) with check (mentor_id = my_mentor_id());

drop policy if exists wl_admin_select on work_logs;
create policy wl_admin_select on work_logs for select
  using (auth_role() = 'super_admin');

-- ---------------------------------------------------------------------
--  AUTH HOOK: auto-create a profile row when an auth user is created.
--  Role + name come from user_metadata supplied at signup/invite.
-- ---------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, email, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'trainee'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
--  SEED (optional starter masters)
-- ---------------------------------------------------------------------
insert into teams (name) values ('IT'), ('SAP'), ('IT Asset')
  on conflict (name) do nothing;
insert into courses (name) values ('B.Tech'), ('BCA'), ('MCA'), ('B.Sc')
  on conflict (name) do nothing;
insert into systems (name) values ('HP'), ('Dell'), ('Lenovo')
  on conflict (name) do nothing;
insert into companies (name) values ('ITL'), ('SI')
  on conflict (name) do nothing;
insert into training_periods (label, duration_days) values
  ('45 Days', 45), ('3 Months', 90), ('6 Months', 180)
  on conflict (label) do nothing;
