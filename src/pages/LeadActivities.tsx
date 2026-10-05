import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { leadActivitiesApi, leadsApi, usersApi } from '@/api/client';
import type { Lead, LeadActivity, LeadActivityInput, User } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { formatDateTime, resolveId, resolveName } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, FilterSelect, SearchBar } from '@/components/ui/SearchBar';
import { DateTimeField, FormActions, SelectField, TextAreaField, TextField } from '@/components/ui/FormFields';

export default function LeadActivities() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [ordering, setOrdering] = useState('-activity_date');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadActivity | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;
  if (leadFilter) params.lead = leadFilter;
  if (userFilter) params.user = userFilter;
  if (typeFilter) params.activity_type = typeFilter;
  params.ordering = ordering;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<LeadActivity>((p) => leadActivitiesApi.list(p), { initialParams: params });

  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, leadFilter, userFilter, typeFilter, ordering]);

  useEffect(() => {
    leadsApi.list({ page: 1, page_size: 100 }).then((r) => setLeads(r.results)).catch(() => {});
    usersApi.list({ page: 1, page_size: 100 }).then((r) => setUsers(r.results)).catch(() => {});
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await leadActivitiesApi.remove(deleteId);
      toast.success('Activity deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete activity.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<LeadActivity>[] = [
    { key: 'subject', header: 'Subject', render: (a) => <span className="font-medium text-slate-900">{a.subject}</span> },
    { key: 'activity_type', header: 'Type', render: (a) => <span className="capitalize">{a.activity_type || '—'}</span> },
    { key: 'lead', header: 'Lead', render: (a) => resolveName(a.lead, 'title') },
    { key: 'user', header: 'User', render: (a) => resolveName(a.user, 'username') },
    { key: 'activity_date', header: 'Activity Date', render: (a) => formatDateTime(a.activity_date) },
    { key: 'created_at', header: 'Created', render: (a) => formatDateTime(a.created_at) },
  ];

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  const activityTypes = Array.from(new Set(data.map((a) => a.activity_type).filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New Activity
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by subject, description, type..." />
          <FilterSelect label="Lead" value={leadFilter} onChange={setLeadFilter} options={leads.map((l) => ({ value: l.id, label: l.title }))} />
          <FilterSelect label="User" value={userFilter} onChange={setUserFilter} options={users.map((u) => ({ value: u.id, label: u.username }))} />
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={activityTypes.map((t) => ({ value: t, label: t }))} />
          <FilterSelect label="Sort" value={ordering} onChange={setOrdering} options={[
            { value: '-activity_date', label: 'Newest Activity' },
            { value: 'activity_date', label: 'Oldest Activity' },
            { value: '-created_at', label: 'Newest Created' },
            { value: 'subject', label: 'Subject' },
          ]} />
        </FilterBar>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No activities found."
          actions={(a) => (
            <div className="flex items-center justify-end gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => { setEditingItem(a); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(a.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
        <Pagination count={count} page={page} pageSize={10} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <ActivityFormModal open={modalOpen} onClose={() => setModalOpen(false)} activity={editingItem} leads={leads} users={users} loading={formLoading} setLoading={setFormLoading} onSuccess={() => { setModalOpen(false); reload(); }} />
      )}

      <ConfirmDialog open={deleteId !== null} title="Delete Activity" message="Are you sure you want to delete this activity? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
}

function ActivityFormModal({ open, onClose, activity, leads, users, loading, setLoading, onSuccess }: {
  open: boolean; onClose: () => void; activity: LeadActivity | null; leads: Lead[]; users: User[]; loading: boolean; setLoading: (v: boolean) => void; onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<LeadActivityInput>({ lead: 0, user: 0, activity_type: '', subject: '', description: '', activity_date: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activity) {
      setForm({ lead: resolveId(activity.lead) ?? 0, user: resolveId(activity.user) ?? 0, activity_type: activity.activity_type || '', subject: activity.subject || '', description: activity.description || '', activity_date: activity.activity_date || '' });
    } else {
      setForm({ lead: 0, user: 0, activity_type: '', subject: '', description: '', activity_date: '' });
    }
    setErrors({});
  }, [activity, open]);

  const set = (field: keyof LeadActivityInput, value: string) => {
    setForm((prev) => {
      if (field === 'lead' || field === 'user') return { ...prev, [field]: value ? Number(value) : 0 };
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (activity) { await leadActivitiesApi.update(activity.id, form); toast.success('Activity updated successfully.'); }
      else { await leadActivitiesApi.create(form); toast.success('Activity created successfully.'); }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fe: Record<string, string> = {};
        Object.entries(err.data).forEach(([k, v]) => { if (Array.isArray(v)) fe[k] = v.join(', '); else if (typeof v === 'string') fe[k] = v; });
        setErrors(fe);
        toast.error('Please fix the errors in the form.');
      } else { toast.error(err instanceof Error ? err.message : 'Failed to save activity.'); }
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={activity ? 'Edit Activity' : 'New Activity'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Subject" name="subject" value={form.subject} onChange={(v) => set('subject', v)} error={errors.subject} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Lead" name="lead" value={form.lead || ''} onChange={(v) => set('lead', v)} error={errors.lead} required options={leads.map((l) => ({ value: l.id, label: l.title }))} />
          <SelectField label="User" name="user" value={form.user || ''} onChange={(v) => set('user', v)} error={errors.user} required options={users.map((u) => ({ value: u.id, label: u.username }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Activity Type" name="activity_type" value={form.activity_type} onChange={(v) => set('activity_type', v)} error={errors.activity_type} placeholder="e.g. call, email, meeting..." />
          <DateTimeField label="Activity Date" name="activity_date" value={form.activity_date} onChange={(v) => set('activity_date', v)} error={errors.activity_date} required />
        </div>
        <TextAreaField label="Description" name="description" value={form.description} onChange={(v) => set('description', v)} error={errors.description} rows={3} />
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}
