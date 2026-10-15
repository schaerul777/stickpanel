import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../../components/master/PageHeader';
import { ImageUpload } from '../../../components/master/ImageUpload';
import { ActiveCompanyBar } from '../../../components/master/ActiveCompanyBar';
import { inputStyle, selectStyle, labelStyle, helperStyle, errorTextStyle, primaryButtonStyle, secondaryButtonStyle } from '../../../components/master/styles';
import { useToast, ToastContainer } from '../../../components/Toast';
import { useMasterData } from '../../../core/masterStore';
import { useClientProfileUI } from '../../../core/clientProfileUI';
import {
  getClient, upsertClient, addCompanyLink, getLink,
  adminUsers,
} from '../../../core/clientProfileStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

export function ClientProfileForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? getClient(id) : undefined;
  const masterData = useMasterData();
  const { activeCompanyId } = useClientProfileUI();
  const { toasts, showToast, dismiss } = useToast();

  const [name, setName] = useState(existing?.name ?? '');
  const [brandText, setBrandText] = useState(existing?.brandText ?? '');
  const [brandId, setBrandId] = useState(existing?.brandId ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [website, setWebsite] = useState(existing?.website ?? '');
  const [cityId, setCityId] = useState(existing?.cityId ?? masterData.cities[0]?.id ?? '');
  const [phoneNumber, setPhoneNumber] = useState(existing?.phoneNumber ?? '');
  const [mainImage, setMainImage] = useState<string | null>(existing?.mainImage ?? null);
  const [npwpImage, setNpwpImage] = useState<string | null>(existing?.npwpImage ?? null);
  const [digitalImage, setDigitalImage] = useState<string | null>(existing?.digitalImage ?? null);

  const [salesId, setSalesId] = useState(adminUsers[0]?.id ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const existingLink = existing ? getLink(existing.id, activeCompanyId) : undefined;

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
    if (!cityId) e.cityId = 'City is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      const newId = upsertClient({
        name: name.trim(), brandText: brandText.trim(), brandId: brandId || null,
        email: email.trim(), website: website.trim(), cityId, phoneNumber: phoneNumber.trim(),
        mainImage, npwpImage, digitalImage,
      }, existing?.id);

      if (!existing && activeCompanyId) {
        addCompanyLink(newId, activeCompanyId, salesId, '', '');
      }

      setSaving(false);
      showToast('success', existing ? 'Client updated' : 'Client added', existing ? 'Changes have been saved.' : 'New client has been added.');
      navigate(existing ? `/core-4/master/client-profile/${existing.id}` : `/core-4/master/client-profile/${newId}`);
    }, 350);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{ position: 'sticky', top: 0, zIndex: 10, marginBottom: 12, backgroundColor: 'var(--color-secondary)', paddingBottom: 12 }}>
        <PageHeader
          core="core-4"
          trail={['Master', 'Client Profile', existing ? existing.name : 'Add Client']}
          title={existing ? `Edit ${existing.name}` : 'Add Client'}
          subtitle="Client details shared across every company it's linked to"
          actions={
            <>
              <button style={secondaryButtonStyle} onClick={() => navigate(existing ? `/core-4/master/client-profile/${existing.id}` : '/core-4/master/client-profile')}>Cancel</button>
              <button style={{ ...primaryButtonStyle, opacity: saving ? 0.75 : 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        />
        {!existing && <ActiveCompanyBar />}
      </div>

      <CardSection title="Client Details">
        <div>
          <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
          <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
          {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Brand (free text)</label>
            <input value={brandText} onChange={e => setBrandText(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Brand (from Master Brand)</label>
            <select value={brandId} onChange={e => setBrandId(e.target.value)} style={selectStyle}>
              <option value="">—</option>
              {masterData.brands.filter(b => !b.deletedAt).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(x => ({ ...x, email: '' })); }} style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : 'var(--color-border)' }} />
            {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>City <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={cityId} onChange={e => { setCityId(e.target.value); if (errors.cityId) setErrors(x => ({ ...x, cityId: '' })); }} style={{ ...selectStyle, borderColor: errors.cityId ? '#EF4444' : 'var(--color-border)' }}>
              {masterData.cities.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </CardSection>

      <CardSection title="Images">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <ImageUpload label="Main Image" value={mainImage} onChange={setMainImage} />
          <ImageUpload label="NPWP Image" value={npwpImage} onChange={setNpwpImage} />
          <ImageUpload label="Digital Image" value={digitalImage} onChange={setDigitalImage} />
        </div>
      </CardSection>

      {!existing && (
        <CardSection title="This Company's Link">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Company</label>
              <input disabled value={masterData.companies.find(c => c.id === activeCompanyId)?.name ?? '—'} style={{ ...inputStyle, backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)' }} />
            </div>
            <div>
              <label style={labelStyle}>Sales</label>
              <select value={salesId} onChange={e => setSalesId(e.target.value)} style={selectStyle}>
                {adminUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Verified By</label>
              <input disabled value="—" style={{ ...inputStyle, backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)' }} />
            </div>
            <div>
              <label style={labelStyle}>Verified At</label>
              <input disabled value="—" style={{ ...inputStyle, backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)' }} />
            </div>
          </div>
          <div style={helperStyle}>Blank until verified from the client's Profile tab.</div>
        </CardSection>
      )}

      {existing && existingLink && (
        <div style={helperStyle}>
          This company's Sales / Verified status is managed from the Companies tab on the client's detail page.
        </div>
      )}
    </div>
  );
}
