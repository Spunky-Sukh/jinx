import { useEffect, useState } from "react";
import { Pencil, Power, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ChipGroup,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  useToast,
} from "@/components/ui";
import { useMaster } from "@/features/masters/hooks/useMasters";
import { useMentors, useMentorMutations } from "../hooks/useMentors";
import type { Mentor } from "@/types/db";

type StatusFilter = "all" | "active" | "inactive";
const emptyForm = { full_name: "", email: "", phone: "", team_id: "", password: "" };

export function MentorMaster() {
  const { notify } = useToast();
  const { data: mentors, isLoading } = useMentors();
  const { data: teams } = useMaster("teams");
  const { register, update, setActive } = useMentorMutations();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mentor | null>(null);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [form, setForm] = useState(emptyForm);

  const editing = !!editTarget;

  useEffect(() => {
    if (!open) return;
    setForm(
      editTarget
        ? {
            full_name: editTarget.full_name,
            email: editTarget.email,
            phone: editTarget.phone ?? "",
            team_id: editTarget.team_id,
            password: "",
          }
        : emptyForm
    );
  }, [open, editTarget]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setEditTarget(null);
    setOpen(true);
  }

  function openEdit(mt: Mentor) {
    setEditTarget(mt);
    setOpen(true);
  }

  async function submit() {
    if (!form.full_name || !form.email || !form.team_id) return notify("Fill required fields", "error");
    try {
      if (editing) {
        await update.mutateAsync({
          id: editTarget.id,
          patch: { full_name: form.full_name, phone: form.phone || null, team_id: form.team_id },
        });
        notify("Mentor updated");
      } else {
        await register.mutateAsync({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          team_id: form.team_id,
          password: form.password || undefined,
        });
        notify("Mentor registered — invite/welcome email sent");
      }
      setOpen(false);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  async function toggleActive(mt: Mentor) {
    try {
      await setActive.mutateAsync({ id: mt.id, is_active: !mt.is_active });
      notify(mt.is_active ? "Mentor deactivated" : "Mentor reactivated");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed to update status", "error");
    }
  }

  const teamOptions = (teams ?? []).map((t) => ({ value: t.id, label: t.name }));
  const visible = (mentors ?? []).filter((mt) =>
    status === "all" ? true : status === "active" ? mt.is_active : !mt.is_active
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg">Mentors</h3>
        <div className="flex items-center gap-2">
          <ChipGroup
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "all", label: "All" },
            ]}
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
          />
          <Button size="sm" onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Register mentor
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Spinner />
        ) : !visible.length ? (
          <EmptyState title="No mentors yet" hint="Register a mentor to assign trainees." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {visible.map((mt) => (
              <li key={mt.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{mt.full_name}</p>
                  <p className="truncate text-xs text-muted">{mt.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="info">{mt.team?.name}</Badge>
                  {!mt.is_active && <Badge tone="danger">Inactive</Badge>}
                  <Button size="icon" variant="ghost" aria-label="Edit mentor" onClick={() => openEdit(mt)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={mt.is_active ? "Deactivate mentor" : "Reactivate mentor"}
                    onClick={() => toggleActive(mt)}
                    loading={setActive.isPending && setActive.variables?.id === mt.id}
                    className={mt.is_active ? "text-muted hover:text-danger" : "text-muted hover:text-success"}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit mentor" : "Register mentor"}>
        <div className="flex flex-col gap-4">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Team" required>
              <Select
                options={teamOptions}
                value={form.team_id || null}
                onChange={(v) => set("team_id", v)}
                placeholder="Select team"
              />
            </Field>
          </div>
          {!editing && (
            <Field label="Temporary password" hint="Leave blank to send an email invite instead.">
              <Input type="text" value={form.password} onChange={(e) => set("password", e.target.value)} />
            </Field>
          )}
          <Button onClick={submit} loading={editing ? update.isPending : register.isPending} className="w-full">
            {editing ? "Save changes" : "Register mentor"}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
