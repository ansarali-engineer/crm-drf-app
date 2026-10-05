import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { branchesApi } from '@/api/client';
import type { Branch, BranchInput } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { BooleanIcon, formatDate } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, SearchBar } from '@/components/ui/SearchBar';
import { BooleanField, FormActions, TextField } from '@/components/ui/FormFields';

export default function Branches() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailBranch, setDetailBranch] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<Branch>((p) => branchesApi.list(p), { initialParams: params });

  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await branchesApi.remove(deleteId);
      toast.success('Branch deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete branch.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<Branch>[] = [
    { key: 'name', header: 'Name', render: (b) => <button className="text-left font-medium text-primary-600 hover:text-primary-700" onClick={() => setDetailBranch(b)}>{b.name}</button> },
    { key: 'code', header: 'Code', render: (b) => <span className="font-mono text-xs">{b.code}</span> },
    { key: 'phone', header: 'Phone', render: (b) => b.phone || '—' },
    { key: 'address', header: 'Address', render: (b) => <span className="truncate block max-w-[200px]">{b.address || '—'}</span> },
    { key: 'is_active', header: 'Active', render: (b) => <BooleanIcon value={b.is_active} /> },
    { key: 'created_at', header: 'Created', render: (b) => formatDate(b.created_at) },
  ];

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditingBranch(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New Branch
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search branches..." />
        </FilterBar>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No branches found."
          actions={(branch) => (
            <div className="flex items-center justify-end gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => setDetailBranch(branch)} title="View"><Eye className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1" onClick={() => { setEditingBranch(branch); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(branch.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
        <Pagination count={count} page={page} pageSize={10} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <BranchFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          branch={editingBranch}
          loading={formLoading}
          setLoading={setFormLoading}
          onSuccess={() => { setModalOpen(false); reload(); }}
        />
      )}

      {detailBranch && (
        <BranchDetailModal branch={detailBranch} onClose={() => setDetailBranch(null)} onEdit={() => { setEditingBranch(detailBranch); setDetailBranch(null); setModalOpen(true); }} />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

function BranchFormModal({ open, onClose, branch, loading, setLoading, onSuccess }: {
  open: boolean; onClose: () => void; branch: Branch | null; loading: boolean; setLoading: (v: boolean) => void; onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<BranchInput>({ name: '', code: '', address: '', phone: '', is_active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (branch) {
      setForm({ name: branch.name, code: branch.code, address: branch.address || '', phone: branch.phone || '', is_active: branch.is_active });
    } else {
      setForm({ name: '', code: '', address: '', phone: '', is_active: true });
    }
    setErrors({});
  }, [branch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (branch) {
        await branchesApi.update(branch.id, form);
        toast.success('Branch updated successfully.');
      } else {
        await branchesApi.create(form);
        toast.success('Branch created successfully.');
      }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fe: Record<string, string> = {};
        Object.entries(err.data).forEach(([k, v]) => { if (Array.isArray(v)) fe[k] = v.join(', '); else if (typeof v === 'string') fe[k] = v; });
        setErrors(fe);
        toast.error('Please fix the errors in the form.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save branch.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={branch ? 'Edit Branch' : 'New Branch'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} required />
        <TextField label="Code" name="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} error={errors.code} required />
        <TextField label="Phone" name="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} />
        <TextField label="Address" name="address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} error={errors.address} />
        <BooleanField label="Active" name="is_active" value={form.is_active} onChange={(v) => setForm({ ...form, is_active: v === 'true' })} />
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : branch ? 'Update Branch' : 'Create Branch'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}

function BranchDetailModal({ branch, onClose, onEdit }: { branch: Branch; onClose: () => void; onEdit: () => void }) {
  const rows = [
    { label: 'Name', value: branch.name },
    { label: 'Code', value: branch.code },
    { label: 'Phone', value: branch.phone || '—' },
    { label: 'Address', value: branch.address || '—' },
    { label: 'Active', value: <BooleanIcon value={branch.is_active} /> },
    { label: 'Created', value: formatDate(branch.created_at) },
    { label: 'Updated', value: formatDate(branch.updated_at) },
  ];
  return (
    <Modal open={true} onClose={onClose} title="Branch Details" size="md">
      <dl className="space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-sm font-medium text-slate-500">{r.label}</dt>
            <dd className="text-sm text-slate-900 text-right">{r.value}</dd>
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
