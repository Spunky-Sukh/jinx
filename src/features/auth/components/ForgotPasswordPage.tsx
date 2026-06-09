import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { Button, Field, Input, useToast } from "@/components/ui";
import { sendPasswordReset } from "../api/auth.api";

export function ForgotPasswordPage() {
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not send reset email", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <h2 className="font-display text-2xl">Reset your password</h2>
        {sent ? (
          <p className="mt-3 text-sm text-muted">
            If an account exists for <span className="text-fg">{email}</span>, a reset link is on its way.
            Check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">We'll email you a secure reset link.</p>
            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
              <Field label="Email" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="you@company.com"
                  />
                </div>
              </Field>
              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
