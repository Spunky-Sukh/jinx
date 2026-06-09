import { Badge } from "./Badge";
import type { WorkStatus } from "@/types/db";

const map: Record<WorkStatus, { label: string; tone: "default" | "success" | "warning" | "danger" | "info" | "primary" }> = {
  pending: { label: "Pending", tone: "default" },
  in_progress: { label: "In Progress", tone: "info" },
  hold: { label: "Hold", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  complete: { label: "Complete", tone: "success" },
};

export function StatusBadge({ status }: { status: WorkStatus }) {
  const v = map[status];
  return <Badge tone={v.tone}>{v.label}</Badge>;
}
