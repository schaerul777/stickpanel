import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { Toolbar } from '../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../components/master/MasterTable';
import { FormDrawer } from '../../components/master/FormDrawer';
import { ConfirmDialog } from '../../components/master/ConfirmDialog';
import { RowActions } from '../../components/master/RowActions';
import { inputStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import { useCore } from '../../core/CoreContext';
import type { CoreId } from '../../core/coreConfig';
import {
  useMasterData, formatDate,
  isSimpleNameTaken, addSimpleRecord, updateSimpleRecord, softDeleteSimpleRecord, restoreSimpleRecord,
  type SimpleTextRecord,
} from '../../core/masterStore';

type SimpleCollectionKey = 'cities' | 'brands' | 'termMoments' | 'termDues' | 'priceTiers';

interface SimpleMasterPageProps {
  core: CoreId;
  collectionKey: SimpleCollectionKey;
  icon: LucideIcon;
  pageTitle: string;
  subtitle: string;
  fieldLabel: string;
  maxLength: number;
  extraColumn?: { label: string; render: (row: SimpleTextRecord) => ReactNode };
  getBlockReason?: (row: SimpleTextRecord) => string | undefined;
}

const PAGE_SIZE = 8;

export function SimpleMasterPage({
  core, collectionKey, icon: Icon, pageTitle, subtitle, fieldLabel, maxLength, extraColumn, getBlockReason,
}: SimpleMasterPageProps) {
  const { activeCore } = useCore();
  const data = useMasterData();
  const allRecords = data[collectionKey];
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [drawerRecord, setDrawerRecord] = useState<SimpleTextRecord | null | undefined>(undefined); // undefined = closed, null = new
  const [deleteTarget, setDeleteTarget] = useState<SimpleTextRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRecords
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [allRecords, search, showDeleted, sortDir]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: MasterColumn<SimpleTextRecord>[] = [
    { key: 'name', label: fieldLabel, sortable: true, render: r => (
      <span style={{ fontWeight: 500, color: r.deletedAt ? 'var(--color-muted-foreground)' : 'var(--color-foreground)', textDecoration: r.deletedAt ? 'line-through' : 'none' }}>
        {r.name}
      </span>
    ) },
    ...(extraColumn ? [{ key: 'extra', label: extraColumn.label, render: extraColumn.render }] : []),
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <RowActions
        deleted={!!r.deletedAt}
        onEdit={() => setDrawerRecord(r)}
        onDelete={() => setDeleteTarget(r)}
        onRestore={() => { restoreSimpleRecord(collectionKey, r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }}
      />
    ) },
  ];

  const blockReason = deleteTarget ? getBlockReason?.(deleteTarget) : undefined;

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core={core}
        trail={['Master', pageTitle]}
        title={pageTitle}
        subtitle={subtitle}
        actions={
          <button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}>
            <Plus size={15} /> Add {pageTitle}
          </button>
        }
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder={`Search ${fieldLabel.toLowerCase()}…`}
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
        sortKey="name"
        sortDir={sortDir}
        onSortChange={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        rowStyle={r => r.deletedAt ? { opacity: 0.55 } : {}}
        emptyState={{
          icon: Icon,
          title: `No ${pageTitle.toLowerCase()} yet`,
          description: `Add your first ${fieldLabel.toLowerCase()} to get started.`,
          actionLabel: `Add ${pageTitle}`,
          onAction: () => setDrawerRecord(null),
        }}
      />

      {drawerRecord !== undefined && (
        <SimpleFormDrawer
          record={drawerRecord}
          collectionKey={collectionKey}
          fieldLabel={fieldLabel}
          maxLength={maxLength}
          pageTitle={pageTitle}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={(isNew) => {
            setDrawerRecord(undefined);
            showToast('success', isNew ? `${pageTitle} added` : `${pageTitle} updated`, isNew ? `New ${fieldLabel.toLowerCase()} has been added.` : `Changes have been saved.`);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${pageTitle}?`}
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          blocked={blockReason}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            softDeleteSimpleRecord(collectionKey, deleteTarget.id);
            showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

function SimpleFormDrawer({ record, collectionKey, fieldLabel, maxLength, pageTitle, onClose, onSaved }: {
  record: SimpleTextRecord | null;
  collectionKey: SimpleCollectionKey;
  fieldLabel: string;
  maxLength: number;
  pageTitle: string;
  onClose: () => void;
  onSaved: (isNew: boolean) => void;
}) {
  const [value, setValue] = useState(record?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) { setError(`${fieldLabel} is required`); return; }
    if (trimmed.length > maxLength) { setError(`${fieldLabel} must be ${maxLength} characters or fewer`); return; }
    if (isSimpleNameTaken(collectionKey, trimmed, record?.id)) { setError(`This ${fieldLabel.toLowerCase()} already exists`); return; }
    setSaving(true);
    setTimeout(() => {
      if (record) updateSimpleRecord(collectionKey, record.id, trimmed);
      else addSimpleRecord(collectionKey, trimmed);
      setSaving(false);
      onSaved(!record);
    }, 300);
  };

  return (
    <FormDrawer
      title={record ? `Edit ${pageTitle}` : `Add ${pageTitle}`}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
    >
      <div>
        <label style={labelStyle}>{fieldLabel} <span style={{ color: '#EF4444' }}>*</span></label>
        <input
          autoFocus
          value={value}
          maxLength={maxLength}
          onChange={e => { setValue(e.target.value); if (error) setError(null); }}
          style={{ ...inputStyle, borderColor: error ? '#EF4444' : 'var(--color-border)' }}
        />
        {error && <div style={errorTextStyle}>{error}</div>}
      </div>
    </FormDrawer>
  );
}
