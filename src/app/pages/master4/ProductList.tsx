import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Package } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { Toolbar } from '../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../components/master/MasterTable';
import { ConfirmDialog } from '../../components/master/ConfirmDialog';
import { RowActions } from '../../components/master/RowActions';
import { Switch } from '../../components/master/Switch';
import { selectStyle, primaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  useMasterData, formatDate,
  softDeleteProduct, restoreProduct, setProductAvailable,
  type ProductRecord,
} from '../../core/masterStore';

const PAGE_SIZE = 8;

export function ProductList() {
  const navigate = useNavigate();
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availableFilter, setAvailableFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);

  const companyById = useMemo(() => new Map(data.companies.map(c => [c.id, c])), [data.companies]);
  const categoryById = useMemo(() => new Map(data.productCategories.map(c => [c.id, c])), [data.productCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .filter(r => companyFilter === 'all' ? true : r.companyId === companyFilter)
      .filter(r => categoryFilter === 'all' ? true : r.categoryId === categoryFilter)
      .filter(r => availableFilter === 'all' ? true : (availableFilter === 'available' ? r.isAvailable : !r.isAvailable))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, search, showDeleted, companyFilter, categoryFilter, availableFilter]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: MasterColumn<ProductRecord>[] = [
    { key: 'image', label: 'Image', width: '56px', render: r => (
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {r.image ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={16} style={{ color: 'var(--color-muted-foreground)' }} />}
      </div>
    ) },
    { key: 'name', label: 'Name', sortable: true, render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'company', label: 'Company', render: r => companyById.get(r.companyId)?.name ?? '—' },
    { key: 'category', label: 'Category', render: r => categoryById.get(r.categoryId)?.name ?? '—' },
    { key: 'quoteSuffix', label: 'Quote Suffix', render: r => <span style={{ fontFamily: 'monospace' }}>{r.quoteSuffix || '—'}</span> },
    { key: 'availableQty', label: 'Available Qty', render: r => r.availableQty },
    { key: 'isAvailable', label: 'Available', render: r => (
      <Switch checked={r.isAvailable} onChange={v => { setProductAvailable(r.id, v); showToast('success', v ? 'Product available' : 'Product unavailable', `"${r.name}" is now ${v ? 'available' : 'unavailable'}.`); }} />
    ) },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <RowActions
        deleted={!!r.deletedAt}
        onEdit={() => navigate(`/core-4/master/product/${r.id}/edit`)}
        onDelete={() => setDeleteTarget(r)}
        onRestore={() => { restoreProduct(r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }}
      />
    ) },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Product']}
        title="Product"
        subtitle="Manage sellable products"
        actions={<button style={primaryButtonStyle} onClick={() => navigate('/core-4/master/product/new')}><Plus size={15} /> Add Product</button>}
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search products…"
        showDeleted={showDeleted}
        onToggleShowDeleted={v => { setShowDeleted(v); setPage(1); }}
        filters={
          <>
            <select value={companyFilter} onChange={e => { setCompanyFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">Company: All</option>
              {data.companies.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">Category: All</option>
              {data.productCategories.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={availableFilter} onChange={e => { setAvailableFilter(e.target.value as any); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">Available: All</option>
              <option value="available">Available: Yes</option>
              <option value="unavailable">Available: No</option>
            </select>
          </>
        }
      />

      <MasterTable
        columns={columns}
        rows={pageRows}
        getRowId={r => r.id}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        rowStyle={r => r.deletedAt ? { opacity: 0.55 } : {}}
        emptyState={{
          icon: Package,
          title: 'No products yet',
          description: 'Add your first product to get started.',
          actionLabel: 'Add Product',
          onAction: () => navigate('/core-4/master/product/new'),
        }}
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Product?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { softDeleteProduct(deleteTarget.id); showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
