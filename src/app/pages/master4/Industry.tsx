import { useEffect, useMemo, useState } from 'react';
import { Plus, Factory } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { Toolbar } from '../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../components/master/MasterTable';
import { FormDrawer } from '../../components/master/FormDrawer';
import { ConfirmDialog } from '../../components/master/ConfirmDialog';
import { RowActions } from '../../components/master/RowActions';
import { inputStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  useMasterData, formatDate,
  isIndustryNameTaken, upsertIndustry, softDeleteIndustry, restoreIndustry,
  type IndustryRecord,
} from '../../core/masterStore';
import { countClientsUsingIndustry } from '../../core/clientProfileStore';

const PAGE_SIZE = 8;

export function IndustryMaster() {
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerRecord, setDrawerRecord] = useState<IndustryRecord | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<IndustryRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.industries
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.industries, search, showDeleted]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const blockReason = deleteTarget ? (() => {
    const n = countClientsUsingIndustry(deleteTarget.id);
    return n > 0 ? `Can't delete: used by ${n} client${n === 1 ? '' : 's'}.` : undefined;
  })() : undefined;

  const columns: MasterColumn<IndustryRecord>[] = [
    { key: 'name', label: 'Name', sortable: true, render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'code', label: 'Code', render: r => <span style={{ fontFamily: 'monospace' }}>{r.code}</span> },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <RowActions
        deleted={!!r.deletedAt}
        onEdit={() => setDrawerRecord(r)}
        onDelete={() => setDeleteTarget(r)}
        onRestore={() => { restoreIndustry(r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }}
      />
    ) },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Industry']}
        title="Industry"
        subtitle="Manage client industries"
        actions={<button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}><Plus size={15} /> Add Industry</button>}
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search industries…"
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
          icon: Factory,
          title: 'No industries yet',
          description: 'Add your first industry to get started.',
          actionLabel: 'Add Industry',
          onAction: () => setDrawerRecord(null),
        }}
      />

      {drawerRecord !== undefined && (
        <IndustryFormDrawer
          record={drawerRecord}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={isNew => { setDrawerRecord(undefined); showToast('success', isNew ? 'Industry added' : 'Industry updated', isNew ? 'New industry has been added.' : 'Changes have been saved.'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Industry?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          blocked={blockReason}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { softDeleteIndustry(deleteTarget.id); showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function IndustryFormDrawer({ record, onClose, onSaved }: {
  record: IndustryRecord | null;
  onClose: () => void;
  onSaved: (isNew: boolean) => void;
}) {
  const [name, setName] = useState(record?.name ?? '');
  const [code, setCode] = useState(record?.code ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required';
    else if (isIndustryNameTaken(trimmed, record?.id)) e.name = 'This name already exists';
    if (!code.trim()) e.code = 'Code is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertIndustry({ name: trimmed, code: code.trim().toUpperCase() }, record?.id);
      setSaving(false);
      onSaved(!record);
    }, 300);
  };

  return (
    <FormDrawer title={record ? 'Edit Industry' : 'Add Industry'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input autoFocus value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
        {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
      </div>
      <div>
        <label style={labelStyle}>Code <span style={{ color: '#EF4444' }}>*</span></label>
        <input value={code} maxLength={10} onChange={e => { setCode(e.target.value.toUpperCase()); if (errors.code) setErrors(x => ({ ...x, code: '' })); }} style={{ ...inputStyle, fontFamily: 'monospace', borderColor: errors.code ? '#EF4444' : 'var(--color-border)' }} />
        {errors.code && <div style={errorTextStyle}>{errors.code}</div>}
      </div>
    </FormDrawer>
  );
}
