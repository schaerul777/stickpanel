import { useState, useEffect, useRef, startTransition } from 'react';
import ReactDOM from 'react-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { coreMenus, CORE_META, type SubItem, type MenuItem } from '../core/coreConfig';
import { useCore } from '../core/CoreContext';
import { CoreSwitcher } from './CoreSwitcher';

// ─── Recursive helpers ──────────────────────────────────────────────────────────

function findOwnerTrail(items: SubItem[], pathname: string): string[] | null {
  for (const item of items) {
    if (item.path && (pathname === item.path || pathname.startsWith(item.path + '/'))) return [];
    if (item.children) {
      const sub = findOwnerTrail(item.children, pathname);
      if (sub) return [item.name, ...sub];
    }
  }
  return null;
}

function getGroupForPath(groups: MenuItem[], pathname: string): { group: string; nestedTrail: string[] } | null {
  for (const group of groups) {
    if (!group.subItems) continue;
    const trail = findOwnerTrail(group.subItems, pathname);
    if (trail) return { group: group.name, nestedTrail: trail };
  }
  return null;
}

function subtreeHasActive(items: SubItem[], pathname: string): boolean {
  return items.some(item =>
    (item.path && item.path === pathname) ||
    (item.children && subtreeHasActive(item.children, pathname))
  );
}

// ─── Collapsed-sidebar hover flyout (recursive — supports group-within-group) ──

interface FlyoutMenuProps {
  items: SubItem[];
  anchorRect: DOMRect;
  onNavigate: (path: string) => void;
  isActiveRoute: (path: string) => boolean;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
}

function FlyoutMenu({ items, anchorRect, onNavigate, isActiveRoute, onPanelMouseEnter, onPanelMouseLeave }: FlyoutMenuProps) {
  const [hoveredChild, setHoveredChild] = useState<string | null>(null);
  const [childRect, setChildRect] = useState<DOMRect | null>(null);
  const closeTimer = useRef<number | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const cancelChildClose = () => {
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleChildClose = () => {
    closeTimer.current = window.setTimeout(() => setHoveredChild(null), 150);
  };

  return ReactDOM.createPortal(
    <div
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
      style={{
        position: 'fixed',
        top: anchorRect.top,
        left: anchorRect.right + 8,
        zIndex: 2000,
        minWidth: '208px',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        padding: '6px',
      }}
    >
      {items.map(item => {
        if (item.children) {
          const isChildActive = subtreeHasActive(item.children, window.location.pathname);
          const isOpen = hoveredChild === item.name;
          return (
            <div
              key={item.name}
              ref={el => { rowRefs.current[item.name] = el; }}
              onMouseEnter={() => {
                cancelChildClose();
                const el = rowRefs.current[item.name];
                if (el) setChildRect(el.getBoundingClientRect());
                setHoveredChild(item.name);
              }}
              onMouseLeave={scheduleChildClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                padding: '9px 10px', borderRadius: 'var(--radius-sm)', cursor: 'default',
                backgroundColor: isOpen ? 'rgba(124,58,237,0.08)' : 'transparent',
                color: isChildActive ? '#7C3AED' : 'var(--foreground)',
                fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.icon && <item.icon size={13} />}
                {item.name}
              </span>
              <ChevronRight size={12} style={{ color: 'var(--muted-foreground)' }} />
              {isOpen && childRect && (
                <FlyoutMenu
                  items={item.children}
                  anchorRect={childRect}
                  onNavigate={onNavigate}
                  isActiveRoute={isActiveRoute}
                  onPanelMouseEnter={cancelChildClose}
                  onPanelMouseLeave={scheduleChildClose}
                />
              )}
            </div>
          );
        }
        const active = item.path ? isActiveRoute(item.path) : false;
        return (
          <div
            key={item.path ?? item.name}
            onClick={() => item.path && onNavigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              color: active ? '#7C3AED' : 'var(--foreground)',
              backgroundColor: active ? 'rgba(124,58,237,0.1)' : 'transparent',
              fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: active ? 600 : 500,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {item.icon && <item.icon size={13} />}
            {item.name}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { activeCore } = useCore();
  const menuGroups = coreMenus[activeCore];

  // Initialize: expand the group that owns the current route, otherwise the first group
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const owned = getGroupForPath(menuGroups, location.pathname);
    return owned ? [owned.group] : (menuGroups[0] ? [menuGroups[0].name] : []);
  });

  // Initialize expanded nested (group-within-group) folders that own the current route
  const [expandedNested, setExpandedNested] = useState<Set<string>>(() => {
    const owned = getGroupForPath(menuGroups, location.pathname);
    const keys = new Set<string>();
    if (owned) {
      let prefix = owned.group;
      for (const name of owned.nestedTrail) { prefix = `${prefix}>${name}`; keys.add(prefix); }
    }
    return keys;
  });

  // Auto-expand parent group (and nested folder) whenever the route or active core changes
  useEffect(() => {
    const owned = getGroupForPath(menuGroups, location.pathname);
    if (owned) {
      setExpandedGroups([owned.group]);
      setExpandedNested(prev => {
        const next = new Set(prev);
        let prefix = owned.group;
        for (const name of owned.nestedTrail) { prefix = `${prefix}>${name}`; next.add(prefix); }
        return next;
      });
    }
  }, [location.pathname, activeCore]);

  // Brief fade on the menu list whenever the active core changes, so the
  // filtered menu doesn't just pop in.
  const [menuVisible, setMenuVisible] = useState(true);
  const prevCoreRef = useRef(activeCore);
  useEffect(() => {
    if (prevCoreRef.current === activeCore) return;
    prevCoreRef.current = activeCore;
    setMenuVisible(false);
    const id = requestAnimationFrame(() => setMenuVisible(true));
    return () => cancelAnimationFrame(id);
  }, [activeCore]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName) ? [] : [groupName]
    );
  };

  const toggleNested = (key: string) => {
    setExpandedNested(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  // ── Collapsed-sidebar hover flyout state (top-level group) ──
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);
  const [hoverGroupRect, setHoverGroupRect] = useState<DOMRect | null>(null);
  const groupCloseTimer = useRef<number | null>(null);
  const groupIconRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const cancelGroupClose = () => {
    if (groupCloseTimer.current) { window.clearTimeout(groupCloseTimer.current); groupCloseTimer.current = null; }
  };
  const scheduleGroupClose = () => {
    groupCloseTimer.current = window.setTimeout(() => setHoverGroup(null), 150);
  };
  const openGroupHover = (name: string) => {
    cancelGroupClose();
    const el = groupIconRefs.current[name];
    if (el) setHoverGroupRect(el.getBoundingClientRect());
    setHoverGroup(name);
  };

  const handleFlyoutNavigate = (path: string) => {
    startTransition(() => navigate(path));
    setHoverGroup(null);
  };

  // ── Recursive renderer for expanded (non-collapsed) subItems ──
  const renderSubItems = (items: SubItem[], depth: number, keyPrefix: string) => (
    <>
      {items.map(item => {
        if (item.children) {
          const key = `${keyPrefix}>${item.name}`;
          const isOpen = expandedNested.has(key);
          const isChildActive = subtreeHasActive(item.children, location.pathname);
          return (
            <div key={key}>
              <button
                onClick={() => toggleNested(key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: `9px 12px 9px ${12 + depth * 16}px`, marginBottom: '2px',
                  borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: isChildActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)',
                  transition: 'all 0.2s', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon && <item.icon size={13} style={{ flexShrink: 0 }} />}
                  <span>{item.name}</span>
                </div>
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <div style={{
                maxHeight: isOpen ? '400px' : '0',
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}>
                {renderSubItems(item.children, depth + 1, key)}
              </div>
            </div>
          );
        }

        const isActive = item.path ? isActiveRoute(item.path) : false;
        return (
          <button
            key={item.path}
            onClick={() => { if (!item.disabled && item.path) startTransition(() => navigate(item.path!)); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: `9px 12px 9px ${12 + depth * 16}px`,
              marginBottom: '2px',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: item.disabled ? 'default' : 'pointer',
              backgroundColor: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? '#7C3AED' : item.disabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              if (!isActive && !item.disabled) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={e => {
              if (!isActive && !item.disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }
            }}
          >
            {item.icon && (
              <item.icon
                size={13}
                style={{ flexShrink: 0, color: isActive ? '#7C3AED' : 'inherit' }}
              />
            )}
            <span style={{ flex: 1 }}>{item.name}</span>
            {item.disabled && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Soon
              </span>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <aside
      style={{
        backgroundColor: '#7C3AED',
        width: isCollapsed ? '80px' : '240px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div style={{
        padding: isCollapsed ? '24px 16px' : '24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
      }}>
        <div style={{
          fontFamily: 'var(--font-family-geist)',
          fontSize: '20px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {isCollapsed ? <span>SP</span> : (
            <>
              <span>StickPanel</span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#7C3AED',
                backgroundColor: '#FFFFFF',
                borderRadius: '999px',
                padding: '2px 7px',
              }}>
                {CORE_META[activeCore].label}
              </span>
            </>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Collapse button when minimized */}
      {isCollapsed && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={onToggle}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 'var(--radius)',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '0 12px',
        overflowY: 'auto',
        overflowX: 'hidden',
        opacity: menuVisible ? 1 : 0,
        transition: 'opacity 180ms ease',
      }}>
        {menuGroups.map((group) => (
          <div key={group.name} style={{ marginBottom: '8px' }}>
            {!isCollapsed ? (
              <>
                {/* Group header button */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    marginBottom: '4px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.9)',
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <group.icon size={14} />
                    <span>{group.name}</span>
                  </div>
                  {expandedGroups.includes(group.name)
                    ? <ChevronUp size={14} />
                    : <ChevronDown size={14} />
                  }
                </button>

                {/* Submenu */}
                <div style={{
                  maxHeight: expandedGroups.includes(group.name) ? '600px' : '0',
                  opacity:   expandedGroups.includes(group.name) ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  {group.subItems && (
                    <div style={{ paddingLeft: '28px', position: 'relative' }}>
                      {/* Vertical connector line */}
                      <div style={{
                        position: 'absolute', left: '20px', top: 0, bottom: 0,
                        width: '1px', backgroundColor: 'rgba(255,255,255,0.2)',
                      }} />

                      {renderSubItems(group.subItems, 0, group.name)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Collapsed state — group icon only, hover reveals flyout */
              <div
                ref={el => { groupIconRefs.current[group.name] = el; }}
                title={group.name}
                onMouseEnter={() => { if (group.subItems) openGroupHover(group.name); }}
                onMouseLeave={() => { if (group.subItems) scheduleGroupClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  marginBottom: '4px',
                  borderRadius: 'var(--radius)',
                  color: group.subItems && subtreeHasActive(group.subItems, location.pathname)
                    ? 'white'
                    : 'rgba(255,255,255,0.7)',
                  backgroundColor: group.subItems && subtreeHasActive(group.subItems, location.pathname)
                    ? 'rgba(255,255,255,0.15)'
                    : 'transparent',
                }}
              >
                <group.icon size={18} />
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapsed-sidebar top-level flyout */}
      {isCollapsed && hoverGroup && hoverGroupRect && (() => {
        const grp = menuGroups.find(g => g.name === hoverGroup);
        if (!grp?.subItems) return null;
        return (
          <FlyoutMenu
            items={grp.subItems}
            anchorRect={hoverGroupRect}
            onNavigate={handleFlyoutNavigate}
            isActiveRoute={isActiveRoute}
            onPanelMouseEnter={cancelGroupClose}
            onPanelMouseLeave={scheduleGroupClose}
          />
        );
      })()}

      {/* User / Core switcher */}
      <div style={{ padding: isCollapsed ? '20px 12px 24px' : '20px 20px 24px' }}>
        <CoreSwitcher isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
