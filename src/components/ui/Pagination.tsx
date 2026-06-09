import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface Props {
  /** Zero-based current page. */
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

/** Prev / Next pager with a "1–12 of N" range readout. */
export function Pagination({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);

  if (total <= pageSize) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <span>
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="px-1">
          Page {page + 1} of {pages}
        </span>
        <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
