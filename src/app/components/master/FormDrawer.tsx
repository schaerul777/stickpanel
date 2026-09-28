import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { secondaryButtonStyle, primaryButtonStyle } from './styles';

interface FormDrawerProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  children: ReactNode;
}

export function FormDrawer({ title, onClose, onSave, saving, saveLabel = 'Save', children }: FormDrawerProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
      />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440,
        backgroundColor: 'var(--color-card)', borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(0,0,0,0.14)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>{title}</div>
          <button onClick={onClose} style={{ padding: 8, border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', borderRadius: 'var(--radius-sm)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.75 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
