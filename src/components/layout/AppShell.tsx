import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Database,
  GraduationCap,
  FileBarChart,
  UserCircle,
  LogOut,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { signOut } from "@/features/auth/api/auth.api";
import type { AppRole } from "@/types/db";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NAV: Record<AppRole, NavItem[]> = {
  super_admin: [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/admin/trainees", label: "Trainees", icon: <GraduationCap className="h-4 w-4" /> },
    { to: "/admin/work-logs", label: "Work Logs", icon: <ListChecks className="h-4 w-4" /> },
    { to: "/admin/reports", label: "Reports", icon: <FileBarChart className="h-4 w-4" /> },
    { to: "/admin/masters", label: "Masters", icon: <Database className="h-4 w-4" /> },
    { to: "/admin/mentors", label: "Mentors", icon: <Users className="h-4 w-4" /> },
  ],
  mentor: [
    { to: "/mentor", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/mentor/trainees", label: "My Trainees", icon: <GraduationCap className="h-4 w-4" /> },
    { to: "/mentor/work-logs", label: "Trainee Work", icon: <ListChecks className="h-4 w-4" /> },
  ],
  trainee: [
    { to: "/app", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/app/work-logs", label: "My Work", icon: <ListChecks className="h-4 w-4" /> },
    { to: "/app/profile", label: "My Profile", icon: <UserCircle className="h-4 w-4" /> },
  ],
};

export function AppShell() {
  const { profile } = useAuth();
  const { mode, toggle } = useTheme();
  const nav = useNavigate();
  const items = profile ? NAV[profile.role] : [];

  async function handleSignOut() {
    await signOut();
    nav("/login", { replace: true });
  }

  const roleLabel =
    profile?.role === "super_admin" ? "Super Admin" : profile?.role === "mentor" ? "Mentor" : "Trainee";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex print:hidden">
        <div className="mb-8 flex items-center gap-2 px-2 font-display text-xl">
          <Zap className="h-6 w-6 text-primary" /> Jinx
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("/").length === 2}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface-2 hover:text-fg"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="truncate text-sm font-medium">{profile?.full_name || "—"}</p>
          <p className="text-xs text-muted">{roleLabel}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur lg:px-8 print:hidden">
          <div className="flex items-center gap-2 font-display text-lg lg:hidden">
            <Zap className="h-5 w-5 text-primary" /> Jinx
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggle}
              className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Toggle theme"
            >
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden print:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("/").length === 2}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                  isActive ? "bg-primary/15 text-primary" : "text-muted"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
