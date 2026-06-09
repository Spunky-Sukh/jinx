import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ChipGroup,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from "@/components/ui";
import { useMaster, useTrainingPeriods } from "@/features/masters/hooks/useMasters";
import { useMentorsByTeam } from "@/features/mentors/hooks/useMentors";
import { useTraineeMutations } from "../hooks/useTrainees";
import { addDays, today } from "@/lib/date";
import type { Trainee } from "@/types/db";

const empty = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  alt_phone: "",
  gender: "male" as "male" | "female",
  city: "",
  college_id: "",
  course_id: "",
  company_id: "",
  system_id: "",
  team_id: "",
  mentor_id: "",
  training_period_id: "",
  start_date: today(),
};

type FormState = typeof empty;

function fromTrainee(t: Trainee): FormState {
  return {
    full_name: t.full_name,
    email: t.email,
    password: "",
    phone: t.phone,
    alt_phone: t.alt_phone ?? "",
    gender: t.gender,
    city: t.city,
    college_id: t.college_id ?? "",
    course_id: t.course_id ?? "",
    company_id: t.company_id ?? "",
    system_id: t.system_id ?? "",
    team_id: t.team_id,
    mentor_id: t.mentor_id,
    training_period_id: t.training_period_id,
    start_date: t.start_date,
  };
}

export function TraineeFormModal({
  open,
  onClose,
  trainee,
}: {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this trainee instead of registering one. */
  trainee?: Trainee | null;
}) {
  const editing = !!trainee;
  const { notify } = useToast();
  const [form, setForm] = useState<FormState>(empty);

  const { data: teams } = useMaster("teams");
  const { data: colleges } = useMaster("colleges");
  const { data: courses } = useMaster("courses");
  const { data: companies } = useMaster("companies");
  const { data: systems } = useMaster("systems");
  const { data: periods } = useTrainingPeriods();
  const { data: mentors } = useMentorsByTeam(form.team_id || null);
  const { register, update } = useTraineeMutations();

  // (Re)initialise the form whenever the modal opens or the target changes.
  useEffect(() => {
    if (open) setForm(trainee ? fromTrainee(trainee) : empty);
  }, [open, trainee]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Mentors are team-scoped, so picking a new team clears the chosen mentor.
  function setTeam(teamId: string) {
    setForm((f) => ({ ...f, team_id: teamId, mentor_id: "" }));
  }

  // Auto-derive end date from the chosen training period.
  const endDate = useMemo(() => {
    const p = periods?.find((x) => x.id === form.training_period_id);
    if (!p || !form.start_date) return "";
    return addDays(form.start_date, p.duration_days);
  }, [periods, form.training_period_id, form.start_date]);

  const opt = (rows?: { id: string; name: string }[]) =>
    (rows ?? []).map((r) => ({ value: r.id, label: r.name }));

  async function submit() {
    const required = ["full_name", "email", "phone", "city", "team_id", "mentor_id", "training_period_id"] as const;
    for (const k of required) {
      if (!form[k]) return notify("Please fill all required fields", "error");
    }
    if (!endDate) return notify("Select a training period", "error");
    try {
      if (editing) {
        await update.mutateAsync({
          id: trainee.id,
          patch: {
            full_name: form.full_name,
            phone: form.phone,
            alt_phone: form.alt_phone || null,
            gender: form.gender,
            city: form.city,
            college_id: form.college_id || null,
            course_id: form.course_id || null,
            company_id: form.company_id || null,
            system_id: form.system_id || null,
            team_id: form.team_id,
            mentor_id: form.mentor_id,
            training_period_id: form.training_period_id,
            start_date: form.start_date,
            end_date: endDate,
          },
        });
        notify("Trainee updated");
      } else {
        await register.mutateAsync({
          full_name: form.full_name,
          email: form.email,
          password: form.password || undefined,
          phone: form.phone,
          alt_phone: form.alt_phone || undefined,
          gender: form.gender,
          city: form.city,
          college_id: form.college_id || undefined,
          course_id: form.course_id || undefined,
          company_id: form.company_id || undefined,
          system_id: form.system_id || undefined,
          team_id: form.team_id,
          mentor_id: form.mentor_id,
          training_period_id: form.training_period_id,
          start_date: form.start_date,
          end_date: endDate,
        });
        notify("Trainee registered — welcome email sent");
      }
      onClose();
    } catch (e) {
      notify(e instanceof Error ? e.message : editing ? "Update failed" : "Registration failed", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit trainee" : "Register trainee"}
      className="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="Email" required hint={editing ? "Login email can't be changed" : undefined}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            readOnly={editing}
            disabled={editing}
          />
        </Field>

        {!editing && (
          <Field label="Temporary password" hint="Blank = email invite" className="sm:col-span-2">
            <Input value={form.password} onChange={(e) => set("password", e.target.value)} />
          </Field>
        )}

        <Field label="Mobile number" required>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Alternate mobile">
          <Input value={form.alt_phone} onChange={(e) => set("alt_phone", e.target.value)} />
        </Field>

        <Field label="Gender" required>
          <ChipGroup
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
            value={form.gender}
            onChange={(v) => set("gender", v as "male" | "female")}
          />
        </Field>
        <Field label="City" required>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>

        <Field label="College">
          <Select options={opt(colleges)} value={form.college_id || null} onChange={(v) => set("college_id", v)} searchable placeholder="Select college" />
        </Field>
        <Field label="Course">
          <Select options={opt(courses)} value={form.course_id || null} onChange={(v) => set("course_id", v)} placeholder="Select course" />
        </Field>

        <Field label="Company">
          <Select options={opt(companies)} value={form.company_id || null} onChange={(v) => set("company_id", v)} placeholder="Select company" />
        </Field>
        <Field label="System" hint="Optional">
          <Select options={opt(systems)} value={form.system_id || null} onChange={(v) => set("system_id", v)} placeholder="HP, Dell…" />
        </Field>

        <Field label="Team" required>
          <Select options={opt(teams)} value={form.team_id || null} onChange={setTeam} placeholder="Select team" />
        </Field>
        <Field label="Mentor" required hint={form.team_id ? undefined : "Select a team first"}>
          <Select
            options={(mentors ?? []).map((m) => ({ value: m.id, label: m.full_name }))}
            value={form.mentor_id || null}
            onChange={(v) => set("mentor_id", v)}
            placeholder={form.team_id ? "Select mentor" : "Pick team first"}
            disabled={!form.team_id}
            emptyText="No mentors in this team"
          />
        </Field>

        <Field label="Training period" required>
          <Select options={(periods ?? []).map((p) => ({ value: p.id, label: p.label, hint: `${p.duration_days} days` }))} value={form.training_period_id || null} onChange={(v) => set("training_period_id", v)} placeholder="Select period" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" required>
            <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </Field>
          <Field label="End date" hint="Auto-calculated">
            <Input type="date" value={endDate} readOnly disabled />
          </Field>
        </div>
      </div>

      <Button onClick={submit} loading={editing ? update.isPending : register.isPending} className="mt-6 w-full">
        {editing ? "Save changes" : "Register trainee"}
      </Button>
    </Modal>
  );
}
