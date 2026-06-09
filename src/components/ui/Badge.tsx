import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "primary";

const tones: Record<Tone, string> = {
  default: "bg-surface-2 text-muted",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
  primary: "bg-primary/15 text-primary",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
