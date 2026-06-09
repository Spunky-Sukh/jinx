import type { WorkStatus } from "@/types/db";

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
