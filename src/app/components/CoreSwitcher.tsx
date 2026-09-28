import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { User, ChevronsUpDown, Check } from 'lucide-react';
import { CORE_IDS, CORE_META, type CoreId } from '../core/coreConfig';
import { useCore } from '../core/CoreContext';

interface CoreSwitcherProps {
  isCollapsed: boolean;
}

export function CoreSwitcher({ isCollapsed }: CoreSwitcherProps) {
  const { activeCore, setActiveCore } = useCore();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const openPopover = () => {
    if (triggerRef.current) setAnchorRect(triggerRef.current.getBoundingClientRect());
    setFocusedIndex(CORE_IDS.indexOf(activeCore));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex]);

  const handleSelect = (core: CoreId) => {
    setActiveCore(core);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => (i + 1) % CORE_IDS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => (i - 1 + CORE_IDS.length) % CORE_IDS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(CORE_IDS[focusedIndex]);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch core, current ${CORE_META[activeCore].label}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isCollapsed ? '12px 0' : '12px',
          borderRadius: 'var(--radius)',
          border: 'none',
          backgroundColor: 'rgba(255,255,255,0.1)',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7C3AED',
          flexShrink: 0,
        }}>
          <User size={18} />
        </div>
        {!isCollapsed && (
          <>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)', color: 'white',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                Ops Team · {CORE_META[activeCore].label}
              </div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Online
              </div>
            </div>
            <ChevronsUpDown size={16} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
          </>
        )}
      </button>

      {open && anchorRect && ReactDOM.createPortal(
        <div
          ref={popoverRef}
          role="menu"
          aria-label="Switch core"
          onKeyDown={handleListKeyDown}
          style={{
            position: 'fixed',
            left: anchorRect.left,
            bottom: window.innerHeight - anchorRect.top + 8,
            width: isCollapsed ? '240px' : anchorRect.width,
            zIndex: 2000,
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            padding: '8px',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--color-muted-foreground)', padding: '6px 10px 8px',
          }}>
            Switch Core
          </div>

          {CORE_IDS.map((core, i) => {
            const meta = CORE_META[core];
            const isActive = core === activeCore;
            return (
              <button
                key={core}
                ref={el => { optionRefs.current[i] = el; }}
                role="menuitemradio"
                aria-checked={isActive}
                aria-label={`${meta.label}, ${meta.description}`}
                tabIndex={focusedIndex === i ? 0 : -1}
                onClick={() => handleSelect(core)}
                onFocus={() => setFocusedIndex(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600,
                    color: 'var(--color-foreground)',
                  }}>
                    {meta.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                    color: 'var(--color-muted-foreground)',
                  }}>
                    {meta.description}
                  </div>
                </div>
                {isActive && <Check size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
