import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { leadsApi, customersApi, usersApi } from '@/api/client';
import type { Customer, Lead, LeadInput, User } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { formatCurrency, formatDate, PriorityBadge, resolveId, resolveName, StatusBadge } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, FilterSelect, SearchBar } from '@/components/ui/SearchBar';
import {
  BooleanField,
  DateField,
  FormActions,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui/FormFields';

type ViewMode = 'table' | 'pipeline';

export default function Leads() {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;
  if (statusFilter) params.status = statusFilter;
  if (priorityFilter) params.priority = priorityFilter;
  params.ordering = ordering;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<Lead>(
      (p) => leadsApi.list(p),
      { initialParams: params },
    );

  // Apply filter changes
  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, priorityFilter, ordering]);

  // Load FK options
  useEffect(() => {
    customersApi.list({ page: 1, page_size: 100 }).then((r) => setCustomers(r.results)).catch(() => {});
    usersApi.list({ page: 1, page_size: 100 }).then((r) => setUsers(r.results)).catch(() => {});
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await leadsApi.remove(deleteId);
      toast.success('Lead deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete lead.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<Lead>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (lead) => (
        <button className="text-left font-medium text-primary-600 hover:text-primary-700" onClick={() => setDetailLead(lead)}>
          {lead.title}
        </button>
      ),
    },
    { key: 'customer', header: 'Customer', render: (lead) => resolveName(lead.customer) },
    { key: 'source', header: 'Source', render: (lead) => lead.source || '—' },
    { key: 'status', header: 'Status', render: (lead) => <StatusBadge status={lead.status} /> },
    { key: 'priority', header: 'Priority', render: (lead) => <PriorityBadge priority={lead.priority} /> },
    { key: 'expected_value', header: 'Expected Value', render: (lead) => formatCurrency(lead.expected_value) },
    { key: 'expected_date', header: 'Expected Date', render: (lead) => formatDate(lead.expected_date) },
  ];

  if (error && data.length === 0) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              viewMode === 'table' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="w-4 h-4" /> Table
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              viewMode === 'pipeline' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setViewMode('pipeline')}
          >
            <LayoutGrid className="w-4 h-4" /> Pipeline
          </button>
        </div>
        <button className="btn-primary" onClick={() => { setEditingLead(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search leads by title or source..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[]} />
          <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={[]} />
          <FilterSelect
            label="Sort"
            value={ordering}
            onChange={setOrdering}
            options={[
              { value: '-created_at', label: 'Newest First' },
              { value: 'created_at', label: 'Oldest First' },
              { value: 'status', label: 'Status' },
              { value: 'priority', label: 'Priority' },
            ]}
          />
        </FilterBar>
      </div>

      {viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage="No leads found. Try adjusting your filters."
            actions={(lead) => (
              <div className="flex items-center justify-end gap-0.5">
                <button className="btn-icon" onClick={() => setDetailLead(lead)} title="View details">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="btn-icon" onClick={() => { setEditingLead(lead); setModalOpen(true); }} title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="btn-icon hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(lead.id)} title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
          <Pagination
            count={count}
            page={page}
            pageSize={10}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <PipelineView leads={data} loading={loading} onLeadClick={setDetailLead} />
      )}

      {modalOpen && (
        <LeadFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          lead={editingLead}
          customers={customers}
          users={users}
          loading={formLoading}
          setLoading={setFormLoading}
          onSuccess={() => {
            setModalOpen(false);
            reload();
          }}
        />
      )}

      {detailLead && (
        <LeadDetailModal lead={detailLead} onClose={() => setDetailLead(null)} onEdit={() => { setEditingLead(detailLead); setDetailLead(null); setModalOpen(true); }} />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

function PipelineView({ leads, loading, onLeadClick }: { leads: Lead[]; loading: boolean; onLeadClick: (lead: Lead) => void }) {
  const statuses = Array.from(new Set(leads.map((l) => l.status).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card py-20 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3">
          <LayoutGrid className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">No leads found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.length === 0 ? (
        <div className="card p-4 w-full text-center text-sm text-slate-500">
          Lead statuses will appear as columns here once leads have status values.
        </div>
      ) : (
        statuses.map((status) => {
          const columnLeads = leads.filter((l) => l.status === status);
          const columnValue = columnLeads.reduce((sum, l) => {
            const v = typeof l.expected_value === 'number' ? l.expected_value : parseFloat(String(l.expected_value));
            return sum + (isNaN(v) ? 0 : v);
          }, 0);
          return (
            <div key={status} className="w-72 shrink-0">
              <div className="card overflow-hidden">
                <div className="px-4 py-3.5 border-b border-slate-200/70 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-xs font-bold text-slate-400 bg-white rounded-full px-2 py-0.5 ring-1 ring-slate-200">{columnLeads.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-2">{formatCurrency(columnValue)}</p>
                </div>
                <div className="p-2.5 space-y-2 max-h-[500px] overflow-y-auto">
                  {columnLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => onLeadClick(lead)}
                      className="w-full text-left rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-primary-300 hover:shadow-card-hover transition-all duration-200 group"
                    >
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">{lead.title}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{resolveName(lead.customer)}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <PriorityBadge priority={lead.priority} />
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(lead.expected_value)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function LeadFormModal({
  open,
  onClose,
  lead,
  customers,
  users,
  loading,
  setLoading,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  customers: Customer[];
  users: User[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<LeadInput>({
    assigned_to: null,
    customer: null,
    source: '',
    title: '',
    description: '',
    status: '',
    priority: '',
    expected_value: '',
    expected_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setForm({
        assigned_to: resolveId(lead.assigned_to),
        customer: resolveId(lead.customer),
        source: lead.source || '',
        title: lead.title || '',
        description: lead.description || '',
        status: lead.status || '',
        priority: lead.priority || '',
        expected_value: lead.expected_value !== undefined && lead.expected_value !== null ? String(lead.expected_value) : '',
        expected_date: lead.expected_date || '',
      });
    } else {
      setForm({
        assigned_to: null,
        customer: null,
        source: '',
        title: '',
        description: '',
        status: '',
        priority: '',
        expected_value: '',
        expected_date: '',
      });
    }
    setErrors({});
  }, [lead, open]);

  const set = (field: keyof LeadInput, value: string) => {
    setForm((prev) => {
      if (field === 'assigned_to' || field === 'customer') {
        return { ...prev, [field]: value ? Number(value) : null };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (lead) {
        await leadsApi.update(lead.id, form);
        toast.success('Lead updated successfully.');
      } else {
        await leadsApi.create(form);
        toast.success('Lead created successfully.');
      }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(err.data).forEach(([key, val]) => {
          if (Array.isArray(val)) fieldErrors[key] = val.join(', ');
          else if (typeof val === 'string') fieldErrors[key] = val;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save lead.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={lead ? 'Edit Lead' : 'New Lead'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Title" name="title" value={form.title} onChange={(v) => set('title', v)} error={errors.title} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Customer"
            name="customer"
            value={form.customer ?? ''}
            onChange={(v) => set('customer', v)}
            error={errors.customer}
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />
          <TextField label="Source" name="source" value={form.source} onChange={(v) => set('source', v)} error={errors.source} placeholder="e.g. Website, Referral..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Status" name="status" value={form.status} onChange={(v) => set('status', v)} error={errors.status} placeholder="e.g. new, qualified, won..." />
          <TextField label="Priority" name="priority" value={form.priority} onChange={(v) => set('priority', v)} error={errors.priority} placeholder="e.g. high, medium, low..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="Expected Value" name="expected_value" value={form.expected_value} onChange={(v) => set('expected_value', v)} error={errors.expected_value} step="0.01" placeholder="0.00" />
          <DateField label="Expected Date" name="expected_date" value={form.expected_date} onChange={(v) => set('expected_date', v)} error={errors.expected_date} />
        </div>
        <SelectField
          label="Assigned To"
          name="assigned_to"
          value={form.assigned_to ?? ''}
          onChange={(v) => set('assigned_to', v)}
          error={errors.assigned_to}
          options={users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}`.trim() || u.username }))}
        />
        <TextAreaField label="Description" name="description" value={form.description} onChange={(v) => set('description', v)} error={errors.description} rows={3} />
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}

function LeadDetailModal({ lead, onClose, onEdit }: { lead: Lead; onClose: () => void; onEdit: () => void }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Title', value: lead.title },
    { label: 'Customer', value: resolveName(lead.customer) },
    { label: 'Source', value: lead.source || '—' },
    { label: 'Status', value: <StatusBadge status={lead.status} /> },
    { label: 'Priority', value: <PriorityBadge priority={lead.priority} /> },
    { label: 'Expected Value', value: formatCurrency(lead.expected_value) },
    { label: 'Expected Date', value: formatDate(lead.expected_date) },
    { label: 'Assigned To', value: resolveName(lead.assigned_to, 'username') },
    { label: 'Description', value: lead.description || '—' },
    { label: 'Created', value: formatDate(lead.created_at) },
    { label: 'Updated', value: formatDate(lead.updated_at) },
  ];

  return (
    <Modal open={true} onClose={onClose} title="Lead Details" size="lg">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {rows.map((row) => (
          <div key={row.label} className={row.label === 'Description' ? 'sm:col-span-2' : ''}>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{row.label}</dt>
            <dd className="mt-1 text-sm text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={onEdit}><Pencil className="w-4 h-4" /> Edit</button>
      </div>
    </Modal>
  );
}
