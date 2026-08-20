import { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

// ── Config per type ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ToastType,
  { icon: typeof CheckCircle; iconColor: string; borderColor: string; bg: string }
> = {
  success: {
    icon:        CheckCircle,
    iconColor:   '#10B981',
    borderColor: 'rgba(16,185,129,0.28)',
    bg:          'rgba(16,185,129,0.08)',
  },
  error: {
    icon:        AlertCircle,
    iconColor:   '#DC2626',
    borderColor: 'rgba(220,38,38,0.28)',
    bg:          'rgba(220,38,38,0.08)',
  },
  warning: {
    icon:        AlertTriangle,
    iconColor:   '#D97706',
    borderColor: 'rgba(217,119,6,0.28)',
    bg:          'rgba(245,158,11,0.08)',
  },
  info: {
    icon:        Info,
    iconColor:   '#7C3AED',
    borderColor: 'rgba(124,58,237,0.28)',
    bg:          'rgba(124,58,237,0.08)',
  },
};

// ── Timing ────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS  = 3800;
const EXIT_DURATION_MS = 340;

// ── CSS (injected once) ───────────────────────────────────────────────────────

const STYLE_ID = 'stickpanel-toast-styles';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    /* ── Enter: spring slide up + fade from left ── */
    @keyframes sp-toast-in {
      0%   { opacity: 0;   transform: translateX(-20px) translateY(8px) scale(0.96); }
      55%  { opacity: 1;   transform: translateX(3px)   translateY(-2px) scale(1.01); }
      75%  { transform: translateX(-1px) translateY(0px) scale(1.0); }
      100% { opacity: 1;   transform: translateX(0)     translateY(0)    scale(1);    }
    }

    /* ── Exit: collapse + fade left ── */
    @keyframes sp-toast-out {
      0%   { opacity: 1; transform: translateX(0)     scale(1);    max-height: 140px; margin-bottom: 0px; padding-top: 14px; padding-bottom: 14px; }
      40%  { opacity: 0; transform: translateX(-14px) scale(0.97); }
      100% { opacity: 0; transform: translateX(-20px) scale(0.95); max-height: 0;     margin-bottom: 0px; padding-top: 0;     padding-bottom: 0; }
    }

    /* ── Progress bar drain ── */
    @keyframes sp-toast-progress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    .sp-toast-enter {
      animation: sp-toast-in ${EXIT_DURATION_MS + 60}ms cubic-bezier(0.34, 1.38, 0.64, 1) forwards;
    }
    .sp-toast-exit {
      overflow: hidden;
      animation: sp-toast-out ${EXIT_DURATION_MS}ms cubic-bezier(0.4, 0, 0.8, 0.6) forwards;
    }
    .sp-toast-progress {
      animation: sp-toast-progress ${AUTO_DISMISS_MS}ms linear forwards;
    }
    .sp-toast-card:hover .sp-toast-progress {
      animation-play-state: paused;
    }
  `;
  document.head.appendChild(el);
}

// ── Single card ───────────────────────────────────────────────────────────────

interface ToastCardProps {
  item:      ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const { icon: Icon, iconColor, borderColor, bg } = TYPE_CONFIG[item.type];
  const [exiting, setExiting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const exitTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    exitTimerRef.current = setTimeout(() => onDismiss(item.id), EXIT_DURATION_MS);
  }, [exiting, item.id, onDismiss]);

  // Auto-dismiss — pauses while hovered
  useEffect(() => {
    if (hovered) return;
    dismissTimerRef.current = setTimeout(triggerExit, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [hovered, triggerExit]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (exitTimerRef.current)    clearTimeout(exitTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  return (
    <div
      className={`sp-toast-card ${exiting ? 'sp-toast-exit' : 'sp-toast-enter'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        'relative',
        display:         'flex',
        alignItems:      'flex-start',
        gap:             '11px',
        padding:         '14px 14px 18px 0',
        borderRadius:    'var(--radius)',
        border:          `1px solid ${borderColor}`,
        backgroundColor: 'var(--color-card)',
        boxShadow:       '0 8px 28px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.07)',
        minWidth:        '300px',
        maxWidth:        '360px',
        overflow:        'hidden',
        willChange:      'transform, opacity',
      }}
    >
      {/* Left accent stripe */}
      <div style={{
        position:        'absolute',
        left:            0,
        top:             0,
        bottom:          0,
        width:           '3.5px',
        backgroundColor: iconColor,
        borderRadius:    '4px 0 0 4px',
      }} />

      {/* Icon badge */}
      <div style={{
        flexShrink:      0,
        width:           '30px',
        height:          '30px',
        borderRadius:    'var(--radius-sm)',
        backgroundColor: bg,
        border:          `1px solid ${borderColor}`,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        marginLeft:      '12px',
        marginTop:       '1px',
      }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, marginTop: '1px' }}>
        <div style={{
          fontFamily:   'var(--font-family-geist)',
          fontSize:     'var(--text-14)',
          fontWeight:   600,
          color:        'var(--color-foreground)',
          lineHeight:   1.35,
          marginBottom: item.message ? '3px' : 0,
        }}>
          {item.title}
        </div>
        {item.message && (
          <div style={{
            fontFamily: 'var(--font-family-geist)',
            fontSize:   '13px',
            fontWeight: 400,
            color:      'var(--color-muted-foreground)',
            lineHeight: 1.45,
          }}>
            {item.message}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); triggerExit(); }}
        style={{
          flexShrink:      0,
          width:           '22px',
          height:          '22px',
          borderRadius:    'var(--radius-sm)',
          border:          '1px solid var(--color-border)',
          backgroundColor: 'transparent',
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:           'var(--color-muted-foreground)',
          transition:      'background-color 0.15s, color 0.15s, border-color 0.15s',
          padding:         0,
          marginTop:       '1px',
          marginRight:     '2px',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget;
          b.style.backgroundColor = 'var(--color-secondary)';
          b.style.color           = 'var(--color-foreground)';
          b.style.borderColor     = 'var(--color-foreground)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget;
          b.style.backgroundColor = 'transparent';
          b.style.color           = 'var(--color-muted-foreground)';
          b.style.borderColor     = 'var(--color-border)';
        }}
      >
        <X size={12} />
      </button>

      {/* Progress bar — drains left-to-right, pauses on hover */}
      <div style={{
        position:        'absolute',
        bottom:          0,
        left:            0,
        right:           0,
        height:          '2.5px',
        backgroundColor: bg,
        borderRadius:    '0 0 var(--radius) var(--radius)',
        overflow:        'hidden',
      }}>
        <div
          className="sp-toast-progress"
          style={{
            height:          '100%',
            width:           '100%',
            backgroundColor: iconColor,
            opacity:         0.7,
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  );
}

// ── Container — bottom-left portal ───────────────────────────────────────────

interface ToastContainerProps {
  toasts:    ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  useEffect(() => { ensureStyles(); }, []);

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position:      'fixed',
        bottom:        '24px',
        left:          '24px',
        zIndex:        99999,
        display:       'flex',
        flexDirection: 'column-reverse',  // newest toast sits closest to the corner
        alignItems:    'flex-start',
        gap:           '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastCard item={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismiss };
}
