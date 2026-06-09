import { downloadCsv } from "@/lib/csv";
import { formatDate, today } from "@/lib/date";
import { STATUS_OPTIONS } from "./constants";
import type { WorkLog } from "@/types/db";

const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

/** Downloads the given logs as a CSV, respecting whatever filtering produced them. */
export function exportWorkLogsCsv(logs: WorkLog[], opts: { withTrainee?: boolean } = {}) {
  const headers = [
    "Date",
    ...(opts.withTrainee ? ["Trainee"] : []),
    "Task",
    "Description",
    "Location",
    "Status",
    "Mentor",
    "Remarks",
  ];

  const rows = logs.map((l) => [
    formatDate(l.work_date),
    ...(opts.withTrainee ? [l.trainee?.full_name ?? ""] : []),
    l.task_name,
    l.description,
    l.location === "home" ? "Home" : "Office",
    STATUS_LABEL[l.status] ?? l.status,
    l.mentor?.full_name ?? "",
    l.mentor_remarks ?? "",
  ]);

  downloadCsv(`work-logs-${today()}.csv`, headers, rows);
}
