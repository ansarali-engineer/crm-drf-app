import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { rolesApi, rolesPermissionsApi } from '@/api/client';
import type { Role, RolePermission, RolePermissionInput } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { BooleanIcon, resolveId, resolveName } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, FilterSelect, SearchBar } from '@/components/ui/SearchBar';
import { BooleanField, FormActions, SelectField, TextField } from '@/components/ui/FormFields';

export default function RolePermissions() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RolePermission | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<RolePermission>((p) => rolesPermissionsApi.list(p), { initialParams: params });

  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  useEffect(() => {
    rolesApi.list({ page: 1, page_size: 100 }).then((r) => setRoles(r.results)).catch(() => {});
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await rolesPermissionsApi.remove(deleteId);
      toast.success('Permission deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete permission.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<RolePermission>[] = [
    { key: 'role', header: 'Role', render: (rp) => <span className="font-medium text-slate-900">{resolveName(rp.role)}</span> },
    { key: 'screen_name', header: 'Screen', render: (rp) => rp.screen_name },
    { key: 'can_view', header: 'View', render: (rp) => <BooleanIcon value={rp.can_view} /> },
    { key: 'can_create', header: 'Create', render: (rp) => <BooleanIcon value={rp.can_create} /> },
    { key: 'can_update', header: 'Update', render: (rp) => <BooleanIcon value={rp.can_update} /> },
    { key: 'can_delete', header: 'Delete', render: (rp) => <BooleanIcon value={rp.can_delete} /> },
  ];

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New Permission
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by screen name..." />
          <FilterSelect label="Role" value={roleFilter} onChange={setRoleFilter} options={roles.map((r) => ({ value: r.id, label: r.name }))} />
        </FilterBar>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No permissions found."
          actions={(rp) => (
            <div className="flex items-center justify-end gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => { setEditingItem(rp); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(rp.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
        <Pagination count={count} page={page} pageSize={10} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <PermissionFormModal open={modalOpen} onClose={() => setModalOpen(false)} permission={editingItem} roles={roles} loading={formLoading} setLoading={setFormLoading} onSuccess={() => { setModalOpen(false); reload(); }} />
      )}

      <ConfirmDialog open={deleteId !== null} title="Delete Permission" message="Are you sure you want to delete this permission? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
}

function PermissionFormModal({ open, onClose, permission, roles, loading, setLoading, onSuccess }: {
  open: boolean; onClose: () => void; permission: RolePermission | null; roles: Role[]; loading: boolean; setLoading: (v: boolean) => void; onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<RolePermissionInput>({ role: 0, screen_name: '', can_view: true, can_create: false, can_update: false, can_delete: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (permission) {
      setForm({ role: resolveId(permission.role) ?? 0, screen_name: permission.screen_name, can_view: permission.can_view, can_create: permission.can_create, can_update: permission.can_update, can_delete: permission.can_delete });
    } else {
      setForm({ role: 0, screen_name: '', can_view: true, can_create: false, can_update: false, can_delete: false });
    }
    setErrors({});
  }, [permission, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (permission) { await rolesPermissionsApi.update(permission.id, form); toast.success('Permission updated successfully.'); }
      else { await rolesPermissionsApi.create(form); toast.success('Permission created successfully.'); }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fe: Record<string, string> = {};
        Object.entries(err.data).forEach(([k, v]) => { if (Array.isArray(v)) fe[k] = v.join(', '); else if (typeof v === 'string') fe[k] = v; });
        setErrors(fe);
        toast.error('Please fix the errors in the form.');
      } else { toast.error(err instanceof Error ? err.message : 'Failed to save permission.'); }
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={permission ? 'Edit Permission' : 'New Permission'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Role" name="role" value={form.role || ''} onChange={(v) => setForm({ ...form, role: v ? Number(v) : 0 })} error={errors.role} required options={roles.map((r) => ({ value: r.id, label: r.name }))} />
        <TextField label="Screen Name" name="screen_name" value={form.screen_name} onChange={(v) => setForm({ ...form, screen_name: v })} error={errors.screen_name} required placeholder="e.g. customers, leads, branches..." />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <BooleanField label="Can View" name="can_view" value={form.can_view} onChange={(v) => setForm({ ...form, can_view: v === 'true' })} />
          <BooleanField label="Can Create" name="can_create" value={form.can_create} onChange={(v) => setForm({ ...form, can_create: v === 'true' })} />
          <BooleanField label="Can Update" name="can_update" value={form.can_update} onChange={(v) => setForm({ ...form, can_update: v === 'true' })} />
          <BooleanField label="Can Delete" name="can_delete" value={form.can_delete} onChange={(v) => setForm({ ...form, can_delete: v === 'true' })} />
        </div>
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : permission ? 'Update Permission' : 'Create Permission'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}
