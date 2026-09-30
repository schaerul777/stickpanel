import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Plus, Contact as ContactIcon, Eye, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/master/PageHeader';
import { Toolbar } from '../../../components/master/Toolbar';
import { MasterTable, type MasterColumn } from '../../../components/master/MasterTable';
import { ConfirmDialog } from '../../../components/master/ConfirmDialog';
import { StatusPill } from '../../../components/master/StatusPill';
import { ActiveCompanyBar } from '../../../components/master/ActiveCompanyBar';
import { selectStyle, primaryButtonStyle } from '../../../components/master/styles';
import { useToast, ToastContainer } from '../../../components/Toast';
import { useMasterData } from '../../../core/masterStore';
import { useClientProfileUI, hasPermission } from '../../../core/clientProfileUI';
import {
  useClientProfileData, getClientsForCompany, getLink, softDeleteClient, restoreClient,
  adminUsers, type ClientRecord,
} from '../../../core/clientProfileStore';
import { formatDate } from '../../../core/masterStore';

const PAGE_SIZE = 8;
const iconBtn = {
  padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'inline-flex',
} as const;

export function ClientProfileList() {
  const navigate = useNavigate();
  const location = useLocation();
  useClientProfileData(); // subscribe for re-render on any client-profile change
  const masterData = useMasterData();
  const { activeCompanyId } = useClientProfileUI();
  const { toasts, showToast, dismiss } = useToast();

  useEffect(() => {
    const t = (location.state as any)?.toast;
    if (t) {
      showToast(t.type ?? 'info', t.title, t.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, [activeCompanyId]);

  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'not-verified'>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [salesFilter, setSalesFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);

  const cityName = (id: string) => masterData.cities.find(c => c.id === id)?.name ?? '—';
  const industryName = (id: string) => masterData.industries.find(c => c.id === id)?.name ?? '—';

  const rows = useMemo(() => {
    if (!activeCompanyId) return [];
    const q = search.trim().toLowerCase();
    return getClientsForCompany(activeCompanyId)
      .filter(c => showDeleted ? true : c.deletedAt === null)
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.taxNumber.toLowerCase().includes(q))
      .filter(c => cityFilter === 'all' || c.cityId === cityFilter)
      .filter(c => industryFilter === 'all' || c.industryId === industryFilter)
      .filter(c => {
        const link = getLink(c.id, activeCompanyId);
        if (salesFilter !== 'all' && link?.salesId !== salesFilter) return false;
        if (verifiedFilter === 'verified') return !!link?.verified;
        if (verifiedFilter === 'not-verified') return !link?.verified;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCompanyId, search, showDeleted, cityFilter, industryFilter, salesFilter, verifiedFilter]);

  const total = rows.length;
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: MasterColumn<ClientRecord>[] = [
    { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'brand', label: 'Brand', render: r => r.brandText || <span style={{ color: 'var(--color-muted-foreground)' }}>—</span> },
    { key: 'city', label: 'City', render: r => cityName(r.cityId) },
    { key: 'industry', label: 'Industry', render: r => industryName(r.industryId) },
    { key: 'sales', label: 'Sales', render: r => {
      const link = getLink(r.id, activeCompanyId);
      return adminUsers.find(u => u.id === link?.salesId)?.name ?? '—';
    } },
    { key: 'verified', label: 'Verified', render: r => {
      const link = getLink(r.id, activeCompanyId);
      return link?.verified ? <StatusPill label="Verified" tone="success" /> : <StatusPill label="Not verified" tone="neutral" />;
    } },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => navigate(`/core-4/master/client-profile/${r.id}`)} style={{ ...iconBtn, color: 'var(--color-foreground)' }} aria-label="View" title="View"><Eye size={14} /></button>
        <button onClick={() => navigate(`/core-4/master/client-profile/${r.id}/edit`)} style={{ ...iconBtn, color: 'var(--color-foreground)' }} aria-label="Edit" title="Edit"><Pencil size={14} /></button>
        {hasPermission('client-profile:delete') && !r.deletedAt && (
          <button onClick={() => setDeleteTarget(r)} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Delete" title="Delete"><Trash2 size={14} /></button>
        )}
        {r.deletedAt && (
          <button onClick={() => { restoreClient(r.id); showToast('success', 'Restored', `"${r.name}" has been restored.`); }} style={{ ...iconBtn, color: '#10B981' }} aria-label="Restore" title="Restore">↺</button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Client Profile']}
        title="Client Profile"
        subtitle="Clients linked to the active company"
        actions={hasPermission('client-profile:write') ? (
          <button style={primaryButtonStyle} onClick={() => navigate('/core-4/master/client-profile/new')}><Plus size={15} /> Add Client</button>
        ) : undefined}
      />

      <ActiveCompanyBar />

      <Toolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search name, email, or tax number…"
        showDeleted={showDeleted}
        onToggleShowDeleted={v => { setShowDeleted(v); setPage(1); }}
        filters={
          <>
            <select value={verifiedFilter} onChange={e => { setVerifiedFilter(e.target.value as any); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">Verified: All</option>
              <option value="verified">Verified: Yes</option>
              <option value="not-verified">Verified: No</option>
            </select>
            <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">City: All</option>
              {masterData.cities.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">Industry: All</option>
              {masterData.industries.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={salesFilter} onChange={e => { setSalesFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, width: 'auto' }}>
              <option value="all">Sales: All</option>
              {adminUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
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
          icon: ContactIcon,
          title: 'No clients yet',
          description: 'Add your first client for this company to get started.',
          actionLabel: hasPermission('client-profile:write') ? 'Add Client' : undefined,
          onAction: hasPermission('client-profile:write') ? () => navigate('/core-4/master/client-profile/new') : undefined,
        }}
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Client?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { softDeleteClient(deleteTarget.id); showToast('success', 'Deleted', `"${deleteTarget.name}" has been deleted.`); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
