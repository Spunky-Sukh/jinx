import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "@/components/ui";
import type { AppRole } from "@/types/db";

/** Blocks unauthenticated users; optionally restricts to allowed roles. */
export function ProtectedRoute({ allow }: { allow?: AppRole[] }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  // Session valid but profile not yet provisioned.
  if (!profile) return <Navigate to="/login" replace />;

  if (allow && !allow.includes(profile.role)) {
    return <Navigate to={homeForRole(profile.role)} replace />;
  }
  return <Outlet />;
}

/** Redirects already-authenticated users away from the login page. */
export function PublicOnlyRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (session && profile) return <Navigate to={homeForRole(profile.role)} replace />;
  return <Outlet />;
}

export function homeForRole(role: AppRole): string {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "mentor":
      return "/mentor";
    case "trainee":
      return "/app";
  }
}
