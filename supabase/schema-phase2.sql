-- =====================================================================
--  JINX — Phase 2 schema changes
--  Apply AFTER schema.sql. Idempotent: safe to re-run.
--  Run in the Supabase SQL editor (or `supabase db push`).
--
--  This file accumulates all Phase 2 database changes so the base
--  schema.sql stays as the Phase 1 reference. Sections are ordered by
--  the Phase 2 feature they support.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Mentor: read assigned trainees' FULL work-log history
--  --------------------------------------------------------------------
--  Background: wl_mentor_select only exposes logs where the mentor is the
--  log's assigned mentor (work_logs.mentor_id = my_mentor_id()). A trainee
--  may assign individual logs to another mentor on the same team, so the
--  primary mentor could not see those rows. The mentor "trainee status"
--  page needs the trainee's complete history, so we add an additive
--  (permissive, OR-combined) SELECT policy scoped to the mentor's own
--  trainees. Review/UPDATE rights are deliberately NOT widened — mentors
--  still only edit logs assigned to them (wl_mentor_update is unchanged).
--
--  Helper is security definer to avoid RLS recursion when the policy
--  references the trainees table from within a work_logs policy.
-- ---------------------------------------------------------------------
create or replace function trainee_belongs_to_me(t_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trainees
    where id = t_id and mentor_id = my_mentor_id()
  )
$$;

drop policy if exists wl_mentor_trainee_select on work_logs;
create policy wl_mentor_trainee_select on work_logs for select
  using (trainee_belongs_to_me(trainee_id));

-- ---------------------------------------------------------------------
--  Security #1: deactivated trainees / mentors cannot sign in
--  --------------------------------------------------------------------
--  Deactivation in the admin UI only flips trainees/mentors.is_active.
--  To truly block login we mirror that flag onto the Auth user via
--  auth.users.banned_until (the same mechanism the Supabase dashboard's
--  "Ban user" uses): GoTrue refuses sign-in while banned_until is in the
--  future. We use 'infinity' so it never expires until reactivation, and
--  also keep profiles.is_active in sync for the app's session guard.
--
--  The function is security definer so the trigger (which a non-superuser
--  admin causes by updating is_active) may write auth.users + profiles.
-- ---------------------------------------------------------------------
create or replace function sync_account_active()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.profile_id is null then
    return new;
  end if;
  update public.profiles set is_active = new.is_active where id = new.profile_id;
  update auth.users
     set banned_until = case when new.is_active then null else 'infinity'::timestamptz end
   where id = new.profile_id;
  return new;
end $$;

drop trigger if exists trg_trainees_sync_active on trainees;
create trigger trg_trainees_sync_active
  after update of is_active on trainees
  for each row when (old.is_active is distinct from new.is_active)
  execute function sync_account_active();

drop trigger if exists trg_mentors_sync_active on mentors;
create trigger trg_mentors_sync_active
  after update of is_active on mentors
  for each row when (old.is_active is distinct from new.is_active)
  execute function sync_account_active();

-- Backfill: align every linked Auth account + profile flag with the
-- current domain-row is_active (bans existing inactive users, unbans active).
update auth.users u
   set banned_until = case when src.is_active then null else 'infinity'::timestamptz end
  from (
    select profile_id, is_active from trainees where profile_id is not null
    union all
    select profile_id, is_active from mentors  where profile_id is not null
  ) src
 where u.id = src.profile_id
   and u.banned_until is distinct from
       (case when src.is_active then null else 'infinity'::timestamptz end);

update public.profiles p set is_active = src.is_active
  from (
    select profile_id, is_active from trainees where profile_id is not null
    union all
    select profile_id, is_active from mentors  where profile_id is not null
  ) src
 where p.id = src.profile_id and p.is_active is distinct from src.is_active;

-- ---------------------------------------------------------------------
--  Security #2 & #3: a trainee whose training period has ENDED is
--  read-only on work logs — they can still SELECT (view) their work, but
--  cannot INSERT / UPDATE / DELETE. "Completed training" is defined as
--  end_date < current_date (period elapsed); also requires the trainee
--  to be active. SELECT policy (wl_trainee_select) is left unchanged.
--
--  Mentor review rights are intentionally NOT restricted by this.
-- ---------------------------------------------------------------------
create or replace function my_training_active()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select t.is_active and t.end_date >= current_date
       from trainees t
      where t.profile_id = auth.uid()
      limit 1),
    false)
$$;

drop policy if exists wl_trainee_insert on work_logs;
create policy wl_trainee_insert on work_logs for insert
  with check (trainee_id = my_trainee_id() and my_training_active());

drop policy if exists wl_trainee_update on work_logs;
create policy wl_trainee_update on work_logs for update
  using (trainee_id = my_trainee_id() and my_training_active())
  with check (trainee_id = my_trainee_id() and my_training_active());

drop policy if exists wl_trainee_delete on work_logs;
create policy wl_trainee_delete on work_logs for delete
  using (trainee_id = my_trainee_id() and my_training_active());
