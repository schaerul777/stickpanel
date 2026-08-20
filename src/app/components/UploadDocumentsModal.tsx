import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Upload, FileText, CheckCircle, Circle, Loader } from 'lucide-react';
import type { Client, ClientDoc } from '../pages/Clients';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (docs: ClientDoc[], npwp: string | undefined) => void;
}

const DOC_DEFS = [
  { type: 'siup'     as const, label: 'SIUP', full: 'Surat Izin Usaha Perdagangan' },
  { type: 'tdp'      as const, label: 'TDP',  full: 'Tanda Daftar Perusahaan' },
  { type: 'domicili' as const, label: 'Surat Domisili', full: 'Surat Domisili Perusahaan' },
];

function fmtNpwp(raw: string) {
  const d = raw.replace(/\D/g,'').slice(0,15);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 9) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}.${d.slice(8)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}.${d.slice(8,9)}-${d.slice(9)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}.${d.slice(8,9)}-${d.slice(9,12)}.${d.slice(12)}`;
}

export function UploadDocumentsModal({ open, client, onClose, onSave }: Props) {
  const [docs, setDocs]   = useState<ClientDoc[]>([]);
  const [npwv, setNpwv]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && client) {
      setSaving(false);
      setDocs(client.documents.length ? JSON.parse(JSON.stringify(client.documents)) : [
        { type: 'siup', uploaded: false }, { type: 'tdp', uploaded: false },
        { type: 'domicili', uploaded: false }, { type: 'npwp', uploaded: false },
      ]);
      setNpwv(client.npwp ?? '');
    }
  }, [open, client]);

  const toggle = (type: string) => {
    setDocs(prev => prev.map(d => d.type === type ? {
      ...d, uploaded: !d.uploaded,
      filename: !d.uploaded ? `${type.toUpperCase()}_${client?.companyName.replace(/\s/g,'_') ?? 'doc'}.pdf` : undefined,
      size: !d.uploaded ? `${(Math.random()*3+1).toFixed(1)} MB` : undefined,
      uploadedAt: !d.uploaded ? 'Feb 20, 2025' : undefined,
      uploadedBy: !d.uploaded ? 'You' : undefined,
    } : d));
  };

  const uploaded = docs.filter(d => d.type !== 'npwp' && d.uploaded).length + (npwv ? 1 : 0);

  const handleSave = () => {
    setSaving(true);
    const updatedDocs = docs.map(d => d.type === 'npwp' ? { ...d, uploaded: !!npwv } : d);
    setTimeout(() => { onSave(updatedDocs, npwv || undefined); setSaving(false); onClose(); }, 600);
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
            style={{ width: '560px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>Upload Documents</h3>
                <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{client.companyName}</p>
              </div>
              <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}><X size={15} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Progress */}
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>Document Completion</span>
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 700, color: uploaded === 4 ? '#16A34A' : '#D97706' }}>{uploaded}/4</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {['siup','tdp','domicili','npwp'].map((t,i) => {
                    const done = t === 'npwp' ? !!npwv : docs.find(d=>d.type===t)?.uploaded;
                    const LABELS: Record<string,string> = { siup:'SIUP', tdp:'TDP', domicili:'Domisili', npwp:'NPWP' };
                    return (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {done ? <CheckCircle size={13} style={{ color: '#16A34A' }} /> : <Circle size={13} style={{ color: 'var(--color-border)' }} />}
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: done ? '#16A34A' : 'var(--color-muted-foreground)', fontWeight: done ? 600 : 400 }}>{LABELS[t]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* File docs */}
              {DOC_DEFS.map(def => {
                const doc = docs.find(d => d.type === def.type);
                if (!doc) return null;
                return (
                  <div key={def.type}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>
                      {def.label} <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>— {def.full}</span>
                    </div>
                    {doc.uploaded ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 'var(--radius)', backgroundColor: 'rgba(22,163,74,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={15} style={{ color: '#16A34A' }} />
                          <div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground)' }}>{doc.filename}</div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{doc.size} · Uploaded {doc.uploadedAt}</div>
                          </div>
                        </div>
                        <button onClick={() => toggle(def.type)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer' }}>Replace</button>
                      </div>
                    ) : (
                      <div onClick={() => toggle(def.type)} style={{ padding: '20px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', textAlign: 'center', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#7C3AED'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                        <Upload size={18} style={{ color: 'var(--color-muted-foreground)', marginBottom: '6px' }} />
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#2563EB', fontWeight: 500 }}>Click or drag to upload {def.label}</div>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>PDF, JPG, PNG — max 5MB</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* NPWP */}
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>
                  NPWP Number <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>— Nomor Pokok Wajib Pajak</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input value={npwv} onChange={e => setNpwv(fmtNpwp(e.target.value))} placeholder="00.000.000.0-000.000"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: `1px solid ${npwv ? 'rgba(22,163,74,0.5)' : 'var(--color-border)'}`, backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box' }} />
                  {npwv && <CheckCircle size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: 'var(--color-secondary)' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{uploaded} of 4 documents provided</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: saving ? '#A78BFA' : '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Documents'}
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
