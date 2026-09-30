import { useNavigate } from 'react-router';
import { FileText, ShieldCheck, ShieldOff } from 'lucide-react';
import { primaryButtonStyle, secondaryButtonStyle, helperStyle } from '../../../../components/master/styles';
import { StatusPill } from '../../../../components/master/StatusPill';
import { useMasterData } from '../../../../core/masterStore';
import { useClientProfileUI, hasPermission } from '../../../../core/clientProfileUI';
import { getLink, setLinkVerified, adminUsers, type ClientRecord } from '../../../../core/clientProfileStore';
import type { ToastType } from '../../../../components/Toast';

interface TabProps {
  client: ClientRecord;
  showToast: (type: ToastType, title: string, message?: string) => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{value || '—'}</div>
    </div>
  );
}

const CURRENT_ADMIN_NAME = adminUsers[0]?.name ?? 'Admin';

export function ProfileTab({ client, showToast }: TabProps) {
  const navigate = useNavigate();
  const masterData = useMasterData();
  const { activeCompanyId } = useClientProfileUI();
  const link = getLink(client.id, activeCompanyId);
  const company = masterData.companies.find(c => c.id === activeCompanyId);

  const city = masterData.cities.find(c => c.id === client.cityId)?.name ?? '—';
  const industry = masterData.industries.find(c => c.id === client.industryId)?.name ?? '—';
  const sales = adminUsers.find(u => u.id === link?.salesId)?.name ?? '—';

  const docs: { label: string; value: string | null }[] = [
    { label: 'Tax Document', value: client.documents.taxDocument },
    { label: 'SIUP', value: client.documents.siup },
    { label: 'TDP', value: client.documents.tdp },
    { label: 'Domisili', value: client.documents.domisili },
  ];

  const handleToggleVerify = () => {
    if (!link) return;
    const nextVerified = !link.verified;
    setLinkVerified(link.id, nextVerified, nextVerified ? CURRENT_ADMIN_NAME : null);
    showToast('success', nextVerified ? 'Client verified' : 'Verification removed', nextVerified ? `Verified for ${company?.name ?? 'this company'}.` : undefined);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Profile</div>
          {hasPermission('client-profile:write') && (
            <button style={secondaryButtonStyle} onClick={() => navigate(`/core-4/master/client-profile/${client.id}/edit`)}>Edit</button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Field label="Name" value={client.name} />
          <Field label="Brand" value={client.brandText} />
          <Field label="Email" value={client.email} />
          <Field label="Website" value={client.website} />
          <Field label="City" value={city} />
          <Field label="Zip Code" value={client.zipCode} />
          <Field label="Industry" value={industry} />
          <Field label="Tax Number" value={client.taxNumber} />
        </div>
        <Field label="Billing Address" value={client.billingAddress} />

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Documents</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {docs.map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                <FileText size={14} style={{ color: d.value ? '#7C3AED' : 'var(--color-muted-foreground)' }} />
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: d.value ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}>{d.label}</span>
                {d.value && <a href={d.value} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#7C3AED' }}>View</a>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 16 }}>
          This Company{company ? ` — ${company.name}` : ''}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Field label="Sales" value={sales} />
          <Field label="Verified" value={link?.verified ? <StatusPill label="Verified" tone="success" /> : <StatusPill label="Not verified" tone="neutral" />} />
          <Field label="Verified By" value={link?.verifiedBy} />
          <Field label="Verified At" value={link?.verifiedAt ? new Date(link.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
        </div>
        {hasPermission('client-profile:verify') && link && (
          <button style={link.verified ? secondaryButtonStyle : primaryButtonStyle} onClick={handleToggleVerify}>
            {link.verified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />} {link.verified ? 'Unverify' : 'Verify'}
          </button>
        )}
        <div style={{ ...helperStyle, marginTop: 10 }}>Only verified clients can be selected in Quotation for this company.</div>
      </div>
    </div>
  );
}
