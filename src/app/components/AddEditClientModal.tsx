import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Building2, Globe, ChevronRight, Check, Plus, Trash2, Upload, FileText, User, Mail, Phone, Loader, CheckCircle, Circle, ChevronDown, Search } from 'lucide-react';
import type { Client, Industry, ContactPerson, ClientDoc, Brand } from '../pages/Clients';
import { INDUSTRY_META, SALES_PERSONS } from '../pages/Clients';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (data: Partial<Client>) => void;
}

const ALL_INDUSTRIES: Industry[] = ['F&B','Retail','Technology','Automotive','Healthcare','Finance','Entertainment','E-commerce','Fashion','Real Estate','Education','Hospitality','Logistics','Other'];

function Field({ label, required, error, helper, children }: { label: string; required?: boolean; error?: string; helper?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error  && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#DC2626' }}>{error}</span>}
      {helper && !error && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{helper}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, icon, type = 'text', hasError, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode; type?: string; hasError?: boolean; disabled?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }}>{icon}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width: '100%', padding: `9px 12px 9px ${icon ? '34px' : '12px'}`, borderRadius: 'var(--radius)', border: `1px solid ${hasError ? '#DC2626' : 'var(--color-border)'}`, backgroundColor: disabled ? 'var(--color-secondary)' : 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box', opacity: disabled ? 0.7 : 1 }} />
    </div>
  );
}

const emptyContact = (): ContactPerson => ({ id: `C-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: '', position: '', email: '', mobile: '', isPrimary: false });
const emptyDocs = (): ClientDoc[] => [{ type: 'siup', uploaded: false }, { type: 'tdp', uploaded: false }, { type: 'domicili', uploaded: false }, { type: 'npwp', uploaded: false }];
const emptyBrand = (): { id: string; name: string } => ({ id: `BRD-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: '' });

export function AddEditClientModal({ open, client, onClose, onSave }: Props) {
  const isEdit = !!client;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Company Info
  const [companyName,  setCompanyName]  = useState('');
  const [brands,       setBrands]       = useState<{ id: string; name: string }[]>([emptyBrand()]);
  const [website,      setWebsite]      = useState('');
  const [industry,     setIndustry]     = useState<Industry>('F&B');
  const [salesPersonId,setSalesPersonId]= useState(SALES_PERSONS[0].id);
  const [errors1, setErrors1] = useState<Record<string, string>>({});
  const [brandErrors, setBrandErrors] = useState<Record<string, string>>({});

  // Step 2: Documents
  const [docs, setDocs] = useState<ClientDoc[]>(emptyDocs());
  const [npwp, setNpwp] = useState('');

  // Step 3: Contacts
  const [contacts, setContacts] = useState<ContactPerson[]>([{ ...emptyContact(), isPrimary: true }]);
  const [errors3, setErrors3]   = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (open) {
      setStep(1); setSaving(false);
      setErrors1({}); setBrandErrors({}); setErrors3({});
      if (client) {
        setCompanyName(client.companyName);
        setBrands(client.brands.map(b => ({ id: b.id, name: b.name })));
        setWebsite(client.website ?? ''); setIndustry(client.industry);
        setSalesPersonId(client.salesPerson.id);
        setDocs(client.documents.length ? [...client.documents] : emptyDocs());
        setNpwp(client.npwp ?? '');
        setContacts(client.contacts.length ? [...client.contacts] : [{ ...emptyContact(), isPrimary: true }]);
      } else {
        setCompanyName(''); setBrands([emptyBrand()]); setWebsite(''); setIndustry('F&B');
        setSalesPersonId(SALES_PERSONS[0].id); setDocs(emptyDocs()); setNpwp('');
        setContacts([{ ...emptyContact(), isPrimary: true }]);
      }
    }
  }, [open, client]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    const be: Record<string, string> = {};
    if (!companyName.trim() || companyName.trim().length < 3) e.companyName = 'Company name must be at least 3 characters';
    if (website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(website)) e.website = 'Please enter a valid URL';
    const validBrands = brands.filter(b => b.name.trim());
    if (validBrands.length === 0) e.brands = 'At least one brand is required';
    brands.forEach(b => {
      if (b.name.trim() && b.name.trim().length < 2) be[b.id] = 'Brand name must be at least 2 characters';
    });
    setErrors1(e); setBrandErrors(be);
    return Object.keys(e).length === 0 && Object.keys(be).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, Record<string, string>> = {};
    contacts.forEach(c => {
      const ce: Record<string, string> = {};
      if (!c.name.trim()) ce.name = 'Name is required';
      if (!c.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) ce.email = 'Valid email is required';
      if (!c.mobile.trim() || c.mobile.replace(/\D/g,'').length < 10) ce.mobile = 'Valid phone is required';
      if (Object.keys(ce).length) e[c.id] = ce;
    });
    setErrors3(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < 3) setStep(s => s + 1);
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;
    setSaving(true);
    const sp = SALES_PERSONS.find(s => s.id === salesPersonId) ?? SALES_PERSONS[0];
    const updatedDocs = docs.map(d => d.type === 'npwp' ? { ...d, uploaded: !!npwp } : d);
    const finalBrands: Brand[] = brands
      .filter(b => b.name.trim())
      .map(b => {
        const existing = client?.brands.find(eb => eb.id === b.id);
        return { id: b.id, name: b.name.trim(), activeCampaigns: existing?.activeCampaigns ?? 0, totalSpend: existing?.totalSpend ?? 0 };
      });
    setTimeout(() => {
      onSave({ companyName, brands: finalBrands, website: website || undefined, industry, salesPerson: sp, contacts, documents: updatedDocs, npwp: npwp || undefined });
      setSaving(false);
    }, 700);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  const toggleDocUploaded = (type: string) => {
    setDocs(prev => prev.map(d => d.type === type ? { ...d, uploaded: !d.uploaded, filename: !d.uploaded ? `${type.toUpperCase()}_${companyName.replace(/\s/g,'_')}.pdf` : undefined, size: !d.uploaded ? `${(Math.random()*3+1).toFixed(1)} MB` : undefined, uploadedAt: !d.uploaded ? 'Feb 20, 2025' : undefined, uploadedBy: !d.uploaded ? 'You' : undefined } : d));
  };

  const uploadedCount = docs.filter(d => d.uploaded).length + (npwp ? 1 : 0) - (docs.find(d => d.type === 'npwp')?.uploaded && !npwp ? 0 : 0);
  const realUploadCount = docs.filter(d => d.type !== 'npwp' && d.uploaded).length + (npwp ? 1 : 0);

  const addContact = () => {
    if (contacts.length >= 10) return;
    setContacts(prev => [...prev, emptyContact()]);
  };

  const removeContact = (id: string) => {
    const filtered = contacts.filter(c => c.id !== id);
    // ensure one primary
    if (!filtered.some(c => c.isPrimary) && filtered.length > 0) filtered[0].isPrimary = true;
    setContacts(filtered);
  };

  const setPrimary = (id: string) => setContacts(prev => prev.map(c => ({ ...c, isPrimary: c.id === id })));

  const updateContact = (id: string, field: keyof ContactPerson, val: string | boolean) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    if (errors3[id]) setErrors3(prev => { const n = { ...prev }; if (n[id]) delete n[id][field as string]; return n; });
  };

  const addBrand = () => { if (brands.length < 10) setBrands(prev => [...prev, emptyBrand()]); };
  const removeBrand = (id: string) => { if (brands.length > 1) setBrands(prev => prev.filter(b => b.id !== id)); };
  const updateBrand = (id: string, name: string) => { setBrands(prev => prev.map(b => b.id === id ? { ...b, name } : b)); if (brandErrors[id]) setBrandErrors(p => { const n = {...p}; delete n[id]; return n; }); };

  const STEP_LABELS = ['Company Info', 'Documents', 'Contacts'];

  const iMeta = INDUSTRY_META[industry];

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={e => e.stopPropagation()}
            style={{ width: '700px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                  {isEdit ? `Edit Client: ${client.companyName}` : 'Add New Client'}
                </h3>
                <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                  Step {step} of 3 — {STEP_LABELS[step - 1]}
                </p>
              </div>
              <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
                <X size={15} />
              </button>
            </div>

            {/* Step Progress */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, backgroundColor: 'var(--color-secondary)' }}>
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const active = step === n;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => { if (n < step || (n === 2 && validateStep1())) setStep(n); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: n <= step ? 'pointer' : 'default', padding: 0 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: done ? '#7C3AED' : active ? '#7C3AED' : 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.2s' }}>
                        {done ? <Check size={12} color="white" strokeWidth={3} /> : <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: active ? 'white' : 'var(--color-muted-foreground)' }}>{n}</span>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? '#7C3AED' : done ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}>{label}</span>
                    </button>
                    {i < 2 && <ChevronRight size={14} style={{ color: 'var(--color-border)', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              {/* ── Step 1: Company Info ── */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Logo Upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius)', backgroundColor: iMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={28} style={{ color: iMeta.color }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)', marginBottom: '4px' }}>Company Logo</div>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginBottom: '8px' }}>JPG, PNG (max 2MB) — Optional</div>
                      <button style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Upload size={12} /> Upload Logo
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                    <Field label="Company Name" required error={errors1.companyName}>
                      <Input value={companyName} onChange={v => { setCompanyName(v); setErrors1(p => ({...p, companyName: ''})); }} placeholder="e.g., PT Kopi Kenangan Indonesia" icon={<Building2 size={14} />} hasError={!!errors1.companyName} />
                    </Field>
                  </div>

                  <Field label="Website" error={errors1.website}>
                    <Input value={website} onChange={v => { setWebsite(v); setErrors1(p => ({...p, website: ''})); }} placeholder="https://www.kopikenangan.com" icon={<Globe size={14} />} hasError={!!errors1.website} />
                  </Field>

                  <Field label="Industry" required>
                    <IndustrySelect value={industry} onChange={setIndustry} />
                  </Field>

                  <Field label="Sales Person" required>
                    <SalesPersonSelect value={salesPersonId} onChange={setSalesPersonId} />
                  </Field>

                  {/* ── Brands Section ── */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700, color: 'var(--color-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brands</div>
                        {errors1.brands && <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: '#DC2626', marginTop: '2px' }}>{errors1.brands}</div>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{brands.filter(b => b.name.trim()).length} brand{brands.filter(b => b.name.trim()).length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {brands.map((brand, idx) => (
                        <div key={brand.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '10px', fontWeight: 700, color: '#7C3AED' }}>{idx + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              placeholder={`Brand name ${idx + 1}${idx === 0 ? ' (required)' : ''}`}
                              value={brand.name}
                              onChange={e => updateBrand(brand.id, e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: `1px solid ${brandErrors[brand.id] ? '#DC2626' : 'var(--color-border)'}`, backgroundColor: 'var(--color-input-background)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box' }}
                              onFocus={e => { e.target.style.borderColor = brandErrors[brand.id] ? '#DC2626' : '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                              onBlur={e  => { e.target.style.borderColor = brandErrors[brand.id] ? '#DC2626' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                            />
                            {brandErrors[brand.id] && <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: '#DC2626', marginTop: '3px' }}>{brandErrors[brand.id]}</div>}
                          </div>
                          {brands.length > 1 && (
                            <button type="button" onClick={() => removeBrand(brand.id)} style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220,38,38,0.2)', backgroundColor: 'rgba(220,38,38,0.05)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      {brands.length < 10 && (
                        <button type="button" onClick={addBrand} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: 'fit-content' }}>
                          <Plus size={13} /> Add Another Brand
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Documents ── */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '8px' }}>Document Completion</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                      {[
                        { key: 'siup',     label: 'SIUP',     done: docs.find(d => d.type==='siup')?.uploaded },
                        { key: 'tdp',      label: 'TDP',      done: docs.find(d => d.type==='tdp')?.uploaded },
                        { key: 'domicili', label: 'Domisili', done: docs.find(d => d.type==='domicili')?.uploaded },
                        { key: 'npwp',     label: 'NPWP',     done: !!npwp },
                      ].map(d => (
                        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {d.done ? <CheckCircle size={14} style={{ color: '#16A34A' }} /> : <Circle size={14} style={{ color: 'var(--color-border)' }} />}
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: d.done ? '#16A34A' : 'var(--color-muted-foreground)', fontWeight: d.done ? 600 : 400 }}>{d.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                      {realUploadCount} of 4 documents provided
                    </div>
                  </div>

                  {/* File uploads */}
                  {docs.filter(d => d.type !== 'npwp').map(doc => {
                    const LABELS: Record<string, string> = { siup: 'SIUP (Surat Izin Usaha Perdagangan)', tdp: 'TDP (Tanda Daftar Perusahaan)', domicili: 'Surat Domisili Perusahaan' };
                    return (
                      <div key={doc.type}>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>
                          {LABELS[doc.type]} <span style={{ fontWeight: 400, color: 'var(--color-muted-foreground)', fontSize: '12px' }}>— Optional</span>
                        </div>
                        {doc.uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 'var(--radius)', backgroundColor: 'rgba(22,163,74,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={15} style={{ color: '#16A34A' }} />
                              <div>
                                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground)' }}>{doc.filename}</div>
                                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{doc.size}</div>
                              </div>
                            </div>
                            <button onClick={() => toggleDocUploaded(doc.type)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => toggleDocUploaded(doc.type)} style={{ padding: '20px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#7C3AED'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                            <Upload size={18} style={{ color: 'var(--color-muted-foreground)', marginBottom: '6px' }} />
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#2563EB', fontWeight: 500 }}>Click to upload {doc.type.toUpperCase()}</div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>PDF, JPG, PNG — max 5MB</div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* NPWP Number */}
                  <Field label="NPWP Number" helper="Nomor Pokok Wajib Pajak — 15 digits">
                    <Input value={npwp} onChange={v => setNpwp(fmtNpwp(v))} placeholder="00.000.000.0-000.000" />
                  </Field>
                </div>
              )}

              {/* ── Step 3: Contacts ── */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                    Add at least one primary contact person. ({contacts.length}/10 contacts)
                  </div>
                  {contacts.map((c, idx) => (
                    <div key={c.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>Contact Person #{idx + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {c.isPrimary && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Primary</span>}
                          {contacts.length > 1 && (
                            <button onClick={() => removeContact(c.id)} style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(220,38,38,0.3)', backgroundColor: 'rgba(220,38,38,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <Field label="Full Name" required error={errors3[c.id]?.name}>
                            <Input value={c.name} onChange={v => updateContact(c.id, 'name', v)} placeholder="e.g., Sarah Johnson" icon={<User size={13} />} hasError={!!errors3[c.id]?.name} />
                          </Field>
                          <Field label="Position / Role">
                            <Input value={c.position} onChange={v => updateContact(c.id, 'position', v)} placeholder="e.g., Marketing Manager" />
                          </Field>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <Field label="Email Address" required error={errors3[c.id]?.email}>
                            <Input value={c.email} onChange={v => updateContact(c.id, 'email', v)} placeholder="sarah.j@company.com" icon={<Mail size={13} />} type="email" hasError={!!errors3[c.id]?.email} />
                          </Field>
                          <Field label="Mobile Number" required error={errors3[c.id]?.mobile}>
                            <Input value={c.mobile} onChange={v => updateContact(c.id, 'mobile', fmtMobile(v))} placeholder="0812-xxxx-xxxx" icon={<Phone size={13} />} hasError={!!errors3[c.id]?.mobile} />
                          </Field>
                        </div>
                        {!c.isPrimary && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setPrimary(c.id)}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${c.isPrimary ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: c.isPrimary ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {c.isPrimary && <Check size={9} color="white" strokeWidth={3} />}
                            </div>
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>Set as primary contact</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                  {contacts.length < 10 && (
                    <button onClick={addContact} style={{ padding: '10px', borderRadius: 'var(--radius)', border: '1px dashed #2563EB', backgroundColor: 'rgba(37,99,235,0.04)', color: '#2563EB', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Plus size={14} /> Add Another Contact
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: 'var(--color-secondary)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>
                    ← Previous
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '9px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>
                  Save as Draft
                </button>
                {step < 3 ? (
                  <button onClick={handleNext} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer' }}>
                    Next →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: saving ? '#A78BFA' : '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {isEdit ? 'Saving...' : 'Creating...'}</> : isEdit ? 'Save Changes' : '✓ Create Client'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── IndustrySelect ─────────────────────────────────────────────────────────────

function IndustrySelect({ value, onChange }: { value: Industry; onChange: (v: Industry) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as Industry)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '9px 36px 9px 12px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${focused ? '#7C3AED' : 'var(--color-border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
          backgroundColor: 'var(--color-card)',
          color: 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)',
          fontWeight: 400,
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {ALL_INDUSTRIES.map(ind => (
          <option key={ind} value={ind}>{ind}</option>
        ))}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
    </div>
  );
}

// ── SalesPersonSelect ──────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#7C3AED','#2563EB','#16A34A','#EA580C','#DB2777'];

function SalesPersonSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const [rect,   setRect]   = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  const selected  = SALES_PERSONS.find(s => s.id === value) ?? SALES_PERSONS[0];
  const avatarColor = AVATAR_COLORS[selected.initials.charCodeAt(0) % AVATAR_COLORS.length];

  const filtered = search.trim()
    ? SALES_PERSONS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : SALES_PERSONS;

  const openDrop = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(true);
    setSearch('');
  };

  const closeDrop = () => { setOpen(false); setSearch(''); };

  const pick = (id: string) => { onChange(id); closeDrop(); };

  useEffect(() => {
    if (!open) return;
    // Auto-focus search
    setTimeout(() => searchRef.current?.focus(), 20);
    const handleDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || dropRef.current?.contains(e.target as Node)) return;
      closeDrop();
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);

  const dropdown = (open && rect) ? ReactDOM.createPortal(
    <div ref={dropRef} style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 99999, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 28px rgba(0,0,0,0.16)', overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sales person..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.1)'; }}
            onBlur={e  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>
      {/* List */}
      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>No results found</div>
        ) : filtered.map(sp => {
          const isSel = sp.id === value;
          const color = AVATAR_COLORS[sp.initials.charCodeAt(0) % AVATAR_COLORS.length];
          return (
            <div key={sp.id}
              onClick={() => pick(sp.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer', backgroundColor: isSel ? 'rgba(124,58,237,0.06)' : 'transparent', transition: 'background-color 0.1s' }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isSel ? 'rgba(124,58,237,0.06)' : 'transparent'; }}>
              {/* Avatar */}
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, flexShrink: 0 }}>
                {sp.initials}
              </div>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: isSel ? 600 : 400, color: isSel ? '#7C3AED' : 'var(--color-foreground)', flex: 1 }}>
                {sp.name}
              </span>
              {isSel && <Check size={14} style={{ color: '#7C3AED', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? closeDrop : openDrop}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 'var(--radius)', border: `1px solid ${open ? '#7C3AED' : 'var(--color-border)'}`, boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none', backgroundColor: 'var(--color-card)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}>
        {/* Selected avatar */}
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, flexShrink: 0 }}>
          {selected.initials}
        </div>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)', flex: 1 }}>
          {selected.name}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>
      {dropdown}
    </div>
  );
}