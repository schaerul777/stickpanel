import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Plus, Trash2, User, Mail, Phone, Check, Loader } from 'lucide-react';
import type { Client, ContactPerson } from '../pages/Clients';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (contacts: ContactPerson[]) => void;
}

const emptyContact = (): ContactPerson => ({
  id: `C-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: '', position: '', email: '', mobile: '', isPrimary: false,
});

function fmtMobile(raw: string) {
  const d = raw.replace(/\D/g,'').slice(0,13);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0,4)}-${d.slice(4)}`;
  return `${d.slice(0,4)}-${d.slice(4,8)}-${d.slice(8)}`;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#DC2626' }}>{error}</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, icon, hasError }: { value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode; hasError?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }}>{icon}</div>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: `8px 10px 8px ${icon ? '32px' : '10px'}`, borderRadius: 'var(--radius)', border: `1px solid ${hasError ? '#DC2626' : 'var(--color-border)'}`, backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

export function ManageContactsModal({ open, client, onClose, onSave }: Props) {
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && client) {
      setErrors({});
      setSaving(false);
      setContacts(client.contacts.length ? JSON.parse(JSON.stringify(client.contacts)) : [{ ...emptyContact(), isPrimary: true }]);
    }
  }, [open, client]);

  const update = (id: string, field: keyof ContactPerson, val: string | boolean) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    setErrors(prev => { const n = { ...prev }; if (n[id]) delete n[id][field as string]; return n; });
  };

  const setPrimary = (id: string) => setContacts(prev => prev.map(c => ({ ...c, isPrimary: c.id === id })));

  const remove = (id: string) => {
    const next = contacts.filter(c => c.id !== id);
    if (!next.some(c => c.isPrimary) && next.length > 0) next[0].isPrimary = true;
    setContacts(next);
  };

  const add = () => {
    if (contacts.length >= 10) return;
    setContacts(prev => [...prev, emptyContact()]);
  };

  const validate = () => {
    const e: Record<string, Record<string, string>> = {};
    contacts.forEach(c => {
      const ce: Record<string, string> = {};
      if (!c.name.trim()) ce.name = 'Required';
      if (!c.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) ce.email = 'Valid email required';
      if (!c.mobile.trim() || c.mobile.replace(/\D/g,'').length < 10) ce.mobile = 'Valid phone required';
      if (Object.keys(ce).length) e[c.id] = ce;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => { onSave(contacts); setSaving(false); onClose(); }, 500);
  };

  if (!client && !open) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && client && (
        <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '600px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>Manage Contacts</h3>
                <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{client.companyName} · {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}><X size={15} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contacts.map((c, idx) => (
                <div key={c.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>Contact #{idx + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {c.isPrimary
                        ? <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Primary</span>
                        : <button onClick={() => setPrimary(c.id)} style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '2px 8px', cursor: 'pointer' }}>Set Primary</button>}
                      {contacts.length > 1 && (
                        <button onClick={() => remove(c.id)} style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(220,38,38,0.3)', backgroundColor: 'rgba(220,38,38,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <Field label="Name" required error={errors[c.id]?.name}>
                        <Inp value={c.name} onChange={v => update(c.id,'name',v)} placeholder="Full Name" icon={<User size={12} />} hasError={!!errors[c.id]?.name} />
                      </Field>
                      <Field label="Position">
                        <Inp value={c.position} onChange={v => update(c.id,'position',v)} placeholder="Marketing Manager" />
                      </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <Field label="Email" required error={errors[c.id]?.email}>
                        <Inp value={c.email} onChange={v => update(c.id,'email',v)} placeholder="email@company.com" icon={<Mail size={12} />} hasError={!!errors[c.id]?.email} />
                      </Field>
                      <Field label="Mobile" required error={errors[c.id]?.mobile}>
                        <Inp value={c.mobile} onChange={v => update(c.id,'mobile',fmtMobile(v))} placeholder="0812-xxxx-xxxx" icon={<Phone size={12} />} hasError={!!errors[c.id]?.mobile} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
              {contacts.length < 10 && (
                <button onClick={add} style={{ padding: '10px', borderRadius: 'var(--radius)', border: '1px dashed #2563EB', backgroundColor: 'rgba(37,99,235,0.04)', color: '#2563EB', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Plus size={14} /> Add Another Contact ({contacts.length}/10)
                </button>
              )}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: 'var(--color-secondary)' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Close</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: saving ? '#A78BFA' : '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Check size={13} /> Save Contacts</>}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
