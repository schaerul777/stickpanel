import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Building2 } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { ImageUpload } from '../../components/master/ImageUpload';
import { inputStyle, labelStyle, helperStyle, errorTextStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import { getCompany, isCompanyNameTaken, upsertCompany } from '../../core/masterStore';

const textareaStyle = { ...inputStyle, minHeight: 90, resize: 'vertical' as const, fontFamily: 'var(--font-family-geist)' };

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  return <div style={{ ...helperStyle, textAlign: 'right' }}>{value.length}/{max}</div>;
}

const MAX_TEXTAREA = 2000;

export function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? getCompany(id) : undefined;
  const { toasts, showToast, dismiss } = useToast();

  const [name, setName] = useState(existing?.name ?? '');
  const [abbr, setAbbr] = useState(existing?.abbr ?? '');
  const [increment, setIncrement] = useState(existing?.increment ?? 0);
  const [logo, setLogo] = useState<string | null>(existing?.logo ?? null);
  const [address, setAddress] = useState(existing?.address ?? '');
  const [url, setUrl] = useState(existing?.url ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [customerData, setCustomerData] = useState(existing?.customerData ?? '');
  const [cancellationPolicy, setCancellationPolicy] = useState(existing?.cancellationPolicy ?? '');
  const [termsAndConditions, setTermsAndConditions] = useState(existing?.termsAndConditions ?? '');
  const [paymentTo, setPaymentTo] = useState(existing?.paymentTo ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleAbbrChange = (v: string) => setAbbr(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = 'Name is required';
    else if (isCompanyNameTaken(trimmedName, existing?.id)) e.name = 'This name already exists';
    if (!abbr.trim()) e.abbr = 'Abbreviation is required';
    if (increment < 0) e.increment = 'Increment must be 0 or more';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertCompany({
        name: trimmedName, abbr, increment, logo, address, url, phone,
        notes, customerData, cancellationPolicy, termsAndConditions, paymentTo,
      }, existing?.id);
      setSaving(false);
      showToast('success', existing ? 'Company updated' : 'Company added', existing ? 'Changes have been saved.' : 'New company has been added.');
      navigate('/core-4/master/company');
    }, 350);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{
        position: 'sticky', top: 0, zIndex: 10, marginBottom: 20,
        backgroundColor: 'var(--color-secondary)', paddingBottom: 12,
      }}>
        <PageHeader
          core="core-4"
          trail={['Master', 'Company', existing ? existing.name : 'Add Company']}
          title={existing ? `Edit ${existing.name}` : 'Add Company'}
          subtitle="Manage company details used on quotations"
          actions={
            <>
              <button style={secondaryButtonStyle} onClick={() => navigate('/core-4/master/company')}>Cancel</button>
              <button style={{ ...primaryButtonStyle, opacity: saving ? 0.75 : 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <CardSection title="General">
            <div>
              <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
              {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Abbr <span style={{ color: '#EF4444' }}>*</span></label>
                <input value={abbr} maxLength={10} onChange={e => { handleAbbrChange(e.target.value); if (errors.abbr) setErrors(x => ({ ...x, abbr: '' })); }} style={{ ...inputStyle, fontFamily: 'monospace', borderColor: errors.abbr ? '#EF4444' : 'var(--color-border)' }} />
                {errors.abbr ? <div style={errorTextStyle}>{errors.abbr}</div> : <div style={helperStyle}>Max 10 characters, auto-uppercased</div>}
              </div>
              <div>
                <label style={labelStyle}>Increment</label>
                <input type="number" min={0} value={increment} onChange={e => { setIncrement(Number(e.target.value)); if (errors.increment) setErrors(x => ({ ...x, increment: '' })); }} style={{ ...inputStyle, borderColor: errors.increment ? '#EF4444' : 'var(--color-border)' }} />
                {errors.increment ? <div style={errorTextStyle}>{errors.increment}</div> : <div style={helperStyle}>Running counter used for quotation numbering</div>}
              </div>
            </div>

            <ImageUpload label="Logo" value={logo} onChange={setLogo} />

            <div>
              <label style={labelStyle}>Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} style={textareaStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>URL</label>
                <input value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </CardSection>

          <CardSection title="Quotation PDF Content">
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={notes} maxLength={MAX_TEXTAREA} onChange={e => setNotes(e.target.value)} style={textareaStyle} />
              <CharCounter value={notes} max={MAX_TEXTAREA} />
            </div>
            <div>
              <label style={labelStyle}>Customer Data</label>
              <textarea value={customerData} maxLength={MAX_TEXTAREA} onChange={e => setCustomerData(e.target.value)} style={textareaStyle} />
              <CharCounter value={customerData} max={MAX_TEXTAREA} />
            </div>
            <div>
              <label style={labelStyle}>Cancellation Policy</label>
              <textarea value={cancellationPolicy} maxLength={MAX_TEXTAREA} onChange={e => setCancellationPolicy(e.target.value)} style={textareaStyle} />
              <CharCounter value={cancellationPolicy} max={MAX_TEXTAREA} />
            </div>
            <div>
              <label style={labelStyle}>Terms and Condition</label>
              <textarea value={termsAndConditions} maxLength={MAX_TEXTAREA} onChange={e => setTermsAndConditions(e.target.value)} style={textareaStyle} />
              <CharCounter value={termsAndConditions} max={MAX_TEXTAREA} />
            </div>
          </CardSection>

          <CardSection title="Payment">
            <div>
              <label style={labelStyle}>Payment To</label>
              <textarea value={paymentTo} onChange={e => setPaymentTo(e.target.value)} style={textareaStyle} />
              <div style={helperStyle}>Bank/account details printed on the quotation</div>
            </div>
          </CardSection>
        </div>

        <div style={{ position: 'sticky', top: 90 }}>
          <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>
              Quotation Header Preview
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 'var(--radius)', border: '1px dashed var(--color-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {logo ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={18} style={{ color: 'var(--color-muted-foreground)' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 700, color: 'var(--color-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name || 'Company Name'}
                </div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                  {abbr || 'ABBR'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
