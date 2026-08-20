import { useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import type { Client } from '../pages/Clients';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onConfirm: () => void;
  onDeactivate: () => void;
}

export function DeleteClientModal({ open, client, onClose, onConfirm, onDeactivate }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  if (!client && !open) return null;

  const handleClose = () => { setConfirmed(false); onClose(); };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && client && (
        <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '480px', maxWidth: '100%', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={20} style={{ color: '#DC2626' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>Delete Client?</h3>
                  <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>This action cannot be undone</p>
                </div>
              </div>
              <button onClick={handleClose} style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete <strong>{client.companyName}</strong>?
              </p>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Client ID',        value: client.id },
                  { label: 'Brands',           value: client.brands.map(b => b.name).join(', ') },
                  { label: 'Active Campaigns', value: `${client.activeCampaigns} (will be cancelled)` },
                  { label: 'Contacts',         value: `${client.contacts.length} (will be deleted)` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground)' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#DC2626', lineHeight: 1.5 }}>
                  All client data, contacts, documents, and campaign history will be permanently deleted.
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }} onClick={() => setConfirmed(c => !c)}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${confirmed ? '#DC2626' : 'var(--color-border)'}`, backgroundColor: confirmed ? '#DC2626' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    {confirmed && <span style={{ color: 'white', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', lineHeight: 1.5 }}>
                    I understand this action is permanent and will cancel all active campaigns
                  </span>
                </label>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#D97706' }}>
                Instead of deleting, you can <button onClick={() => { onDeactivate(); handleClose(); }} style={{ background: 'none', border: 'none', color: '#D97706', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>deactivate this client</button> to preserve data
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: 'var(--color-secondary)' }}>
              <button onClick={handleClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { onDeactivate(); handleClose(); }} style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#D97706', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer' }}>Deactivate Instead</button>
              <button onClick={() => { onConfirm(); handleClose(); }} disabled={!confirmed}
                style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: confirmed ? '#DC2626' : 'rgba(220,38,38,0.3)', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: confirmed ? 'pointer' : 'default', transition: 'background-color 0.15s' }}>
                Delete Permanently
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}