import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Button, Field, Input, useToast } from "@/components/ui";
import { updatePassword } from "../api/auth.api";

export function ResetPasswordPage() {
  const nav = useNavigate();
  const { notify } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return notify("Passwords don't match", "error");
    if (password.length < 8) return notify("Use at least 8 characters", "error");
    setLoading(true);
    try {
      await updatePassword(password);
      notify("Password updated. Please sign in.");
      nav("/login", { replace: true });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <h2 className="font-display text-2xl">Set a new password</h2>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="New password" required>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm password" required>
            <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
