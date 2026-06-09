import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
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

export function MentorMaster() {
  const { notify } = useToast();
  const { data: mentors, isLoading } = useMentors();
  const { data: teams } = useMaster("teams");
  const { register } = useMentorMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", team_id: "", password: "" });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.full_name || !form.email || !form.team_id) return notify("Fill required fields", "error");
    try {
      await register.mutateAsync({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        team_id: form.team_id,
        password: form.password || undefined,
      });
      notify("Mentor registered — invite/welcome email sent");
      setOpen(false);
      setForm({ full_name: "", email: "", phone: "", team_id: "", password: "" });
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  const teamOptions = (teams ?? []).map((t) => ({ value: t.id, label: t.name }));

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-display text-lg">Mentors</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" /> Register mentor
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Spinner />
        ) : !mentors?.length ? (
          <EmptyState title="No mentors yet" hint="Register a mentor to assign trainees." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {mentors.map((mt) => (
              <li key={mt.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{mt.full_name}</p>
                  <p className="text-xs text-muted">{mt.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="info">{mt.team?.name}</Badge>
                  {!mt.is_active && <Badge tone="danger">Inactive</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title="Register mentor">
        <div className="flex flex-col gap-4">
          <Field label="Full name" required>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
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
          <Field label="Temporary password" hint="Leave blank to send an email invite instead.">
            <Input type="text" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </Field>
          <Button onClick={submit} loading={register.isPending} className="w-full">
            Register mentor
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
