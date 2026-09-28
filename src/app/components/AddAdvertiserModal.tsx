import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import type { DspName } from '../pages/Advertiser';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; domain: string; dsp: DspName }) => void;
}

const DSP_OPTIONS: DspName[] = ['LYNX Dummy DSP #A', 'LYNX Dummy DSP #B'];

function Field({ label, required, error, helper, children }: { label: string; required?: boolean; error?: string; helper?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#DC2626' }}>{error}</span>}
      {helper && !error && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{helper}</span>}
    </div>
  );
}

export function AddAdvertiserModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [dsp, setDsp] = useState<DspName>('LYNX Dummy DSP #A');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (open) {
      setName('');
      setDomain('');
      setDsp('LYNX Dummy DSP #A');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  const handleCreate = () => {
    if (!name.trim()) {
      setErrors({ name: 'Advertiser name is required' });
      return;
    }
    onCreate({ name: name.trim(), domain: domain.trim(), dsp });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', backgroundColor: 'var(--input-background)',
    color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={e => e.stopPropagation()}
            style={{ width: '480px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  DSP · Advertiser
                </div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
                  New advertiser
                </h3>
              </div>
              <button
                onClick={onClose}
                style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Field label="Advertiser name" required error={errors.name}>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); if (errors.name) setErrors({}); }}
                  placeholder="e.g. Nestlé Indonesia"
                  style={{ ...inputStyle, borderColor: errors.name ? '#DC2626' : 'var(--border)' }}
                />
              </Field>

              <Field label="Domain" helper="Used to match advertiser with buyer seat in OpenRTB.">
                <input
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g. example.co.id"
                  style={inputStyle}
                />
              </Field>

              <Field label="DSP" required>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {DSP_OPTIONS.map(opt => {
                    const selected = dsp === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDsp(opt)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
                          borderRadius: 'var(--radius)', textAlign: 'left', cursor: 'pointer',
                          border: `1.5px solid ${selected ? '#7C3AED' : 'var(--border)'}`,
                          backgroundColor: selected ? 'rgba(124,58,237,0.06)' : 'var(--card)',
                          fontFamily: 'var(--font-family-geist)',
                        }}
                      >
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${selected ? '#7C3AED' : 'var(--border)'}`,
                          backgroundColor: selected ? '#7C3AED' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={9} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: selected ? 600 : 500, color: selected ? '#7C3AED' : 'var(--foreground)' }}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexShrink: 0, backgroundColor: 'var(--muted)' }}>
              <button
                onClick={onClose}
                style={{ padding: '9px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Create advertiser
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
