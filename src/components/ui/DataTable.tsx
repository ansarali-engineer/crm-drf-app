import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
}

export default function DataTable<T extends { id: number }>({
  columns,
  data,
  loading,
  emptyMessage = 'No records found',
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const allColumns = actions ? [...columns, { key: '_actions', header: 'Actions', className: 'text-right' }] : [];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <p className="text-sm text-slate-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/70 bg-slate-50/50">
            {allColumns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr
              key={item.id}
              className={`transition-colors duration-150 hover:bg-slate-50/60 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3.5 text-slate-700 ${col.className || ''}`}>
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
