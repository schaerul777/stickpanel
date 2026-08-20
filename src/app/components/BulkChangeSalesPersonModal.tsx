import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Check, Loader } from 'lucide-react';
import type { Client } from '../pages/Clients';
import { SALES_PERSONS } from '../pages/Clients';

interface Props {
  open: boolean;
  clients: Client[];
  onClose: () => void;
  onSave: (salesPerson: { id: string; name: string; initials: string }) => void;
}

export function BulkChangeSalesPersonModal({ open, clients, onClose, onSave }: Props) {
  const [selectedId, setSelectedId] = useState(SALES_PERSONS[0].id);
  const [notify,     setNotify]     = useState(true);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => { if (open) { setSaving(false); setSelectedId(SALES_PERSONS[0].id); setNotify(true); } }, [open]);

  const handleSave = () => {
    setSaving(true);
    const sp = SALES_PERSONS.find(s => s.id === selectedId) ?? SALES_PERSONS[0];
    setTimeout(() => { onSave(sp); setSaving(false); }, 600);
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '480px', maxWidth: '100%', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>Change Sales Person</h3>
                <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>This will update {clients.length} client{clients.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}><X size={15} /></button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Client list preview */}
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Selected Clients</div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                  {clients.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px' }}>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 500 }}>{c.companyName}</span>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{c.salesPerson.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales person selector */}
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>New Sales Person</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SALES_PERSONS.map(sp => {
                    const sel = selectedId === sp.id;
                    const colors = ['#7C3AED','#2563EB','#16A34A','#EA580C','#DB2777'];
                    const color = colors[sp.initials.charCodeAt(0) % colors.length];
                    return (
                      <label key={sp.id} onClick={() => setSelectedId(sp.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius)', border: `2px solid ${sel ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: sel ? 'rgba(124,58,237,0.06)' : 'var(--color-secondary)', cursor: 'pointer', transition: 'all 0.12s' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, flexShrink: 0 }}>{sp.initials}</div>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: sel ? 600 : 400, color: sel ? '#7C3AED' : 'var(--color-foreground)', flex: 1 }}>{sp.name}</span>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${sel ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: sel ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <Check size={9} color="white" strokeWidth={3} />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notify checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setNotify(n => !n)}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${notify ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: notify ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {notify && <Check size={9} color="white" strokeWidth={3} />}
                </div>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>Notify new sales person via email</span>
              </label>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: 'var(--color-secondary)' }}>
              <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: saving ? '#A78BFA' : '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : `Update ${clients.length} Client${clients.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
