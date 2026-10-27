import { useEffect, type CSSProperties, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { photoSrc } from './surveyPhoto';
import type { SurveyPhoto } from './surveyData';

// ─── Design tokens (same palette as the rest of StickPanel) ─────────────────────────────────────────

export const PRIMARY = '#7C3AED';
export const PRIMARY_TINT = 'rgba(124,58,237,0.1)';
export const PRIMARY_BORDER = 'rgba(124,58,237,0.3)';
export const GREEN = '#16A34A';
export const GREEN_TINT = 'rgba(34,197,94,0.1)';
export const GREEN_BORDER = 'rgba(34,197,94,0.3)';
export const RED = '#DC2626';
export const RED_TINT = 'rgba(239,68,68,0.1)';
export const RED_BORDER = 'rgba(239,68,68,0.3)';
export const AMBER = '#D97706';
export const AMBER_TINT = 'rgba(245,158,11,0.1)';
export const AMBER_BORDER = 'rgba(245,158,11,0.3)';
export const GRAY = '#6B7280';

export const FONT = 'var(--font-family-geist)';

export const cardStyle: CSSProperties = {
  backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
};

export const sectionTitle: CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', margin: 0,
};

export const labelStyle: CSSProperties = {
  fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)',
};

export const inputStyle: CSSProperties = {
  height: '36px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  backgroundColor: 'var(--input-background)', color: 'var(--foreground)', fontFamily: FONT,
  fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

// ─── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Btn({ children, onClick, disabled, variant = 'secondary', title, size = 'md', style }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; variant?: BtnVariant; title?: string; size?: 'sm' | 'md'; style?: CSSProperties;
}) {
  const palette: Record<BtnVariant, CSSProperties> = {
    primary:   { backgroundColor: PRIMARY, color: 'white', border: `1px solid ${PRIMARY}` },
    secondary: { backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' },
    danger:    { backgroundColor: 'var(--card)', color: RED, border: `1px solid ${RED_BORDER}` },
    ghost:     { backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid transparent' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        height: size === 'sm' ? '30px' : '36px', padding: size === 'sm' ? '0 10px' : '0 14px',
        borderRadius: 'var(--radius)', fontFamily: FONT, fontSize: size === 'sm' ? '12px' : '13px', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap', flexShrink: 0,
        ...palette[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type Tone = 'neutral' | 'accent' | 'green' | 'red' | 'amber';

export function Badge({ children, tone = 'neutral', style }: { children: ReactNode; tone?: Tone; style?: CSSProperties }) {
  const tones: Record<Tone, CSSProperties> = {
    neutral: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' },
    accent:  { backgroundColor: PRIMARY_TINT, color: PRIMARY, border: `1px solid ${PRIMARY_BORDER}` },
    green:   { backgroundColor: GREEN_TINT, color: GREEN, border: `1px solid ${GREEN_BORDER}` },
    red:     { backgroundColor: RED_TINT, color: RED, border: `1px solid ${RED_BORDER}` },
    amber:   { backgroundColor: AMBER_TINT, color: AMBER, border: `1px solid ${AMBER_BORDER}` },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600, fontFamily: FONT, whiteSpace: 'nowrap', ...tones[tone], ...style,
    }}>
      {children}
    </span>
  );
}

// ─── Photo thumbnail + full-screen lightbox ───────────────────────────────────

export function Thumb({ photo, size = 56, onClick, alt }: { photo: SurveyPhoto | null; size?: number; onClick?: () => void; alt: string }) {
  if (!photo) {
    return (
      <div style={{ width: size, height: size * 0.66, borderRadius: '6px', backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--muted-foreground)' }}>
        No photo
      </div>
    );
  }
  return (
    <img
      src={photoSrc(photo)}
      alt={alt}
      onClick={onClick}
      style={{ width: size, height: size * 0.66, objectFit: 'cover', borderRadius: '6px', cursor: onClick ? 'zoom-in' : 'default', display: 'block', flexShrink: 0, border: '1px solid var(--border)' }}
    />
  );
}

export function Lightbox({ photo, caption, onClose }: { photo: SurveyPhoto; caption: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1300, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} />
      </button>
      <img src={photoSrc(photo)} alt={caption} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', borderRadius: '8px' }} />
      <div style={{ marginTop: '12px', color: 'white', fontFamily: FONT, fontSize: '13px' }}>{caption}</div>
    </div>,
    document.body,
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ title, children, footer, onClose, width = 460 }: { title: ReactNode; children: ReactNode; footer: ReactNode; onClose?: () => void; width?: number }) {
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...cardStyle, width, maxWidth: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', fontFamily: FONT }}>
        <div style={{ padding: '18px 20px 0', fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>{title}</div>
        <div style={{ padding: '12px 20px 20px', fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.55 }}>{children}</div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
