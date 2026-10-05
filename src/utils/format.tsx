import type { Branch, Customer, Lead, LeadActivity, Role, RolePermission, User } from '@/types';

export function resolveId(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return (val as { id: number }).id;
  }
  return null;
}

export function resolveName(val: unknown, field = 'name'): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj[field]) return String(obj[field]);
    if (obj['username']) return String(obj['username']);
    if (obj['title']) return String(obj['title']);
  }
  return '—';
}

export function formatDate(val: unknown): string {
  if (!val || typeof val !== 'string') return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(val: unknown): string {
  if (!val || typeof val !== 'string') return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return String(val);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
}

const statusStyles: Record<string, string> = {
  active: 'bg-accent-50 text-accent-700 ring-accent-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  new: 'bg-primary-50 text-primary-700 ring-primary-200',
  contacted: 'bg-blue-50 text-blue-700 ring-blue-200',
  qualified: 'bg-amber-50 text-amber-700 ring-amber-200',
  proposal: 'bg-purple-50 text-purple-700 ring-purple-200',
  won: 'bg-accent-50 text-accent-700 ring-accent-200',
  lost: 'bg-red-50 text-red-700 ring-red-200',
  open: 'bg-primary-50 text-primary-700 ring-primary-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status?.toLowerCase()] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`badge ring-1 capitalize ${style}`}>
      {status || '—'}
    </span>
  );
}

const priorityStyles: Record<string, string> = {
  high: 'bg-red-50 text-red-700 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
};

export function PriorityBadge({ priority }: { priority: string }) {
  const style = priorityStyles[priority?.toLowerCase()] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`badge ring-1 capitalize ${style}`}>
      {priority || '—'}
    </span>
  );
}

export function BooleanIcon({ value }: { value: boolean }) {
  return value ? (
    <span className="badge bg-accent-50 text-accent-700 ring-1 ring-accent-200">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
      Active
    </span>
  ) : (
    <span className="badge bg-slate-100 text-slate-500 ring-1 ring-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

export type { Branch, Customer, Lead, LeadActivity, Role, RolePermission, User };
