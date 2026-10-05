import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { customersApi, branchesApi, usersApi } from '@/api/client';
import type { Branch, Customer, CustomerInput, User } from '@/types';
import { useResourceList } from '@/hooks/useResourceList';
import { useToast } from '@/context/ToastContext';
import { HttpError } from '@/api/client';
import { formatDate, resolveId, resolveName, StatusBadge } from '@/utils/format';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/States';
import { FilterBar, FilterSelect, SearchBar } from '@/components/ui/SearchBar';
import { FormActions, SelectField, TextAreaField, TextField } from '@/components/ui/FormFields';

export default function Customers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Customer | null>(null);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const params: Record<string, string | number | boolean | undefined> = {};
  if (search) params.search = search;
  if (branchFilter) params.branch = branchFilter;
  if (assignedFilter) params.assigned_to = assignedFilter;
  params.ordering = ordering;

  const { data, count, loading, error, page, hasNext, hasPrev, setPage, setParams, reload } =
    useResourceList<Customer>((p) => customersApi.list(p), { initialParams: params });

  useEffect(() => {
    setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, branchFilter, assignedFilter, ordering]);

  useEffect(() => {
    branchesApi.list({ page: 1, page_size: 100 }).then((r) => setBranches(r.results)).catch(() => {});
    usersApi.list({ page: 1, page_size: 100 }).then((r) => setUsers(r.results)).catch(() => {});
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await customersApi.remove(deleteId);
      toast.success('Customer deleted successfully.');
      setDeleteId(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, reload, toast]);

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Name', render: (c) => <button className="text-left font-medium text-primary-600 hover:text-primary-700" onClick={() => setDetailItem(c)}>{c.name}</button> },
    { key: 'company', header: 'Company', render: (c) => c.company || '—' },
    { key: 'email', header: 'Email', render: (c) => c.email || '—' },
    { key: 'phone', header: 'Phone', render: (c) => c.phone || '—' },
    { key: 'branch', header: 'Branch', render: (c) => resolveName(c.branch) },
    { key: 'assigned_to', header: 'Assigned To', render: (c) => resolveName(c.assigned_to, 'username') },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'created_at', header: 'Created', render: (c) => formatDate(c.created_at) },
  ];

  if (error && data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700 font-medium">Access restricted</p>
          <p className="text-sm text-amber-600 mt-1">{error} The customers screen requires specific role permissions. Contact your administrator if you believe you should have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      <div className="card p-4">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone, company..." />
          <FilterSelect label="Branch" value={branchFilter} onChange={setBranchFilter} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          <FilterSelect label="Assigned" value={assignedFilter} onChange={setAssignedFilter} options={users.map((u) => ({ value: u.id, label: u.username }))} />
          <FilterSelect label="Sort" value={ordering} onChange={setOrdering} options={[{ value: '-created_at', label: 'Newest' }, { value: 'created_at', label: 'Oldest' }, { value: 'name', label: 'Name' }]} />
        </FilterBar>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No customers found."
          actions={(c) => (
            <div className="flex items-center justify-end gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => setDetailItem(c)} title="View"><Eye className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1" onClick={() => { setEditingItem(c); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></button>
              <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(c.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
        <Pagination count={count} page={page} pageSize={10} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} customer={editingItem} branches={branches} users={users} loading={formLoading} setLoading={setFormLoading} onSuccess={() => { setModalOpen(false); reload(); }} />
      )}

      {detailItem && (
        <CustomerDetailModal customer={detailItem} onClose={() => setDetailItem(null)} onEdit={() => { setEditingItem(detailItem); setDetailItem(null); setModalOpen(true); }} />
      )}

      <ConfirmDialog open={deleteId !== null} title="Delete Customer" message="Are you sure you want to delete this customer? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
}

function CustomerFormModal({ open, onClose, customer, branches, users, loading, setLoading, onSuccess }: {
  open: boolean; onClose: () => void; customer: Customer | null; branches: Branch[]; users: User[]; loading: boolean; setLoading: (v: boolean) => void; onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<CustomerInput>({ branch: null, assigned_to: null, name: '', email: '', phone: '', company: '', address: '', status: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setForm({ branch: resolveId(customer.branch), assigned_to: resolveId(customer.assigned_to), name: customer.name, email: customer.email, phone: customer.phone, company: customer.company, address: customer.address, status: customer.status });
    } else {
      setForm({ branch: null, assigned_to: null, name: '', email: '', phone: '', company: '', address: '', status: '' });
    }
    setErrors({});
  }, [customer, open]);

  const set = (field: keyof CustomerInput, value: string) => {
    setForm((prev) => {
      if (field === 'branch' || field === 'assigned_to') return { ...prev, [field]: value ? Number(value) : null };
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (customer) { await customersApi.update(customer.id, form); toast.success('Customer updated successfully.'); }
      else { await customersApi.create(form); toast.success('Customer created successfully.'); }
      onSuccess();
    } catch (err) {
      if (err instanceof HttpError && err.status === 400 && err.data) {
        const fe: Record<string, string> = {};
        Object.entries(err.data).forEach(([k, v]) => { if (Array.isArray(v)) fe[k] = v.join(', '); else if (typeof v === 'string') fe[k] = v; });
        setErrors(fe);
        toast.error('Please fix the errors in the form.');
      } else { toast.error(err instanceof Error ? err.message : 'Failed to save customer.'); }
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'Edit Customer' : 'New Customer'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Name" name="name" value={form.name} onChange={(v) => set('name', v)} error={errors.name} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Email" name="email" type="email" value={form.email} onChange={(v) => set('email', v)} error={errors.email} />
          <TextField label="Phone" name="phone" value={form.phone} onChange={(v) => set('phone', v)} error={errors.phone} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Company" name="company" value={form.company} onChange={(v) => set('company', v)} error={errors.company} />
          <TextField label="Status" name="status" value={form.status} onChange={(v) => set('status', v)} error={errors.status} placeholder="e.g. active, inactive..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Branch" name="branch" value={form.branch ?? ''} onChange={(v) => set('branch', v)} error={errors.branch} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          <SelectField label="Assigned To" name="assigned_to" value={form.assigned_to ?? ''} onChange={(v) => set('assigned_to', v)} error={errors.assigned_to} options={users.map((u) => ({ value: u.id, label: u.username }))} />
        </div>
        <TextAreaField label="Address" name="address" value={form.address} onChange={(v) => set('address', v)} error={errors.address} rows={2} />
        <FormActions>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}</button>
        </FormActions>
      </form>
    </Modal>
  );
}

function CustomerDetailModal({ customer, onClose, onEdit }: { customer: Customer; onClose: () => void; onEdit: () => void }) {
  const rows = [
    { label: 'Name', value: customer.name },
    { label: 'Company', value: customer.company || '—' },
    { label: 'Email', value: customer.email || '—' },
    { label: 'Phone', value: customer.phone || '—' },
    { label: 'Branch', value: resolveName(customer.branch) },
    { label: 'Assigned To', value: resolveName(customer.assigned_to, 'username') },
    { label: 'Status', value: <StatusBadge status={customer.status} /> },
    { label: 'Address', value: customer.address || '—' },
    { label: 'Created', value: formatDate(customer.created_at) },
    { label: 'Updated', value: formatDate(customer.updated_at) },
  ];
  return (
    <Modal open={true} onClose={onClose} title="Customer Details" size="md">
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
