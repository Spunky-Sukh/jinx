import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Field, Input, useToast } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { changePassword } from "@/features/auth/api/auth.api";

/** Self-service password change for any signed-in user. */
export function ChangePasswordCard() {
  const { session } = useAuth();
  const { notify } = useToast();
  const email = session?.user?.email ?? "";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return notify("No active session", "error");
    if (next.length < 8) return notify("Use at least 8 characters", "error");
    if (next !== confirm) return notify("New passwords don't match", "error");
    if (next === current) return notify("New password must differ from the current one", "error");

    setLoading(true);
    try {
      await changePassword(email, current, next);
      notify("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2 font-display text-lg">
          <KeyRound className="h-4 w-4 text-primary" /> Change password
        </h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-4">
          <Field label="Current password" required>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="New password" required hint="At least 8 characters.">
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Button type="submit" loading={loading} className="self-start">
            Update password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
