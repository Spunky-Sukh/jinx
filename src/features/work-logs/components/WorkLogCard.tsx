import { Home, Building2, Lock, Pencil, Trash2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Badge, Card, CardBody } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/date";
import type { WorkLog } from "@/types/db";

interface Props {
  log: WorkLog;
  /** Trainee-side controls. Hidden when log is complete (locked). */
  onEdit?: (log: WorkLog) => void;
  onDelete?: (log: WorkLog) => void;
  /** Mentor-side review control. */
  onReview?: (log: WorkLog) => void;
  showTrainee?: boolean;
}

export function WorkLogCard({ log, onEdit, onDelete, onReview, showTrainee }: Props) {
  const locked = log.status === "complete";
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="transition-colors hover:border-primary/40">
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-medium">{log.task_name}</h4>
                {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted" />}
              </div>
              {showTrainee && log.trainee && (
                <p className="text-xs text-muted">{log.trainee.full_name}</p>
              )}
            </div>
            <StatusBadge status={log.status} />
          </div>

          {log.description && <p className="text-sm text-muted">{log.description}</p>}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge tone="default">
              {log.location === "home" ? (
                <Home className="mr-1 h-3 w-3" />
              ) : (
                <Building2 className="mr-1 h-3 w-3" />
              )}
              {log.location === "home" ? "Home" : "Office"}
            </Badge>
            <span>{formatDate(log.work_date)}</span>
            {log.mentor && <span>· Mentor: {log.mentor.full_name}</span>}
          </div>

          {log.mentor_remarks && (
            <div className="rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span className="text-xs font-medium text-muted">Mentor remarks</span>
              <p>{log.mentor_remarks}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onReview && (
              <button
                onClick={() => onReview(log)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm text-primary hover:bg-surface-2"
              >
                <MessageSquare className="h-4 w-4" /> Review
              </button>
            )}
            {onEdit && !locked && (
              <button
                onClick={() => onEdit(log)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm text-muted hover:bg-surface-2 hover:text-fg"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            {onDelete && !locked && (
              <button
                onClick={() => onDelete(log)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm text-danger hover:bg-surface-2"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
            {locked && (onEdit || onDelete) && (
              <span className="text-xs text-muted">Completed — locked</span>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
