import { createBrowserRouter, Navigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute, PublicOnlyRoute, homeForRole } from "@/features/auth/components/guards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Spinner } from "@/components/ui";

import { LoginPage } from "@/features/auth/components/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/components/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/components/ResetPasswordPage";

import { TraineeDashboard } from "@/features/dashboard/components/TraineeDashboard";
import { MentorDashboard, AdminDashboard } from "@/features/dashboard/components/RoleDashboards";
import { TraineeWorkLogsPage } from "@/features/work-logs/components/TraineeWorkLogsPage";
import { MentorWorkLogsPage } from "@/features/work-logs/components/MentorWorkLogsPage";
import { MentorTraineesPage } from "@/features/trainees/components/MentorTraineesPage";
import { MentorTraineeDetailPage } from "@/features/trainees/components/MentorTraineeDetailPage";
import { AdminWorkLogsPage } from "@/features/work-logs/components/AdminWorkLogsPage";
import { AdminTraineesPage } from "@/features/trainees/components/AdminTraineesPage";
import { TraineeProfilePage } from "@/features/trainees/components/TraineeProfilePage";
import { MastersPage } from "@/features/masters/components/MastersPage";
import { MentorsPage } from "@/features/mentors/components/MentorsPage";
import { ReportsPage } from "@/features/reports/components/ReportsPage";

/** Routes "/" to the right home based on the signed-in user's role. */
function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session || !profile) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(profile.role)} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },

  // Public-only (redirects authed users away)
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  // Reset password is reachable while a recovery session is active.
  { path: "/reset-password", element: <ResetPasswordPage /> },

  // Super admin
  {
    element: <ProtectedRoute allow={["super_admin"]} />,
    children: [
      {
        path: "/admin",
        element: <AppShell />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "trainees", element: <AdminTraineesPage /> },
          { path: "work-logs", element: <AdminWorkLogsPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "masters", element: <MastersPage /> },
          { path: "mentors", element: <MentorsPage /> },
        ],
      },
    ],
  },

  // Mentor
  {
    element: <ProtectedRoute allow={["mentor"]} />,
    children: [
      {
        path: "/mentor",
        element: <AppShell />,
        children: [
          { index: true, element: <MentorDashboard /> },
          { path: "trainees", element: <MentorTraineesPage /> },
          { path: "trainees/:id", element: <MentorTraineeDetailPage /> },
          { path: "work-logs", element: <MentorWorkLogsPage /> },
        ],
      },
    ],
  },

  // Trainee
  {
    element: <ProtectedRoute allow={["trainee"]} />,
    children: [
      {
        path: "/app",
        element: <AppShell />,
        children: [
          { index: true, element: <TraineeDashboard /> },
          { path: "work-logs", element: <TraineeWorkLogsPage /> },
          { path: "profile", element: <TraineeProfilePage /> },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);
