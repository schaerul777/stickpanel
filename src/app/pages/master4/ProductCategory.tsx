import { useEffect, useMemo, useState } from 'react';
import { Plus, Boxes } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { Toolbar } from '../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../components/master/MasterTable';
import { FormDrawer } from '../../components/master/FormDrawer';
import { ConfirmDialog } from '../../components/master/ConfirmDialog';
import { RowActions } from '../../components/master/RowActions';
import { StatusPill } from '../../components/master/StatusPill';
import { ImageUpload } from '../../components/master/ImageUpload';
import { Switch } from '../../components/master/Switch';
import { inputStyle, selectStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  useMasterData, formatDate, countProductsUsingCategory,
  isCategoryNameTaken, upsertCategory, softDeleteCategory, restoreCategory,
  type ProductCategoryRecord,
} from '../../core/masterStore';

const PAGE_SIZE = 8;
const QUANTITY_SUGGESTIONS = ['Screen', 'Slot', 'Spot'];
const DURATION_SUGGESTIONS = ['Day', 'Week', 'Month'];

export function ProductCategoryMaster() {
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [campaignableFilter, setCampaignableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [page, setPage] = useState(1);
  const [drawerRecord, setDrawerRecord] = useState<ProductCategoryRecord | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategoryRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.productCategories
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .filter(r => campaignableFilter === 'all' ? true : (campaignableFilter === 'yes' ? r.campaignable : !r.campaignable))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.productCategories, search, showDeleted, campaignableFilter]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const blockReason = deleteTarget ? (() => {
    const n = countProductsUsingCategory(deleteTarget.id);
    return n > 0 ? `Can't delete: used by ${n} product${n === 1 ? '' : 's'}.` : undefined;
  })() : undefined;

  const columns: MasterColumn<ProductCategoryRecord>[] = [
    { key: 'image', label: 'Image', width: '60px', render: r => (
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {r.image ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Boxes size={16} style={{ color: 'var(--color-muted-foreground)' }} />}
      </div>
    ) },
    { key: 'name', label: 'Name', sortable: true, render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'quantityUnit', label: 'Quantity Unit', render: r => r.quantityUnit },
    { key: 'durationUnit', label: 'Duration Unit', render: r => r.durationUnit },
    { key: 'campaignable', label: 'Campaignable', render: r => <StatusPill label={r.campaignable ? 'Yes' : 'No'} tone={r.campaignable ? 'success' : 'neutral'} /> },
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
        subtitle="Manage the categories products are grouped under"
        actions={<button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}><Plus size={15} /> Add Product Category</button>}
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search categories…"
        showDeleted={showDeleted}
        onToggleShowDeleted={v => { setShowDeleted(v); setPage(1); }}
        filters={
          <select value={campaignableFilter} onChange={e => { setCampaignableFilter(e.target.value as any); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
            <option value="all">Campaignable: All</option>
            <option value="yes">Campaignable: Yes</option>
            <option value="no">Campaignable: No</option>
          </select>
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
          icon: Boxes,
          title: 'No product categories yet',
          description: 'Add your first product category to get started.',
          actionLabel: 'Add Product Category',
          onAction: () => setDrawerRecord(null),
        }}
      />

      {drawerRecord !== undefined && (
        <CategoryFormDrawer
          record={drawerRecord}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={isNew => { setDrawerRecord(undefined); showToast('success', isNew ? 'Category added' : 'Category updated', isNew ? 'New product category has been added.' : 'Changes have been saved.'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Product Category?"
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
  const [quantityUnit, setQuantityUnit] = useState(record?.quantityUnit ?? '');
  const [durationUnit, setDurationUnit] = useState(record?.durationUnit ?? '');
  const [campaignable, setCampaignable] = useState(record?.campaignable ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required';
    else if (isCategoryNameTaken(trimmed, record?.id)) e.name = 'This name already exists';
    if (!quantityUnit.trim()) e.quantityUnit = 'Quantity unit is required';
    if (!durationUnit.trim()) e.durationUnit = 'Duration unit is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertCategory({ name: trimmed, image, quantityUnit: quantityUnit.trim(), durationUnit: durationUnit.trim(), campaignable }, record?.id);
      setSaving(false);
      onSaved(!record);
    }, 300);
  };

  return (
    <FormDrawer title={record ? 'Edit Product Category' : 'Add Product Category'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input autoFocus value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
        {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
      </div>

      <ImageUpload label="Image" value={image} onChange={setImage} />

      <div>
        <label style={labelStyle}>Quantity Unit <span style={{ color: '#EF4444' }}>*</span></label>
        <input list="qty-suggestions" value={quantityUnit} onChange={e => { setQuantityUnit(e.target.value); if (errors.quantityUnit) setErrors(x => ({ ...x, quantityUnit: '' })); }} style={{ ...inputStyle, borderColor: errors.quantityUnit ? '#EF4444' : 'var(--color-border)' }} />
        <datalist id="qty-suggestions">{QUANTITY_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
        {errors.quantityUnit && <div style={errorTextStyle}>{errors.quantityUnit}</div>}
      </div>

      <div>
        <label style={labelStyle}>Duration Unit <span style={{ color: '#EF4444' }}>*</span></label>
        <input list="duration-suggestions" value={durationUnit} onChange={e => { setDurationUnit(e.target.value); if (errors.durationUnit) setErrors(x => ({ ...x, durationUnit: '' })); }} style={{ ...inputStyle, borderColor: errors.durationUnit ? '#EF4444' : 'var(--color-border)' }} />
        <datalist id="duration-suggestions">{DURATION_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
        {errors.durationUnit && <div style={errorTextStyle}>{errors.durationUnit}</div>}
      </div>

      <Switch checked={campaignable} onChange={setCampaignable} label="Is Campaignable" helperText="Products in this category can be used in campaigns" />
    </FormDrawer>
  );
}
