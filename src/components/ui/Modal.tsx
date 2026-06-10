import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: Props) {
  // The React Compiler (enabled globally) memoizes AnimatePresence's children in
  // a way that stops Framer Motion from detecting the exiting node — leaving an
  // invisible, click-blocking overlay mounted after close. Opt this component out.
  "use no memo";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-border bg-surface shadow-soft",
              className
            )}
          >
            {title && (
              <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
                <h2 className="font-display text-lg">{title}</h2>
                <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
