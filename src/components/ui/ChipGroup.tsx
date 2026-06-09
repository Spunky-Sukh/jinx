import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Chip {
  value: string;
  label: string;
}

interface Props {
  options: Chip[];
  value: string | null;
  onChange: (v: string) => void;
  className?: string;
}

/** Segmented single-select chips (e.g. Home / Office). */
export function ChipGroup({ options, value, onChange, className }: Props) {
  return (
    <div className={cn("inline-flex gap-1 rounded-xl border border-border bg-surface p-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "text-primary-fg" : "text-muted hover:text-fg"
            )}
          >
            {active && (
              <motion.span
                layoutId="chip-active"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
