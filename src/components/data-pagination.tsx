import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export type PaginationState = { page: number; pageSize: number };

export function usePagination<T>(items: T[], state: PaginationState) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  const page = Math.min(state.page, totalPages);
  const start = (page - 1) * state.pageSize;
  const paged = items.slice(start, start + state.pageSize);
  return { paged, total, totalPages, page };
}

type Props = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onChange: (state: PaginationState) => void;
  pageSizeOptions?: number[];
};

export function DataPagination({
  page, pageSize, total, totalPages, onChange,
  pageSizeOptions = [10, 20, 50],
}: Props) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onChange({ page: 1, pageSize: Number(v) })}>
          <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-muted-foreground">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1}
          onClick={() => onChange({ page: 1, pageSize })}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1}
          onClick={() => onChange({ page: page - 1, pageSize })}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages}
          onClick={() => onChange({ page: page + 1, pageSize })}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages}
          onClick={() => onChange({ page: totalPages, pageSize })}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
