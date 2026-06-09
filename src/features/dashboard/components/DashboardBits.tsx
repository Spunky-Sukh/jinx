import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui";
import { Select, ChipGroup } from "@/components/ui";
import { STATUS_OPTIONS, LOCATION_OPTIONS } from "@/features/work-logs/constants";
import type { WorkLocation, WorkStatus } from "@/types/db";

export function StatTile({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const ring: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{label}</span>
          <span className={ring[tone]}>{icon}</span>
        </div>
        <p className="mt-2 font-display text-3xl">{value}</p>
      </Card>
    </motion.div>
  );
}

export interface FiltersValue {
  status: WorkStatus | "";
  location: WorkLocation | "";
  from: string;
  to: string;
}

export function FilterBar({
  value,
  onChange,
}: {
  value: FiltersValue;
  onChange: (v: FiltersValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[160px]">
        <span className="mb-1 block text-xs font-medium text-muted">Status</span>
        <Select
          options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]}
          value={value.status || ""}
          onChange={(v) => onChange({ ...value, status: v as WorkStatus | "" })}
        />
      </div>
      <div>
        <span className="mb-1 block text-xs font-medium text-muted">Location</span>
        <ChipGroup
          options={[{ value: "", label: "All" }, ...LOCATION_OPTIONS]}
          value={value.location || ""}
          onChange={(v) => onChange({ ...value, location: v as WorkLocation | "" })}
        />
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">From</span>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">To</span>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
        />
      </label>
    </div>
  );
}
