import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Building2 } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { Toolbar } from '../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../components/master/MasterTable';
import { ConfirmDialog } from '../../components/master/ConfirmDialog';
import { RowActions } from '../../components/master/RowActions';
import { primaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import { useMasterData, formatDate, countProductsUsingCompany, softDeleteCompany, restoreCompany, type CompanyRecord } from '../../core/masterStore';

const PAGE_SIZE = 8;

export function CompanyList() {
  const navigate = useNavigate();
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<CompanyRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.companies
      .filter(r => showDeleted ? true : r.deletedAt === null)
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.abbr.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.companies, search, showDeleted]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const blockReason = deleteTarget ? (() => {
    const n = countProductsUsingCompany(deleteTarget.id);
    return n > 0 ? `Can't delete: used by ${n} product${n === 1 ? '' : 's'}.` : undefined;
  })() : undefined;

  const columns: MasterColumn<CompanyRecord>[] = [
    { key: 'logo', label: 'Logo', width: '56px', render: r => (
      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--color-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {r.logo ? <img src={r.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={16} style={{ color: 'var(--color-muted-foreground)' }} />}
      </div>
    ) },
    { key: 'name', label: 'Name', sortable: true, render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'abbr', label: 'Abbr', render: r => <span style={{ fontFamily: 'monospace' }}>{r.abbr}</span> },
    { key: 'phone', label: 'Phone', render: r => r.phone || <span style={{ color: 'var(--color-muted-foreground)' }}>—</span> },
    { key: 'url', label: 'URL', render: r => r.url ? <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#7C3AED' }} onClick={e => e.stopPropagation()}>{r.url}</a> : <span style={{ color: 'var(--color-muted-foreground)' }}>—</span> },
    { key: 'products', label: 'Products', render: r => countProductsUsingCompany(r.id) },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <RowActions
        deleted={!!r.deletedAt}
        onEdit={() => navigate(`/core-4/master/company/${r.id}/edit`)}
        onDelete={() => setDeleteTarget(r)}
        onRestore={() => { restoreCompany(r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }}
      />
    ) },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Company']}
        title="Company"
        subtitle="Manage the companies quotations are issued under"
        actions={<button style={primaryButtonStyle} onClick={() => navigate('/core-4/master/company/new')}><Plus size={15} /> Add Company</button>}
      />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search companies…"
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
          icon: Building2,
          title: 'No companies yet',
          description: 'Add your first company to get started.',
          actionLabel: 'Add Company',
          onAction: () => navigate('/core-4/master/company/new'),
        }}
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Company?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          blocked={blockReason}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { softDeleteCompany(deleteTarget.id); showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
