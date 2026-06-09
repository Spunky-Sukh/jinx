import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-12 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
