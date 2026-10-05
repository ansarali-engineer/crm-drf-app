interface PaginationProps {
  count: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  count,
  page,
  pageSize,
  hasNext,
  hasPrev,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(count / pageSize);
  const startItem = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/70 bg-slate-50/30">
      <p className="text-sm text-slate-500">
        Showing <span className="font-bold text-slate-700">{startItem}</span>–
        <span className="font-bold text-slate-700">{endItem}</span> of{' '}
        <span className="font-bold text-slate-700">{count}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          className="btn-secondary px-3.5 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="px-3 text-sm font-semibold text-slate-600">
          {page} <span className="text-slate-400 font-normal">of</span> {totalPages || 1}
        </span>
        <button
          className="btn-secondary px-3.5 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
