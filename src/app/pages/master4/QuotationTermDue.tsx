import { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarClock } from 'lucide-react';
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
  isTermDueNameTaken, upsertTermDue, softDeleteTermDue, restoreTermDue,
  type TermRecord,
} from '../../core/masterStore';

const PAGE_SIZE = 8;

export function QuotationTermDueMaster() {
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerRecord, setDrawerRecord] = useState<TermRecord | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TermRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.termDues
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.termDues, search, showDeleted]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: MasterColumn<TermRecord>[] = [
    { key: 'name', label: 'Name', sortable: true, render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'note', label: 'Note', render: r => r.note || <span style={{ color: 'var(--color-muted-foreground)' }}>—</span> },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <RowActions
        deleted={!!r.deletedAt}
        onEdit={() => setDrawerRecord(r)}
        onDelete={() => setDeleteTarget(r)}
        onRestore={() => { restoreTermDue(r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }}
      />
    ) },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Quotation Term Due']}
        title="Quotation Term Due"
        subtitle="Payment due periods shown in quotations"
        actions={<button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}><Plus size={15} /> Add Term Due</button>}
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search term dues…"
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
          icon: CalendarClock,
          title: 'No term dues yet',
          description: 'Add your first term due to get started.',
          actionLabel: 'Add Term Due',
          onAction: () => setDrawerRecord(null),
        }}
      />

      {drawerRecord !== undefined && (
        <TermFormDrawer
          record={drawerRecord}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={isNew => { setDrawerRecord(undefined); showToast('success', isNew ? 'Term due added' : 'Term due updated', isNew ? 'New term due has been added.' : 'Changes have been saved.'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Term Due?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { softDeleteTermDue(deleteTarget.id); showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function TermFormDrawer({ record, onClose, onSaved }: {
  record: TermRecord | null;
  onClose: () => void;
  onSaved: (isNew: boolean) => void;
}) {
  const [name, setName] = useState(record?.name ?? '');
  const [note, setNote] = useState(record?.note ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required';
    else if (isTermDueNameTaken(trimmed, record?.id)) e.name = 'This name already exists';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertTermDue({ name: trimmed, note: note.trim() }, record?.id);
      setSaving(false);
      onSaved(!record);
    }, 300);
  };

  return (
    <FormDrawer title={record ? 'Edit Term Due' : 'Add Term Due'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input autoFocus value={name} maxLength={200} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
        {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
      </div>
      <div>
        <label style={labelStyle}>Note</label>
        <input value={note} maxLength={500} onChange={e => setNote(e.target.value)} style={inputStyle} />
      </div>
    </FormDrawer>
  );
}
