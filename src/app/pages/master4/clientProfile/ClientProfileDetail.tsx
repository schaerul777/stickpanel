import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { StatusPill } from '../../../components/master/StatusPill';
import { ActiveCompanyBar } from '../../../components/master/ActiveCompanyBar';
import { secondaryButtonStyle } from '../../../components/master/styles';
import { useToast, ToastContainer } from '../../../components/Toast';
import { CORE_META } from '../../../core/coreConfig';
import { useMasterData } from '../../../core/masterStore';
import { useClientProfileUI } from '../../../core/clientProfileUI';
import { useClientProfileData, getClient, getLink, isClientLinkedToCompany } from '../../../core/clientProfileStore';
import { ProfileTab } from './tabs/ProfileTab';
import { ContactsTab } from './tabs/ContactsTab';
import { BillingsTab } from './tabs/BillingsTab';
import { BankAccountsTab } from './tabs/BankAccountsTab';
import { CompaniesTab } from './tabs/CompaniesTab';

type TabKey = 'profile' | 'contacts' | 'billings' | 'bank-accounts' | 'companies';

export function ClientProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  useClientProfileData();
  const masterData = useMasterData();
  const { activeCompanyId } = useClientProfileUI();
  const { toasts, showToast, dismiss } = useToast();

  const client = id ? getClient(id) : undefined;
  const [tab, setTab] = useState<TabKey>(
    (location.state as any)?.openAddCompany ? 'companies' : 'profile'
  );

  useEffect(() => {
    if (!client || !activeCompanyId) return;
    if (!isClientLinkedToCompany(client.id, activeCompanyId)) {
      const company = masterData.companies.find(c => c.id === activeCompanyId);
      navigate('/core-4/master/client-profile', {
        replace: true,
        state: { toast: { type: 'warning', title: `This client isn't linked to ${company?.name ?? 'the active company'}.` } },
      });
    }
  }, [client, activeCompanyId]);

  if (!client) {
    return (
      <div style={{ fontFamily: 'var(--font-family-geist)', color: 'var(--color-muted-foreground)' }}>
        Client not found. <button style={secondaryButtonStyle} onClick={() => navigate('/core-4/master/client-profile')}>Back to list</button>
      </div>
    );
  }

  const link = getLink(client.id, activeCompanyId);

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'billings', label: 'Billings' },
    { key: 'bank-accounts', label: 'Bank Accounts' },
    { key: 'companies', label: 'Companies' },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{CORE_META['core-4'].label}</span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Master</span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
        <span
          onClick={() => navigate('/core-4/master/client-profile')}
          style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', cursor: 'pointer' }}
        >
          Client Profile
        </span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>{client.name}</span>
      </div>

      <ActiveCompanyBar />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/core-4/master/client-profile')} style={{ ...secondaryButtonStyle, padding: '8px' }} aria-label="Back">
            <ArrowLeft size={15} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)', fontWeight: 700, color: 'var(--color-foreground)' }}>{client.name}</h1>
              {link?.verified ? <StatusPill label="Verified" tone="success" /> : <StatusPill label="Not Verified" tone="neutral" />}
            </div>
            {client.brandText && (
              <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>{client.brandText}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', marginBottom: 20 }}>
        {TABS.map(t => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: isActive ? 600 : 400,
                color: isActive ? '#7C3AED' : 'var(--color-muted-foreground)',
                borderBottom: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'color 0.15s', marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profile' && <ProfileTab client={client} showToast={showToast} />}
      {tab === 'contacts' && <ContactsTab client={client} showToast={showToast} />}
      {tab === 'billings' && <BillingsTab client={client} showToast={showToast} />}
      {tab === 'bank-accounts' && <BankAccountsTab client={client} showToast={showToast} />}
      {tab === 'companies' && (
        <CompaniesTab
          client={client}
          showToast={showToast}
          autoOpenAdd={!!(location.state as any)?.openAddCompany}
        />
      )}
    </div>
  );
}
