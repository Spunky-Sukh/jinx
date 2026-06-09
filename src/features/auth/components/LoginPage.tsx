import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Lock, Mail, Zap } from "lucide-react";
import { Button, Field, Input, useToast } from "@/components/ui";
import { signIn } from "../api/auth.api";

export function LoginPage() {
  const nav = useNavigate();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Guards will route to the role home once the session resolves.
      nav("/", { replace: true });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Sign in failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-surface lg:block">
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2 font-display text-2xl">
            <Zap className="h-7 w-7 text-primary" /> Jinx
          </div>
          <div>
            <h1 className="font-display text-5xl leading-tight">
              Track the work.
              <br />
              <span className="text-primary">Grow the talent.</span>
            </h1>
            <p className="mt-4 max-w-md text-muted">
              A focused training tracker for trainees, mentors and administrators.
            </p>
          </div>
          <p className="text-xs text-muted">Accounts are provisioned by your administrator.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2 font-display text-2xl lg:hidden">
            <Zap className="h-6 w-6 text-primary" /> Jinx
          </div>
          <h2 className="font-display text-2xl">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to continue.</p>

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
            <Field label="Password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                />
              </div>
            </Field>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
