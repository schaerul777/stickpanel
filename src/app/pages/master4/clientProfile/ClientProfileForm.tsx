import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../../components/master/PageHeader';
import { FileUpload } from '../../../components/master/FileUpload';
import { ActiveCompanyBar } from '../../../components/master/ActiveCompanyBar';
import { inputStyle, selectStyle, labelStyle, helperStyle, errorTextStyle, primaryButtonStyle, secondaryButtonStyle } from '../../../components/master/styles';
import { useToast, ToastContainer } from '../../../components/Toast';
import { useMasterData } from '../../../core/masterStore';
import { useClientProfileUI } from '../../../core/clientProfileUI';
import {
  getClient, findClientByTaxNumber, upsertClient, addCompanyLink, getLink,
  adminUsers, type ClientDocuments,
} from '../../../core/clientProfileStore';

const textareaStyle = { ...inputStyle, minHeight: 80, resize: 'vertical' as const, fontFamily: 'var(--font-family-geist)' };

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [zipCode, setZipCode] = useState(existing?.zipCode ?? '');
  const [billingAddress, setBillingAddress] = useState(existing?.billingAddress ?? '');
  const [industryId, setIndustryId] = useState(existing?.industryId ?? masterData.industries[0]?.id ?? '');
  const [taxNumber, setTaxNumber] = useState(existing?.taxNumber ?? '');
  const [documents, setDocuments] = useState<ClientDocuments>(existing?.documents ?? { taxDocument: null, siup: null, tdp: null, domisili: null });
  const [docNames, setDocNames] = useState<Record<keyof ClientDocuments, string | null>>({ taxDocument: null, siup: null, tdp: null, domisili: null });

  const [salesId, setSalesId] = useState(adminUsers[0]?.id ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dupDialog, setDupDialog] = useState<{ name: string; clientId: string } | null>(null);

  const existingLink = existing ? getLink(existing.id, activeCompanyId) : undefined;

  const handleTaxNumberBlur = () => {
    const trimmed = taxNumber.trim();
    if (!trimmed) return;
    const match = findClientByTaxNumber(trimmed, existing?.id);
    if (match) setDupDialog({ name: match.name, clientId: match.id });
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
    if (!cityId) e.cityId = 'City is required';
    if (!billingAddress.trim()) e.billingAddress = 'Billing address is required';
    if (!industryId) e.industryId = 'Industry is required';
    if (!taxNumber.trim()) e.taxNumber = 'Tax number is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    const dup = findClientByTaxNumber(taxNumber.trim(), existing?.id);
    if (dup) { setDupDialog({ name: dup.name, clientId: dup.id }); return; }

    setSaving(true);
    setTimeout(() => {
      const newId = upsertClient({
        name: name.trim(), brandText: brandText.trim(), brandId: brandId || null,
        email: email.trim(), website: website.trim(), cityId, zipCode: zipCode.trim(),
        billingAddress: billingAddress.trim(), industryId, taxNumber: taxNumber.trim(), documents,
      }, existing?.id);

      if (!existing && activeCompanyId) {
        addCompanyLink(newId, activeCompanyId, salesId, '', '');
      }

      setSaving(false);
      showToast('success', existing ? 'Client updated' : 'Client added', existing ? 'Changes have been saved.' : 'New client has been added.');
      navigate(existing ? `/core-4/master/client-profile/${existing.id}` : `/core-4/master/client-profile/${newId}`);
    }, 350);
  };

  const setDoc = (key: keyof ClientDocuments) => (dataUrl: string | null, fileName: string | null) => {
    setDocuments(d => ({ ...d, [key]: dataUrl }));
    setDocNames(n => ({ ...n, [key]: fileName }));
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

      <CardSection title="Company Details">
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16 }}>
          <div>
            <label style={labelStyle}>City <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={cityId} onChange={e => { setCityId(e.target.value); if (errors.cityId) setErrors(x => ({ ...x, cityId: '' })); }} style={{ ...selectStyle, borderColor: errors.cityId ? '#EF4444' : 'var(--color-border)' }}>
              {masterData.cities.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Zip Code</label>
            <input value={zipCode} onChange={e => setZipCode(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Billing Address <span style={{ color: '#EF4444' }}>*</span></label>
          <textarea value={billingAddress} onChange={e => { setBillingAddress(e.target.value); if (errors.billingAddress) setErrors(x => ({ ...x, billingAddress: '' })); }} style={{ ...textareaStyle, borderColor: errors.billingAddress ? '#EF4444' : 'var(--color-border)' }} />
          {errors.billingAddress && <div style={errorTextStyle}>{errors.billingAddress}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Industry <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={industryId} onChange={e => setIndustryId(e.target.value)} style={selectStyle}>
              {masterData.industries.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tax Number <span style={{ color: '#EF4444' }}>*</span></label>
            <input
              value={taxNumber}
              onChange={e => { setTaxNumber(e.target.value); if (errors.taxNumber) setErrors(x => ({ ...x, taxNumber: '' })); }}
              onBlur={handleTaxNumberBlur}
              style={{ ...inputStyle, borderColor: errors.taxNumber ? '#EF4444' : 'var(--color-border)' }}
            />
            {errors.taxNumber && <div style={errorTextStyle}>{errors.taxNumber}</div>}
          </div>
        </div>
      </CardSection>

      <CardSection title="Documents">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FileUpload label="Tax Document" value={documents.taxDocument} fileName={docNames.taxDocument} onChange={setDoc('taxDocument')} />
          <FileUpload label="SIUP" value={documents.siup} fileName={docNames.siup} onChange={setDoc('siup')} />
          <FileUpload label="TDP" value={documents.tdp} fileName={docNames.tdp} onChange={setDoc('tdp')} />
          <FileUpload label="Domisili" value={documents.domisili} fileName={docNames.domisili} onChange={setDoc('domisili')} />
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

      {dupDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 440, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 10 }}>
              Client already exists: {dupDialog.name}
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: 20 }}>
              Link to {masterData.companies.find(c => c.id === activeCompanyId)?.name ?? 'this company'}?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={secondaryButtonStyle} onClick={() => setDupDialog(null)}>Cancel</button>
              <button
                style={primaryButtonStyle}
                onClick={() => navigate(`/core-4/master/client-profile/${dupDialog.clientId}`, { state: { openAddCompany: true } })}
              >
                Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
