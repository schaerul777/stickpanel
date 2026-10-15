import { useEffect, useMemo, useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { Toolbar } from '../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../components/master/MasterTable';
import { FormDrawer } from '../../components/master/FormDrawer';
import { ConfirmDialog } from '../../components/master/ConfirmDialog';
import { RowActions } from '../../components/master/RowActions';
import { ImageUpload } from '../../components/master/ImageUpload';
import { Switch } from '../../components/master/Switch';
import { inputStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  useMasterData, formatDate,
  isCategoryNameTaken, upsertCategory, softDeleteCategory, restoreCategory, countProductsUsingCategory,
  type ProductCategoryRecord,
} from '../../core/masterStore';

const PAGE_SIZE = 8;

export function ProductCategoryMaster() {
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerRecord, setDrawerRecord] = useState<ProductCategoryRecord | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategoryRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.productCategories
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.productCategories, search, showDeleted]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const blockReason = deleteTarget ? (() => {
    const n = countProductsUsingCategory(deleteTarget.id);
    return n > 0 ? `Can't delete: used by ${n} product${n === 1 ? '' : 's'}.` : undefined;
  })() : undefined;

  const columns: MasterColumn<ProductCategoryRecord>[] = [
    { key: 'image', label: 'Image', width: '56px', render: r => (
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {r.image ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Layers size={16} style={{ color: 'var(--color-muted-foreground)' }} />}
      </div>
    ) },
    { key: 'name', label: 'Name', sortable: true, render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'quoteSuffix', label: 'Quote Suffix', render: r => <span style={{ fontFamily: 'monospace' }}>{r.quoteSuffix || '—'}</span> },
    { key: 'isCompetitive', label: 'Competitive', render: r => r.isCompetitive ? 'Yes' : 'No' },
    { key: 'products', label: 'Products', render: r => countProductsUsingCategory(r.id) },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <RowActions
        deleted={!!r.deletedAt}
        onEdit={() => setDrawerRecord(r)}
        onDelete={() => setDeleteTarget(r)}
        onRestore={() => { restoreCategory(r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }}
      />
    ) },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Product Category']}
        title="Product Category"
        subtitle="Manage product categories"
        actions={<button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}><Plus size={15} /> Add Category</button>}
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search categories…"
        showDeleted={showDeleted}
        onToggleShowDeleted={v => { setShowDeleted(v); setPage(1); }}
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
          icon: Layers,
          title: 'No categories yet',
          description: 'Add your first product category to get started.',
          actionLabel: 'Add Category',
          onAction: () => setDrawerRecord(null),
        }}
      />

      {drawerRecord !== undefined && (
        <CategoryFormDrawer
          record={drawerRecord}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={isNew => { setDrawerRecord(undefined); showToast('success', isNew ? 'Category added' : 'Category updated', isNew ? 'New category has been added.' : 'Changes have been saved.'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Category?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          blocked={blockReason}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { softDeleteCategory(deleteTarget.id); showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function CategoryFormDrawer({ record, onClose, onSaved }: {
  record: ProductCategoryRecord | null;
  onClose: () => void;
  onSaved: (isNew: boolean) => void;
}) {
  const [name, setName] = useState(record?.name ?? '');
  const [image, setImage] = useState<string | null>(record?.image ?? null);
  const [quoteSuffix, setQuoteSuffix] = useState(record?.quoteSuffix ?? '');
  const [isCompetitive, setIsCompetitive] = useState(record?.isCompetitive ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required';
    else if (isCategoryNameTaken(trimmed, record?.id)) e.name = 'This name already exists';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertCategory({ name: trimmed, image, quoteSuffix: quoteSuffix.trim(), isCompetitive }, record?.id);
      setSaving(false);
      onSaved(!record);
    }, 300);
  };

  return (
    <FormDrawer title={record ? 'Edit Category' : 'Add Category'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input autoFocus value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
        {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
      </div>
      <ImageUpload label="Image" value={image} onChange={setImage} />
      <div>
        <label style={labelStyle}>Quote Suffix</label>
        <input value={quoteSuffix} maxLength={20} onChange={e => setQuoteSuffix(e.target.value)} style={inputStyle} />
      </div>
      <Switch checked={isCompetitive} onChange={setIsCompetitive} label="Competitive" />
    </FormDrawer>
  );
}
