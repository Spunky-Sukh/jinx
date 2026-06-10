import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
}

/** A fully custom dropdown — no native <select>. Keyboard + click-away aware. */
export function Select({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchable = false,
  disabled,
  className,
  emptyText = "No options",
}: Props) {
  // Opt out of the React Compiler: it memoizes AnimatePresence children so Framer
  // Motion can't clean up the exiting dropdown, leaving a click-blocking overlay.
  "use no memo";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      if (!open) { e.preventDefault(); setOpen(true); return; }
      const opt = filtered[active];
      if (opt) { e.preventDefault(); pick(opt.value); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 text-sm transition-colors",
          "hover:border-primary/50 disabled:opacity-50 disabled:pointer-events-none",
          open && "border-primary/70 ring-2 ring-primary/30"
        )}
      >
        <span className={cn("truncate", !selected && "text-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-soft"
            role="listbox"
            id={listId}
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  placeholder="Search…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
            )}
            <div className="max-h-60 overflow-auto p-1">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted">{emptyText}</div>
              )}
              {filtered.map((opt, i) => {
                const isSel = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(opt.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      i === active ? "bg-surface-2" : "hover:bg-surface-2"
                    )}
                  >
                    <span className="flex flex-col">
                      <span className={cn(isSel && "text-primary")}>{opt.label}</span>
                      {opt.hint && <span className="text-xs text-muted">{opt.hint}</span>}
                    </span>
                    {isSel && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
