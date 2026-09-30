import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { MasterTable, type MasterColumn } from '../../../../components/master/MasterTable';
import { FormDrawer } from '../../../../components/master/FormDrawer';
import { ConfirmDialog } from '../../../../components/master/ConfirmDialog';
import { StatusPill } from '../../../../components/master/StatusPill';
import { EmptyState } from '../../../../components/EmptyState';
import { inputStyle, selectStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../../../components/master/styles';
import { useClientProfileUI, hasPermission } from '../../../../core/clientProfileUI';
import {
  useClientProfileData, getLinksForClient, addCompanyLink, updateCompanyLink, canRemoveLink, removeCompanyLink,
  adminUsers, type ClientRecord, type ClientCompanyLink,
} from '../../../../core/clientProfileStore';
import { useMasterData } from '../../../../core/masterStore';
import type { ToastType } from '../../../../components/Toast';

interface TabProps {
  client: ClientRecord;
  showToast: (type: ToastType, title: string, message?: string) => void;
  autoOpenAdd?: boolean;
}

const iconBtn = {
  padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'inline-flex',
} as const;

export function CompaniesTab({ client, showToast, autoOpenAdd }: TabProps) {
  const navigate = useNavigate();
  useClientProfileData();
  const masterData = useMasterData();
  const { activeCompanyId } = useClientProfileUI();
  const links = getLinksForClient(client.id);

  const [drawerLink, setDrawerLink] = useState<ClientCompanyLink | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ClientCompanyLink | null>(null);

  useEffect(() => {
    if (autoOpenAdd && hasPermission('client-profile.company:write')) setDrawerLink(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenAdd]);

  const companyName = (id: string) => masterData.companies.find(c => c.id === id)?.name ?? '—';
  const companyLogo = (id: string) => masterData.companies.find(c => c.id === id)?.logo ?? null;

  const columns: MasterColumn<ClientCompanyLink>[] = [
    { key: 'company', label: 'Company', render: r => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {companyLogo(r.companyId) ? <img src={companyLogo(r.companyId)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={13} style={{ color: 'var(--color-muted-foreground)' }} />}
        </div>
        <span style={{ fontWeight: 500 }}>{companyName(r.companyId)}</span>
      </span>
    ) },
    { key: 'sales', label: 'Sales', render: r => adminUsers.find(u => u.id === r.salesId)?.name ?? '—' },
    { key: 'netsuite', label: 'NetSuite ID', render: r => r.netsuiteId || '—' },
    { key: 'jurnal', label: 'Jurnal ID', render: r => r.jurnalId || '—' },
    { key: 'verified', label: 'Verified', render: r => r.verified ? <StatusPill label="Verified" tone="success" /> : <StatusPill label="Not verified" tone="neutral" /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        {hasPermission('client-profile.company:write') && <button onClick={() => setDrawerLink(r)} style={iconBtn} aria-label="Edit"><Pencil size={14} /></button>}
        {hasPermission('client-profile.company:write') && <button onClick={() => setDeleteTarget(r)} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Remove"><Trash2 size={14} /></button>}
      </div>
    ) },
  ];

  const blockReason = deleteTarget ? canRemoveLink(deleteTarget.id) : undefined;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        {hasPermission('client-profile.company:write') && (
          <button style={primaryButtonStyle} onClick={() => setDrawerLink(null)}><Plus size={15} /> Add Company Link</button>
        )}
      </div>

      {links.length === 0 ? (
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState icon={Building2} title="Not linked to any company" description="Link this client to a company to get started." />
        </div>
      ) : (
        <MasterTable columns={columns} rows={links} getRowId={r => r.id} page={1} pageSize={links.length} total={links.length} onPageChange={() => {}} />
      )}

      {drawerLink !== undefined && (
        <CompanyLinkDrawer
          clientId={client.id}
          link={drawerLink}
          existingCompanyIds={links.map(l => l.companyId)}
          defaultCompanyId={autoOpenAdd ? activeCompanyId : undefined}
          onClose={() => setDrawerLink(undefined)}
          onSaved={isNew => { setDrawerLink(undefined); showToast('success', isNew ? 'Company linked' : 'Company link updated'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove Company Link?"
          message={`Remove this client from ${companyName(deleteTarget.companyId)}?`}
          blocked={blockReason}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            removeCompanyLink(deleteTarget.id);
            showToast('success', 'Company link removed');
            const wasActive = deleteTarget.companyId === activeCompanyId;
            setDeleteTarget(null);
            if (wasActive) navigate('/core-4/master/client-profile');
          }}
        />
      )}
    </div>
  );
}

function CompanyLinkDrawer({ clientId, link, existingCompanyIds, defaultCompanyId, onClose, onSaved }: {
  clientId: string; link: ClientCompanyLink | null; existingCompanyIds: string[]; defaultCompanyId?: string;
  onClose: () => void; onSaved: (isNew: boolean) => void;
}) {
  const masterData = useMasterData();
  const availableCompanies = masterData.companies.filter(c => !c.deletedAt && (link ? c.id === link.companyId : !existingCompanyIds.includes(c.id)));
  const [companyId, setCompanyId] = useState(link?.companyId ?? defaultCompanyId ?? availableCompanies[0]?.id ?? '');
  const [salesId, setSalesId] = useState(link?.salesId ?? adminUsers[0]?.id ?? '');
  const [netsuiteId, setNetsuiteId] = useState(link?.netsuiteId ?? '');
  const [jurnalId, setJurnalId] = useState(link?.jurnalId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!companyId) { setError('Company is required'); return; }
    setSaving(true);
    setTimeout(() => {
      if (link) updateCompanyLink(link.id, { salesId, netsuiteId, jurnalId });
      else addCompanyLink(clientId, companyId, salesId, netsuiteId, jurnalId);
      setSaving(false);
      onSaved(!link);
    }, 300);
  };

  return (
    <FormDrawer title={link ? 'Edit Company Link' : 'Add Company Link'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Company <span style={{ color: '#EF4444' }}>*</span></label>
        <select value={companyId} onChange={e => { setCompanyId(e.target.value); setError(null); }} disabled={!!link} style={{ ...selectStyle, borderColor: error ? '#EF4444' : 'var(--color-border)', opacity: link ? 0.7 : 1 }}>
          {availableCompanies.length === 0 && <option value="">No companies available</option>}
          {availableCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {error && <div style={errorTextStyle}>{error}</div>}
      </div>
      <div>
        <label style={labelStyle}>Sales</label>
        <select value={salesId} onChange={e => setSalesId(e.target.value)} style={selectStyle}>
          {adminUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>NetSuite Customer ID</label>
        <input value={netsuiteId} onChange={e => setNetsuiteId(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Jurnal ID Customer ID</label>
        <input value={jurnalId} onChange={e => setJurnalId(e.target.value)} style={inputStyle} />
      </div>
    </FormDrawer>
  );
}
