import { daysBetween, formatDate, today } from "@/lib/date";

/** Visualises how far a trainee is through their training period. */
export function TrainingProgress({ start, end }: { start: string; end: string }) {
  const total = Math.max(1, daysBetween(start, end));
  const elapsed = Math.min(Math.max(daysBetween(start, today()), 0), total);
  const remaining = Math.max(total - elapsed, 0);
  const pct = Math.round((elapsed / total) * 100);
  const finished = today() > end;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Training progress</span>
        <span className="font-medium">{finished ? "Completed" : `${pct}%`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={finished ? "h-full rounded-full bg-success" : "h-full rounded-full bg-primary"}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Elapsed" value={`${elapsed}d`} />
        <Stat label="Remaining" value={finished ? "0d" : `${remaining}d`} />
        <Stat label="Total" value={`${total}d`} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{formatDate(start)}</span>
        <span>{formatDate(end)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 py-1.5">
      <p className="font-display text-base text-fg">{value}</p>
      <p className="text-muted">{label}</p>
    </div>
  );
}
