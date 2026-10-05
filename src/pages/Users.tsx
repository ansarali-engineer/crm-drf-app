import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { usersApi, branchesApi, rolesApi } from '@/api/client';
import type { Branch, Role, User, UserInput } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { BooleanIcon, formatDate, resolveId, resolveName } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, FilterSelect, SearchBar } from '@/components/ui/SearchBar';
import { BooleanField, FormActions, SelectField, TextField } from '@/components/ui/FormFields';

export default function Users() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<User | null>(null);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;
  if (branchFilter) params.branch = branchFilter;
  if (activeFilter) params.is_active = activeFilter;
  params.ordering = ordering;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<User>((p) => usersApi.list(p), { initialParams: params });

  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, branchFilter, activeFilter, ordering]);

  useEffect(() => {
    branchesApi.list({ page: 1, page_size: 100 }).then((r) => setBranches(r.results)).catch(() => {});
    rolesApi.list({ page: 1, page_size: 100 }).then((r) => setRoles(r.results)).catch(() => {});
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await usersApi.remove(deleteId);
      toast.success('User deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username', render: (u) => <button className="text-left font-medium text-primary-600 hover:text-primary-700" onClick={() => setDetailItem(u)}>{u.username}</button> },
    { key: 'name', header: 'Name', render: (u) => `${u.first_name} ${u.last_name}`.trim() || '—' },
    { key: 'email', header: 'Email', render: (u) => u.email || '—' },
    { key: 'role', header: 'Role', render: (u) => resolveName(u.role) },
    { key: 'branch', header: 'Branch', render: (u) => resolveName(u.branch) },
    { key: 'is_active', header: 'Active', render: (u) => <BooleanIcon value={u.is_active} /> },
    { key: 'created_at', header: 'Created', render: (u) => formatDate(u.created_at) },
  ];

  if (error && data.length === 0) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New User
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by username, email, name..." />
          <FilterSelect label="Role" value={roleFilter} onChange={setRoleFilter} options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          <FilterSelect label="Branch" value={branchFilter} onChange={setBranchFilter} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          <FilterSelect label="Status" value={activeFilter} onChange={setActiveFilter} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
          <FilterSelect label="Sort" value={ordering} onChange={setOrdering} options={[{ value: '-created_at', label: 'Newest' }, { value: 'created_at', label: 'Oldest' }, { value: 'username', label: 'Username' }]} />
        </FilterBar>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No users found."
          actions={(u) => (
            <div className="flex items-center justify-end gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => setDetailItem(u)} title="View"><Eye className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1" onClick={() => { setEditingItem(u); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(u.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
        <Pagination count={count} page={page} pageSize={10} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} user={editingItem} branches={branches} roles={roles} loading={formLoading} setLoading={setFormLoading} onSuccess={() => { setModalOpen(false); reload(); }} />
      )}

      {detailItem && (
        <UserDetailModal user={detailItem} onClose={() => setDetailItem(null)} onEdit={() => { setEditingItem(detailItem); setDetailItem(null); setModalOpen(true); }} />
      )}

      <ConfirmDialog open={deleteId !== null} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
}

function UserFormModal({ open, onClose, user, branches, roles, loading, setLoading, onSuccess }: {
  open: boolean; onClose: () => void; user: User | null; branches: Branch[]; roles: Role[]; loading: boolean; setLoading: (v: boolean) => void; onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<UserInput>({ username: '', role: 0, branch: null, email: '', password: '', phone: '', first_name: '', last_name: '', is_active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, role: resolveId(user.role) ?? 0, branch: resolveId(user.branch), email: user.email, password: '', phone: user.phone || '', first_name: user.first_name || '', last_name: user.last_name || '', is_active: user.is_active });
    } else {
      setForm({ username: '', role: 0, branch: null, email: '', password: '', phone: '', first_name: '', last_name: '', is_active: true });
    }
    setErrors({});
  }, [user, open]);

  const set = (field: keyof UserInput, value: string) => {
    setForm((prev) => {
      if (field === 'role') return { ...prev, [field]: value ? Number(value) : 0 };
      if (field === 'branch') return { ...prev, [field]: value ? Number(value) : null };
      if (field === 'is_active') return { ...prev, [field]: value === 'true' };
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = { ...form };
      if (user && !payload.password) delete payload.password;
      if (user) { await usersApi.update(user.id, payload); toast.success('User updated successfully.'); }
      else { await usersApi.create(payload); toast.success('User created successfully.'); }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fe: Record<string, string> = {};
        Object.entries(err.data).forEach(([k, v]) => { if (Array.isArray(v)) fe[k] = v.join(', '); else if (typeof v === 'string') fe[k] = v; });
        setErrors(fe);
        toast.error('Please fix the errors in the form.');
      } else { toast.error(err instanceof Error ? err.message : 'Failed to save user.'); }
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit User' : 'New User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Username" name="username" value={form.username} onChange={(v) => set('username', v)} error={errors.username} required />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={(v) => set('email', v)} error={errors.email} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="First Name" name="first_name" value={form.first_name} onChange={(v) => set('first_name', v)} error={errors.first_name} />
          <TextField label="Last Name" name="last_name" value={form.last_name} onChange={(v) => set('last_name', v)} error={errors.last_name} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Phone" name="phone" value={form.phone} onChange={(v) => set('phone', v)} error={errors.phone} />
          <TextField label={user ? 'Password (leave blank to keep current)' : 'Password'} name="password" type="password" value={form.password || ''} onChange={(v) => set('password', v)} error={errors.password} required={!user} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Role" name="role" value={form.role || ''} onChange={(v) => set('role', v)} error={errors.role} required options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          <SelectField label="Branch" name="branch" value={form.branch ?? ''} onChange={(v) => set('branch', v)} error={errors.branch} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
        </div>
        <BooleanField label="Active" name="is_active" value={form.is_active} onChange={(v) => set('is_active', v)} />
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : user ? 'Update User' : 'Create User'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}

function UserDetailModal({ user, onClose, onEdit }: { user: User; onClose: () => void; onEdit: () => void }) {
  const rows = [
    { label: 'Username', value: user.username },
    { label: 'Name', value: `${user.first_name} ${user.last_name}`.trim() || '—' },
    { label: 'Email', value: user.email || '—' },
    { label: 'Phone', value: user.phone || '—' },
    { label: 'Role', value: resolveName(user.role) },
    { label: 'Branch', value: resolveName(user.branch) },
    { label: 'Active', value: <BooleanIcon value={user.is_active} /> },
    { label: 'Created', value: formatDate(user.created_at) },
    { label: 'Updated', value: formatDate(user.updated_at) },
  ];
  return (
    <Modal open={true} onClose={onClose} title="User Details" size="md">
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
