import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { rolesApi } from '@/api/client';
import type { Role, RoleInput } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { formatDate } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, SearchBar } from '@/components/ui/SearchBar';
import { FormActions, TextAreaField, TextField } from '@/components/ui/FormFields';

export default function Roles() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<Role>((p) => rolesApi.list(p), { initialParams: params });

  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await rolesApi.remove(deleteId);
      toast.success('Role deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<Role>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-slate-600 truncate block max-w-[300px]">{r.description || '—'}</span> },
    { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
  ];

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search roles..." />
        </FilterBar>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No roles found."
          actions={(r) => (
            <div className="flex items-center justify-end gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => { setEditingItem(r); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(r.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
        <Pagination count={count} page={page} pageSize={10} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <RoleFormModal open={modalOpen} onClose={() => setModalOpen(false)} role={editingItem} loading={formLoading} setLoading={setFormLoading} onSuccess={() => { setModalOpen(false); reload(); }} />
      )}

      <ConfirmDialog open={deleteId !== null} title="Delete Role" message="Are you sure you want to delete this role? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
}

function RoleFormModal({ open, onClose, role, loading, setLoading, onSuccess }: {
  open: boolean; onClose: () => void; role: Role | null; loading: boolean; setLoading: (v: boolean) => void; onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<RoleInput>({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) { setForm({ name: role.name, description: role.description || '' }); }
    else { setForm({ name: '', description: '' }); }
    setErrors({});
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (role) { await rolesApi.update(role.id, form); toast.success('Role updated successfully.'); }
      else { await rolesApi.create(form); toast.success('Role created successfully.'); }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fe: Record<string, string> = {};
        Object.entries(err.data).forEach(([k, v]) => { if (Array.isArray(v)) fe[k] = v.join(', '); else if (typeof v === 'string') fe[k] = v; });
        setErrors(fe);
        toast.error('Please fix the errors in the form.');
      } else { toast.error(err instanceof Error ? err.message : 'Failed to save role.'); }
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={role ? 'Edit Role' : 'New Role'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} required />
        <TextAreaField label="Description" name="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} error={errors.description} rows={3} />
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}
