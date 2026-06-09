import type { WorkStatus } from "@/types/db";
import type { WorkLogSortBy } from "./api/workLogs.api";

export const STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "hold", label: "Hold" },
  { value: "failed", label: "Failed" },
  { value: "complete", label: "Complete" },
];

export const LOCATION_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "office", label: "Office" },
];

export const WORKLOG_SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "status", label: "By status" },
];

export const WORKLOG_SORTS: Record<string, { sortBy: WorkLogSortBy; sortDir: "asc" | "desc" }> = {
  date_desc: { sortBy: "work_date", sortDir: "desc" },
  date_asc: { sortBy: "work_date", sortDir: "asc" },
  status: { sortBy: "status", sortDir: "asc" },
};
