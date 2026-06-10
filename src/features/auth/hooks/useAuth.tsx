import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "../api/auth.api";
import type { Profile } from "@/types/db";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(s: Session | null) {
      if (!s?.user) {
        setProfile(null);
        return;
      }
      try {
        const p = await fetchProfile(s.user.id);
        // Defense in depth: if an account is deactivated mid-session, end it.
        // (Login is already blocked at the Auth layer via banned_until.)
        if (p && p.is_active === false) {
          await supabase.auth.signOut();
          if (mounted) {
            setProfile(null);
            setSession(null);
          }
          return;
        }
        if (mounted) setProfile(p);
      } catch {
        if (mounted) setProfile(null);
      }
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return;
      setSession(s);
      await loadProfile(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={{ session, profile, loading }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
