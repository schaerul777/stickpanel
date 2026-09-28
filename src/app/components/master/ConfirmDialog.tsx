import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { secondaryButtonStyle, dangerButtonStyle } from './styles';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  blocked?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', blocked, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = () => {
    if (blocked) return;
    setBusy(true);
    setTimeout(() => { onConfirm(); setBusy(false); }, 350);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>{title}</div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', backgroundColor: blocked ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} style={{ color: blocked ? '#F59E0B' : '#EF4444' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 4 }}>
                {blocked || message}
              </div>
              {!blocked && (
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                  This action cannot be undone.
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={secondaryButtonStyle}>{blocked ? 'Close' : 'Cancel'}</button>
          {!blocked && (
            <button onClick={handleConfirm} disabled={busy} style={{ ...dangerButtonStyle, opacity: busy ? 0.7 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
              {busy ? 'Working…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
