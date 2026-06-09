import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@/components/ui";
import type { WorkLog, WorkStatus } from "@/types/db";

const META: Record<WorkStatus, { label: string; varName: string }> = {
  pending: { label: "Pending", varName: "--c-muted" },
  in_progress: { label: "In Progress", varName: "--c-info" },
  hold: { label: "Hold", varName: "--c-warning" },
  failed: { label: "Failed", varName: "--c-danger" },
  complete: { label: "Complete", varName: "--c-success" },
};

/** Lightweight status breakdown — no chart lib needed. */
export function StatusChart({ logs }: { logs: WorkLog[] }) {
  const counts = logs.reduce<Record<WorkStatus, number>>(
    (acc, l) => ({ ...acc, [l.status]: (acc[l.status] ?? 0) + 1 }),
    { pending: 0, in_progress: 0, hold: 0, failed: 0, complete: 0 }
  );
  const max = Math.max(1, ...Object.values(counts));

  return (
    <Card>
      <CardHeader>
        <h3 className="font-display text-lg">Status breakdown</h3>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {(Object.keys(META) as WorkStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-muted">{META[s].label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `rgb(var(${META[s].varName}))` }}
                initial={{ width: 0 }}
                animate={{ width: `${(counts[s] / max) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="w-8 text-right text-sm tabular-nums">{counts[s]}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
