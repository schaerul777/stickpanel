import { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Ban, UserCheck, Star, StarOff, TriangleAlert } from 'lucide-react';
import type { Driver } from './DriversTable';

interface BulkActionsModalProps {
  open: boolean;
  drivers: Driver[];
  onClose: () => void;
  onApply: (action: string, driverIds: string[], reason: string) => void;
}

const ACTIONS = [
  { value: 'suspend',     label: 'Suspend',               Icon: Ban,       needsReason: true,  danger: true  },
  { value: 'activate',    label: 'Activate',              Icon: UserCheck, needsReason: false, danger: false },
  { value: 'blacklist',   label: 'Blacklist',             Icon: Ban,       needsReason: true,  danger: true  },
  { value: 'unblacklist', label: 'Remove from Blacklist', Icon: UserCheck, needsReason: false, danger: false },
  { value: 'vip',         label: 'Mark as VIP',           Icon: Star,      needsReason: false, danger: false },
  { value: 'unvip',       label: 'Remove VIP',            Icon: StarOff,   needsReason: false, danger: false },
] as const;

type ActionValue = typeof ACTIONS[number]['value'];

function getAvatarColor(name: string) {
  const colors = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626'];
  return colors[name.charCodeAt(0) % colors.length];
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

export function BulkActionsModal({ open, drivers, onClose, onApply }: BulkActionsModalProps) {
  const [action,  setAction]  = useState<ActionValue>('suspend');
  const [reason,  setReason]  = useState('');
  const [error,   setError]   = useState('');

  if (!open || drivers.length === 0) return null;

  const selected = ACTIONS.find(a => a.value === action)!;

  const handleApply = () => {
    if (selected.needsReason && !reason.trim()) {
      setError('A reason is required for this action.');
      return;
    }
    onApply(action, drivers.map(d => d.id), reason.trim());
    setAction('suspend');
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setAction('suspend');
    setReason('');
    setError('');
    onClose();
  };

  const statusCfg = {
    active:      { label: 'Active',      color: '#16A34A', bg: 'rgba(34,197,94,0.1)'   },
    inactive:    { label: 'Inactive',    color: '#525252', bg: 'rgba(115,115,115,0.1)' },
    suspended:   { label: 'Suspended',   color: '#D97706', bg: 'rgba(245,158,11,0.1)'  },
    blacklisted: { label: 'Blacklisted', color: '#DC2626', bg: 'rgba(239,68,68,0.1)'   },
  };

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9998 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', pointerEvents: 'none',
      }}>
        <div
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'all',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-18)', fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>
                Bulk Action
              </h2>
              <p style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
                {drivers.length} driver{drivers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Selected drivers */}
            <div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '10px' }}>
                Selected Drivers
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {drivers.map((d, i) => {
                  const s = statusCfg[d.status];
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px',
                      borderBottom: i < drivers.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-secondary)',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: getAvatarColor(d.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-family-geist)', fontSize: '10px', fontWeight: 700, color: 'white',
                      }}>
                        {getInitials(d.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.name}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                          {d.id}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-family-geist)', fontWeight: 500, backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action picker */}
            <div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '10px' }}>
                Select Action
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {ACTIONS.map(a => {
                  const { Icon } = a;
                  const isActive = action === a.value;
                  return (
                    <button
                      key={a.value}
                      onClick={() => { setAction(a.value); setError(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 14px', borderRadius: 'var(--radius)',
                        border: isActive
                          ? `1.5px solid ${a.danger ? '#DC2626' : '#7C3AED'}`
                          : '1px solid var(--color-border)',
                        backgroundColor: isActive
                          ? (a.danger ? 'rgba(239,68,68,0.06)' : 'rgba(124,58,237,0.06)')
                          : 'transparent',
                        color: isActive
                          ? (a.danger ? '#DC2626' : '#7C3AED')
                          : 'var(--color-foreground)',
                        fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: isActive ? 500 : 400,
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={14} style={{ flexShrink: 0 }} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason textarea */}
            {selected.needsReason && (
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>
                  Reason <span style={{ color: '#DC2626' }}>*</span>
                </div>
                <textarea
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(''); }}
                  placeholder={`Provide a reason for ${selected.label.toLowerCase()}...`}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: 'var(--radius)',
                    border: error ? '1px solid #DC2626' : '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-input-background)',
                    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
                    color: 'var(--color-foreground)',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { if (!error) e.target.style.borderColor = '#7C3AED'; }}
                  onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)'; }}
                />
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: '12px' }}>
                    <TriangleAlert size={12} /> {error}
                  </div>
                )}
              </div>
            )}

            {/* Warning */}
            {selected.danger && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <TriangleAlert size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#DC2626' }}>
                  This action will affect {drivers.length} driver{drivers.length !== 1 ? 's' : ''}. This can be reversed later from each driver's profile.
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '9px 18px', borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)', backgroundColor: 'transparent',
                color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: '9px 18px', borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: selected.danger ? '#DC2626' : '#7C3AED',
                color: 'white', fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <selected.Icon size={14} />
              Apply to {drivers.length} Driver{drivers.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}