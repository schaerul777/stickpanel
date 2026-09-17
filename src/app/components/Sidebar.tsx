import { useState, useEffect, startTransition } from 'react';
import {
  LayoutGrid, CreditCard, Users, FileText, User,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  DollarSign, UsersRound, ShieldCheck,
  Database, MapPin, Building2, ClipboardCheck, BarChart2,
  Boxes, MonitorPlay,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

interface SubItem {
  name: string;
  path: string;
  icon?: any;
  disabled?: boolean;
}

interface MenuItem {
  name: string;
  icon: any;
  path?: string;
  subItems?: SubItem[];
}

const menuGroups: MenuItem[] = [
  {
    name: 'Operations',
    icon: LayoutGrid,
    subItems: [
      { name: 'Campaigns',          path: '/campaigns' },
      { name: 'Drivers',            path: '/drivers'   },
      { name: 'Redeem Transactions',path: '/'          },
      { name: 'Reports',            path: '/reports'   },
    ],
  },
  {
    name: 'Sales',
    icon: DollarSign,
    subItems: [
      { name: 'Quotation', path: '/quotation' },
      { name: 'Clients',   path: '/clients'   },
    ],
  },
  {
    name: 'Master',
    icon: Database,
    subItems: [
      { name: 'Geolocation Filter', path: '/master/geolocation-filter', icon: MapPin    },
      { name: 'Cities',             path: '/master/cities',             icon: Building2 },
    ],
  },
  {
    name: 'Inventory',
    icon: Boxes,
    subItems: [
      { name: 'Display', path: '/inventory/display', icon: MonitorPlay },
    ],
  },
  {
    name: 'QC',
    icon: ClipboardCheck,
    subItems: [
      { name: 'Campaign Report', path: '/qc/campaign-report', icon: BarChart2 },
    ],
  },
  {
    name: 'Account',
    icon: ShieldCheck,
    subItems: [
      { name: 'Users', path: '/users' },
    ],
  },
];

// Determine which group owns the current pathname
function getGroupForPath(pathname: string): string | null {
  for (const group of menuGroups) {
    if (group.subItems?.some(item => item.path === pathname || pathname.startsWith(item.path + '/'))) {
      return group.name;
    }
  }
  return null;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate  = useNavigate();

  // Initialize: expand the group that owns the current route, otherwise 'Operations'
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const owned = getGroupForPath(location.pathname);
    return owned ? [owned] : ['Operations'];
  });

  // Auto-expand parent group whenever the route changes
  useEffect(() => {
    const owned = getGroupForPath(location.pathname);
    if (owned) setExpandedGroups([owned]);
  }, [location.pathname]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName) ? [] : [groupName]
    );
  };

  const isActiveRoute = (path: string) => location.pathname === path;

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
          {isCollapsed ? <span>SP</span> : <span>StickPanel</span>}
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
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto', overflowX: 'hidden' }}>
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

                      {group.subItems.map((item) => {
                        const isActive = isActiveRoute(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => { if (!item.disabled) startTransition(() => navigate(item.path)); }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '9px 12px',
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
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Collapsed state — group icon only */
              <div
                title={group.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  marginBottom: '4px',
                  borderRadius: 'var(--radius)',
                  color: group.subItems?.some(s => isActiveRoute(s.path))
                    ? 'white'
                    : 'rgba(255,255,255,0.7)',
                  backgroundColor: group.subItems?.some(s => isActiveRoute(s.path))
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

      {/* User Avatar */}
      <div style={{ padding: isCollapsed ? '20px 12px 24px' : '20px 20px 24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isCollapsed ? '12px 0' : '12px',
          borderRadius: 'var(--radius)',
          backgroundColor: 'rgba(255,255,255,0.1)',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7C3AED',
            fontFamily: 'var(--font-family-geist)',
            fontSize: 'var(--text-14)',
            fontWeight: 'var(--font-weight-semibold)',
            flexShrink: 0,
          }}>
            <User size={18} />
          </div>
          {!isCollapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)', color: 'white' }}>
                Ops Team
              </div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 'var(--font-weight-normal)', color: 'rgba(255,255,255,0.7)' }}>
                Online
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}