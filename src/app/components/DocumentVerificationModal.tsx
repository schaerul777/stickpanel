import { useState, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import ReactDOM from 'react-dom';
import {
  X, ZoomIn, ZoomOut, RotateCw, Check, CircleX, TriangleAlert,
  Copy, User, Car,
} from 'lucide-react';
import type { Driver } from './DriversTable';

// ── Props ─────────────────────────────────────────────────────────────────────

interface DocumentVerificationModalProps {
  open: boolean;
  driver: Driver | null;
  docType: 'id' | 'license' | null;
  onClose: () => void;
  onApprove: (driver: Driver, docType: 'id' | 'license') => void;
  onReject: (driver: Driver, docType: 'id' | 'license', reason: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: copied ? '#22C55E' : 'var(--color-muted-foreground)', display: 'inline-flex', alignItems: 'center', transition: 'color 0.15s' }}
      title="Copy"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function VerificationBadge({ status }: { status: 'verified' | 'pending' | 'rejected' }) {
  const cfg = {
    verified: { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', label: '✓ Verified'  },
    pending:  { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', label: '⏳ Pending'  },
    rejected: { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626', label: '✕ Rejected'  },
  };
  const c = cfg[status];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, backgroundColor: c.bg, color: c.color, fontFamily: 'var(--font-family-geist)' }}>
      {c.label}
    </span>
  );
}

// ── Document Card (large preview) ─────────────────────────────────────────────

function LargeDocumentCard({
  type, driver, zoom, rotation,
}: { type: 'id' | 'license'; driver: Driver; zoom: number; rotation: number }) {
  const isId = type === 'id';
  return (
    <div style={{
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      transition: 'transform 0.25s',
      transformOrigin: 'center',
    }}>
      <div style={{
        width: '360px', height: '228px',
        background: isId
          ? 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)'
          : 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #10b981 100%)',
        borderRadius: '10px', padding: '20px 24px', color: 'white',
        position: 'relative', overflow: 'hidden', userSelect: 'none',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, letterSpacing: '0.12em', opacity: 0.85, textTransform: 'uppercase' }}>
              {isId ? 'Kartu Tanda Penduduk' : 'Surat Izin Mengemudi'}
            </div>
            <div style={{ fontSize: '8px', fontFamily: 'var(--font-family-geist)', fontWeight: 400, opacity: 0.7, marginTop: '2px' }}>
              REPUBLIK INDONESIA
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isId ? <User size={18} color="white" /> : <Car size={18} color="white" />}
          </div>
        </div>
        {/* Body */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '52px', height: '68px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="rgba(255,255,255,0.5)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, marginBottom: '6px' }}>{driver.name}</div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.9, marginBottom: '3px', letterSpacing: '0.04em' }}>
              {isId ? driver.nationalId : driver.driverLicense}
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-family-geist)', opacity: 0.75, marginBottom: '2px' }}>
              {driver.domicile}, {driver.city}
            </div>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-family-geist)', opacity: 0.65 }}>
              {new Date(driver.birthDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        {/* Footer stamp */}
        <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '8px', opacity: 0.6, fontFamily: 'monospace' }}>
          {isId ? 'BERLAKU SEUMUR HIDUP' : 'MASA BERLAKU: 12/2027'}
        </div>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', right: '-10px', width: '100px', height: '100px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function VerifyField({
  label, value, onChange, copiable = false,
}: { label: string; value: string; onChange?: (v: string) => void; copiable?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onChange ? (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-input-background)',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              color: 'var(--color-foreground)', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
          />
        ) : (
          <span style={{ flex: 1, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>
            {value || '—'}
          </span>
        )}
        {copiable && value && <CopyBtn text={value} />}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DocumentVerificationModal({
  open, driver, docType, onClose, onApprove, onReject,
}: DocumentVerificationModalProps) {
  const [zoom,        setZoom]        = useState(1);
  const [rotation,    setRotation]    = useState(0);
  const [rejecting,   setRejecting]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Editable extracted fields
  const [idNumber, setIdNumber]       = useState('');
  const [licNumber, setLicNumber]     = useState('');
  const [nameField, setNameField]     = useState('');
  const [expiryField, setExpiryField] = useState('31 Dec 2027');
  const [addressField, setAddressField] = useState('');

  // Reset on open
  useEffect(() => {
    if (open && driver) {
      setZoom(1); setRotation(0); setRejecting(false);
      setRejectReason(''); setRejectError('');
      setIdNumber(driver.nationalId);
      setLicNumber(driver.driverLicense);
      setNameField(driver.name);
      setAddressField(`${driver.domicile}, ${driver.city}`);
    }
  }, [open, driver?.id, docType]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !driver || !docType) return null;

  const isId = docType === 'id';
  const currentVerStatus: 'verified' | 'pending' | 'rejected' =
    driver.profileCompletion > (isId ? 70 : 65) ? 'verified'
    : driver.profileCompletion > (isId ? 50 : 45) ? 'pending'
    : 'rejected';

  const handleApprove = () => {
    onApprove(driver, docType);
    onClose();
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      setRejectError('A reason is required for rejection.');
      return;
    }
    onReject(driver, docType, rejectReason.trim());
    onClose();
  };

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 9992 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9993,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', pointerEvents: 'none',
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            width: '100%', maxWidth: '860px',
            maxHeight: '92vh',
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'all',
          }}
        >
          {/* ── Header ── */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-18)', fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>
                {isId ? 'Verify National ID (KTP)' : 'Verify Driver License (SIM)'}
              </h2>
              <p style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', margin: '4px 0 0' }}>
                {driver.name} · {driver.id}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <VerificationBadge status={currentVerStatus} />
              <button
                onClick={onClose}
                style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 0 }}>

              {/* Left: Image viewer */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '32px 32px', gap: '20px',
                backgroundColor: '#0F1117',
                borderRight: '1px solid var(--color-border)',
              }}>
                {/* Zoom / rotate controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: <ZoomOut size={14} />,  action: () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2))) },
                    { label: <ZoomIn size={14} />,   action: () => setZoom(z => Math.min(3.0, +(z + 0.25).toFixed(2))) },
                    { label: <RotateCw size={14} />, action: () => setRotation(r => r + 90) },
                    { label: 'Reset', action: () => { setZoom(1); setRotation(0); } },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} style={{
                      padding: '6px 10px', borderRadius: 'var(--radius)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.8)',
                      fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      transition: 'background-color 0.15s',
                    }}>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Document */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '100%' }}>
                  <LargeDocumentCard type={docType} driver={driver} zoom={zoom} rotation={rotation} />
                </div>

                {/* Zoom level label */}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-family-geist)' }}>
                  {Math.round(zoom * 100)}% zoom
                </span>
              </div>

              {/* Right: Extracted fields */}
              <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Extracted Info
                  </div>

                  <VerifyField
                    label={isId ? 'ID Number (NIK)' : 'License Number'}
                    value={isId ? idNumber : licNumber}
                    onChange={isId ? setIdNumber : setLicNumber}
                    copiable
                  />
                  <VerifyField
                    label="Name"
                    value={nameField}
                    onChange={setNameField}
                  />
                  <VerifyField
                    label="Birth Date"
                    value={new Date(driver.birthDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  />
                  {!isId && (
                    <VerifyField
                      label="Expiry Date"
                      value={expiryField}
                      onChange={setExpiryField}
                    />
                  )}
                  {isId && (
                    <VerifyField
                      label="Address"
                      value={addressField}
                      onChange={setAddressField}
                    />
                  )}

                  <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

                  {/* Current status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Current Status</span>
                    <VerificationBadge status={currentVerStatus} />
                  </div>

                  {/* Rejection form */}
                  {rejecting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: 'var(--color-foreground)' }}>
                        Rejection Reason <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
                        placeholder="Explain why this document is being rejected..."
                        rows={3}
                        style={{
                          width: '100%', padding: '8px 10px',
                          borderRadius: 'var(--radius)',
                          border: rejectError ? '1px solid #DC2626' : '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-input-background)',
                          fontFamily: 'var(--font-family-geist)', fontSize: '13px',
                          color: 'var(--color-foreground)',
                          resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                        }}
                        onFocus={e => { if (!rejectError) e.target.style.borderColor = '#7C3AED'; }}
                        onBlur={e =>  { if (!rejectError) e.target.style.borderColor = 'var(--color-border)'; }}
                      />
                      {rejectError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: '12px' }}>
                          <TriangleAlert size={11} /> {rejectError}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setRejecting(false); setRejectReason(''); setRejectError(''); }}
                          style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 400, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRejectSubmit}
                          style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#DC2626', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          {!rejecting && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer' }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setRejecting(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: 'var(--radius)',
                    border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'transparent',
                    color: '#DC2626', fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <CircleX size={14} /> Reject & Request Re-upload
                </button>
                <button
                  onClick={handleApprove}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 20px', borderRadius: 'var(--radius)',
                    border: 'none', backgroundColor: '#16A34A',
                    color: 'white', fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <Check size={14} /> Approve Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}