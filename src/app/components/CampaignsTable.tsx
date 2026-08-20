import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  MoreVertical, Edit, Copy, Pause, Play, StopCircle,
  ExternalLink, ArrowUp, ArrowDown, ChevronsUpDown,
  Columns3, Check, SlidersHorizontal, X, MapPin,
} from 'lucide-react';
import { StatusTabs } from './StatusTabs';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  client: string;
  contactPerson?: string;
  channel: 'GTI' | 'TPI' | 'NON GRAB';
  cities: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'draft' | 'paused' | 'completed';
  driversEnrolled: number;
  pointsBudget: number;
  pointsUsed: number;
  pointsPerTrip: number;
  minTrips: number;
  targetTrips: number;
  totalTripsCompleted: number;
  description?: string;
  createdAt: string;
  vehicleTypes?: string[];
}

interface CampaignsTableProps {
  campaigns: Campaign[];
  onRowClick?: (campaign: Campaign) => void;
  onCampaignAction?: (action: string, campaignId: string) => void;
}

type SortCol = 'name' | 'driversEnrolled' | 'pointsUsed' | 'startDate' | null;
type SortDir = 'asc' | 'desc';

const ALL_COLS = [
  { key: 'campaign',  label: 'Campaign'  },
  { key: 'channel',   label: 'Channel'   },
  { key: 'cities',    label: 'Cities'    },
  { key: 'period',    label: 'Period'    },
  { key: 'enrolled',  label: 'Enrolled'  },
  { key: 'progress',  label: 'Progress'  },
  { key: 'status',    label: 'Status'    },
] as const;
type ColKey = typeof ALL_COLS[number]['key'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function fmtPoints(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: Campaign['status'] }) {
  const cfg = {
    active:    { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', dot: '#22C55E', label: 'Active' },
    draft:     { bg: 'rgba(115,115,115,0.1)', color: '#525252', dot: '#A3A3A3', label: 'Draft' },
    paused:    { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', dot: '#F59E0B', label: 'Paused' },
    completed: { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB', dot: '#3B82F6', label: 'Completed' },
  };
  const c = cfg[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 8px', borderRadius: 'var(--radius-sm)',
      backgroundColor: c.bg, color: c.color,
      fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: Campaign['channel'] }) {
  const styles = {
    GTI:        { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB', border: 'rgba(59,130,246,0.25)' },
    TPI:        { bg: 'rgba(124,58,237,0.1)',  color: '#7C3AED', border: 'rgba(124,58,237,0.25)' },
    'NON GRAB': { bg: 'rgba(115,115,115,0.1)', color: '#525252', border: 'rgba(115,115,115,0.25)' },
  };
  const s = styles[channel];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {channel}
    </span>
  );
}

function PointsProgress({ used, budget }: { used: number; budget: number }) {
  const pct = budget > 0 ? Math.min(Math.round((used / budget) * 100), 100) : 0;
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#22C55E';
  return (
    <div style={{ minWidth: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color }}>
          {pct}%
        </span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>
          {fmtPoints(used)}/{fmtPoints(budget)}
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// Portal menu hook (same pattern as DriversTable)
function usePortalMenu() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent, rightAlign = true, menuWidth = 195) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rightAlign ? rect.right - menuWidth : rect.left });
    }
    setOpen(v => !v);
  };

  return { open, setOpen, pos, btnRef, menuRef, toggle };
}

function ActionMenu({ campaign, onAction }: { campaign: Campaign; onAction: (action: string, id: string) => void }) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();

  const isActive    = campaign.status === 'active';
  const isPaused    = campaign.status === 'paused';
  const isDraft     = campaign.status === 'draft';
  const isCompleted = campaign.status === 'completed';

  type MenuItem = { action: string; label: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; danger: boolean; divider?: boolean };
  const menuItems: MenuItem[] = [
    { action: 'view',      label: 'View Details',    Icon: ExternalLink, danger: false },
    { action: 'edit',      label: 'Edit Campaign',   Icon: Edit,         danger: false },
    { action: 'duplicate', label: 'Duplicate',        Icon: Copy,         danger: false },
    ...(!isDraft && !isCompleted
      ? [isActive
          ? { action: 'pause',  label: 'Pause Campaign', Icon: Pause,   danger: false, divider: true } as MenuItem
          : { action: 'resume', label: 'Resume Campaign', Icon: Play,   danger: false, divider: true } as MenuItem
        ]
      : []),
    ...(!isCompleted
      ? [{ action: 'end', label: 'End Campaign', Icon: StopCircle, danger: true } as MenuItem]
      : []),
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 195)}
        style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-muted-foreground)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.color = 'var(--color-foreground)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.backgroundColor = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-muted-foreground)'; } }}
      >
        <MoreVertical size={15} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '195px', overflow: 'hidden',
        }}>
          {menuItems.map((item, idx) => {
            const { Icon } = item;
            return (
              <button
                key={item.action}
                onClick={e => { e.stopPropagation(); onAction(item.action, campaign.id); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 14px', border: 'none',
                  borderTop: item.divider ? '1px solid var(--color-border)' : 'none',
                  backgroundColor: 'transparent',
                  color: item.danger ? '#DC2626' : 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = item.danger ? 'rgba(239,68,68,0.07)' : 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />
                {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

function ColumnToggle({ visibleCols, onToggle }: { visibleCols: Set<ColKey>; onToggle: (k: ColKey) => void }) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();
  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 200)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 14px', borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
      >
        <Columns3 size={15} /> Columns <ChevronDown size={13} style={{ color: 'var(--color-muted-foreground)' }} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '200px', overflow: 'hidden', padding: '6px 0',
        }}>
          <div style={{
            padding: '8px 14px 6px',
            fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
            color: 'var(--color-muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase',
            borderBottom: '1px solid var(--color-border)', marginBottom: '4px',
          }}>
            Toggle Columns
          </div>
          {ALL_COLS.map(col => {
            const isVisible = visibleCols.has(col.key);
            return (
              <button
                key={col.key}
                onClick={e => { e.stopPropagation(); onToggle(col.key); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {col.label}
                <span style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                  border: `1.5px solid ${isVisible ? '#7C3AED' : 'var(--color-border)'}`,
                  backgroundColor: isVisible ? '#7C3AED' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}>
                  {isVisible && <Check size={10} color="white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

function SortableTh({ children, colKey, sortCol, sortDir, onSort, style }: {
  children: React.ReactNode; colKey: SortCol; sortCol: SortCol; sortDir: SortDir;
  onSort: (col: SortCol) => void; style?: React.CSSProperties;
}) {
  const isActive = sortCol === colKey;
  return (
    <th onClick={() => onSort(colKey)} style={{ ...style, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {children}
        <span style={{ color: isActive ? '#7C3AED' : 'var(--color-border)', display: 'flex', transition: 'color 0.15s' }}>
          {isActive
            ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
            : <ChevronsUpDown size={12} />}
        </span>
      </div>
    </th>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CampaignsTable({ campaigns, onRowClick, onCampaignAction = () => {} }: CampaignsTableProps) {
  const [activeTab,    setActiveTab]    = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortCol,      setSortCol]      = useState<SortCol>(null);
  const [sortDir,      setSortDir]      = useState<SortDir>('asc');
  const [visibleCols,  setVisibleCols]  = useState<Set<ColKey>>(new Set(ALL_COLS.map(c => c.key)));
  const [filtersOpen,  setFiltersOpen]  = useState(false);
  const [filterChannels, setFilterChannels] = useState<Set<string>>(new Set());
  const [filterCities,   setFilterCities]   = useState<Set<string>>(new Set());
  const [rppDropOpen,  setRppDropOpen]  = useState(false);
  const rppDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rppDropRef.current && !rppDropRef.current.contains(e.target as Node)) setRppDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const statusTabs = [
    { label: 'All Campaigns', value: 'all',       count: campaigns.length },
    { label: 'Active',        value: 'active',    count: campaigns.filter(c => c.status === 'active').length },
    { label: 'Draft',         value: 'draft',     count: campaigns.filter(c => c.status === 'draft').length },
    { label: 'Paused',        value: 'paused',    count: campaigns.filter(c => c.status === 'paused').length },
    { label: 'Completed',     value: 'completed', count: campaigns.filter(c => c.status === 'completed').length },
  ];

  const uniqueChannels = Array.from(new Set(campaigns.map(c => c.channel))).sort();
  const uniqueCities   = Array.from(new Set(campaigns.flatMap(c => c.cities))).sort();

  const activeFilterCount = [filterChannels.size > 0, filterCities.size > 0].filter(Boolean).length;

  const clearFilters = () => { setFilterChannels(new Set()); setFilterCities(new Set()); setCurrentPage(1); };

  // Filter pipeline
  const tabFiltered = activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab);
  const searched = tabFiltered.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.cities.some(city => city.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterChannels.size > 0 && !filterChannels.has(c.channel)) return false;
    if (filterCities.size > 0 && !c.cities.some(city => filterCities.has(city))) return false;
    return true;
  });

  // Sort
  const sorted = [...searched].sort((a, b) => {
    if (!sortCol) return 0;
    let av: number | string = 0, bv: number | string = 0;
    if (sortCol === 'name')            { av = a.name; bv = b.name; }
    if (sortCol === 'driversEnrolled') { av = a.driversEnrolled; bv = b.driversEnrolled; }
    if (sortCol === 'pointsUsed')      { av = a.pointsUsed; bv = b.pointsUsed; }
    if (sortCol === 'startDate')       { av = a.startDate; bv = b.startDate; }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const totalItems  = sorted.length;
  const startIdx    = (currentPage - 1) * itemsPerPage;
  const endIdx      = Math.min(startIdx + itemsPerPage, totalItems);
  const paginated   = sorted.slice(startIdx, endIdx);
  const totalPages  = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleCol = (key: ColKey) => {
    setVisibleCols(prev => {
      const ns = new Set(prev);
      ns.has(key) ? ns.delete(key) : ns.add(key);
      return ns;
    });
  };

  const thStyle: React.CSSProperties = {
    padding: '11px 16px',
    textAlign: 'left',
    fontFamily: 'var(--font-family-geist)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-muted-foreground)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-family-geist)',
    fontSize: 'var(--text-14)',
    color: 'var(--color-foreground)',
    verticalAlign: 'middle',
  };

  // Filter panel checkbox
  const FilterCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '7px 10px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
        backgroundColor: checked ? 'rgba(124,58,237,0.04)' : 'transparent', transition: 'background-color 0.1s',
      }}
      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-secondary)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = checked ? 'rgba(124,58,237,0.04)' : 'transparent'; }}
    >
      <div style={{
        width: '15px', height: '15px', borderRadius: '3px', flexShrink: 0,
        border: `1.5px solid ${checked ? '#7C3AED' : 'var(--color-border)'}`,
        backgroundColor: checked ? '#7C3AED' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
      }}>
        {checked && <Check size={9} color="white" strokeWidth={3} />}
      </div>
      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--elevation-sm)',
      overflow: 'hidden',
    }}>
      {/* ── Status Tabs ── */}
      <div style={{
        padding: '0 20px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <StatusTabs tabs={statusTabs} activeTab={activeTab} onTabChange={(v) => { setActiveTab(v); setCurrentPage(1); }} />
      </div>

      {/* ── Toolbar ── */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: filtersOpen ? '1px solid var(--color-border)' : 'none', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search campaigns, clients, cities…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-input-background)',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {/* Filters button */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 14px', borderRadius: 'var(--radius)',
            border: `1px solid ${filtersOpen || activeFilterCount > 0 ? '#7C3AED' : 'var(--color-border)'}`,
            backgroundColor: filtersOpen || activeFilterCount > 0 ? 'rgba(124,58,237,0.06)' : 'var(--color-card)',
            color: filtersOpen || activeFilterCount > 0 ? '#7C3AED' : 'var(--color-foreground)',
            fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px',
              backgroundColor: '#7C3AED', color: 'white', fontSize: '10px', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Column toggle */}
        <ColumnToggle visibleCols={visibleCols} onToggle={toggleCol} />

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '10px 12px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
              color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
          >
            <X size={14} /> Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
          {totalItems} campaign{totalItems !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {filtersOpen && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'rgba(124,58,237,0.02)',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          {/* Channel */}
          <div style={{ minWidth: '160px' }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Channel
            </div>
            {uniqueChannels.map(ch => (
              <FilterCheckbox
                key={ch} label={ch}
                checked={filterChannels.has(ch)}
                onChange={() => {
                  const ns = new Set(filterChannels);
                  ns.has(ch) ? ns.delete(ch) : ns.add(ch);
                  setFilterChannels(ns); setCurrentPage(1);
                }}
              />
            ))}
          </div>
          {/* Cities */}
          <div style={{ minWidth: '200px', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              City
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {uniqueCities.map(city => {
                const checked = filterCities.has(city);
                return (
                  <button
                    key={city}
                    onClick={() => {
                      const ns = new Set(filterCities);
                      ns.has(city) ? ns.delete(city) : ns.add(city);
                      setFilterCities(ns); setCurrentPage(1);
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--radius)',
                      border: `1px solid ${checked ? '#7C3AED' : 'var(--color-border)'}`,
                      backgroundColor: checked ? 'rgba(124,58,237,0.08)' : 'var(--color-card)',
                      color: checked ? '#7C3AED' : 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                      fontWeight: checked ? 500 : 400, cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={clearFilters}
              style={{
                padding: '7px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
                color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)',
                fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
            >
              Reset all
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr>
              {visibleCols.has('campaign') && (
                <SortableTh colKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={thStyle}>
                  Campaign
                </SortableTh>
              )}
              {visibleCols.has('channel') && <th style={{ ...thStyle, width: '100px' }}>Channel</th>}
              {visibleCols.has('cities') && <th style={{ ...thStyle, width: '160px' }}>Cities</th>}
              {visibleCols.has('period') && (
                <SortableTh colKey="startDate" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ ...thStyle, width: '160px' }}>
                  Period
                </SortableTh>
              )}
              {visibleCols.has('enrolled') && (
                <SortableTh colKey="driversEnrolled" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ ...thStyle, width: '110px' }}>
                  Enrolled
                </SortableTh>
              )}
              {visibleCols.has('progress') && (
                <SortableTh colKey="pointsUsed" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ ...thStyle, width: '170px' }}>
                  Points
                </SortableTh>
              )}
              {visibleCols.has('status') && <th style={{ ...thStyle, width: '110px' }}>Status</th>}
              <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols.size + 1}
                  style={{ ...tdStyle, textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted-foreground)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Search size={28} style={{ opacity: 0.3 }} />
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)' }}>
                      No campaigns match your filters
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((campaign, rowIdx) => (
                <tr
                  key={campaign.id}
                  onClick={() => onRowClick?.(campaign)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: rowIdx % 2 === 0 ? 'var(--color-card)' : 'rgba(245,245,245,0.35)',
                    transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(124,58,237,0.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowIdx % 2 === 0 ? 'var(--color-card)' : 'rgba(245,245,245,0.35)'; }}
                >
                  {/* Campaign Name */}
                  {visibleCols.has('campaign') && (
                    <td style={tdStyle}>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                          fontWeight: 'var(--font-weight-medium)', color: 'var(--color-foreground)',
                          marginBottom: '2px',
                        }}>
                          {campaign.name}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                          color: 'var(--color-muted-foreground)',
                        }}>
                          {campaign.client} · {campaign.id}
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Channel */}
                  {visibleCols.has('channel') && (
                    <td style={tdStyle}>
                      <ChannelBadge channel={campaign.channel} />
                    </td>
                  )}

                  {/* Cities */}
                  {visibleCols.has('cities') && (
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {campaign.cities.slice(0, 2).map(city => (
                          <span key={city} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)',
                            fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-foreground)',
                          }}>
                            <MapPin size={9} style={{ color: 'var(--color-muted-foreground)' }} />
                            {city}
                          </span>
                        ))}
                        {campaign.cities.length > 2 && (
                          <span style={{
                            padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)',
                            fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)',
                          }}>
                            +{campaign.cities.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Period */}
                  {visibleCols.has('period') && (
                    <td style={tdStyle}>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)' }}>
                        {fmtDate(campaign.startDate)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                        → {fmtDate(campaign.endDate)}
                      </div>
                    </td>
                  )}

                  {/* Enrolled */}
                  {visibleCols.has('enrolled') && (
                    <td style={{ ...tdStyle, fontWeight: 'var(--font-weight-medium)' }}>
                      {campaign.driversEnrolled.toLocaleString()}
                    </td>
                  )}

                  {/* Progress */}
                  {visibleCols.has('progress') && (
                    <td style={tdStyle}>
                      <PointsProgress used={campaign.pointsUsed} budget={campaign.pointsBudget} />
                    </td>
                  )}

                  {/* Status */}
                  {visibleCols.has('status') && (
                    <td style={tdStyle}>
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                  )}

                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <ActionMenu campaign={campaign} onAction={onCampaignAction} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'var(--color-card)', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>
          {totalItems === 0 ? 'No results' : `${startIdx + 1}–${endIdx} of ${totalItems}`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Rows per page */}
          <div ref={rppDropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setRppDropOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
                color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)', cursor: 'pointer',
              }}
            >
              {itemsPerPage} / page <ChevronDown size={13} />
            </button>
            {rppDropOpen && (
              <div style={{
                position: 'absolute', bottom: '100%', right: 0, marginBottom: '4px',
                backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                zIndex: 100, overflow: 'hidden', minWidth: '100px',
              }}>
                {[10, 25, 50].map(n => (
                  <button key={n} onClick={() => { setItemsPerPage(n); setCurrentPage(1); setRppDropOpen(false); }} style={{
                    width: '100%', padding: '8px 14px', border: 'none',
                    backgroundColor: itemsPerPage === n ? 'rgba(124,58,237,0.08)' : 'transparent',
                    color: itemsPerPage === n ? '#7C3AED' : 'var(--color-foreground)',
                    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                    fontWeight: itemsPerPage === n ? 600 : 400, cursor: 'pointer', textAlign: 'left',
                  }}>
                    {n} / page
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Page nav */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              backgroundColor: currentPage === 1 ? 'var(--color-secondary)' : 'var(--color-card)',
              color: currentPage === 1 ? 'var(--color-muted-foreground)' : 'var(--color-foreground)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={15} />
          </button>

          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', minWidth: '80px', textAlign: 'center' }}>
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              backgroundColor: currentPage === totalPages ? 'var(--color-secondary)' : 'var(--color-card)',
              color: currentPage === totalPages ? 'var(--color-muted-foreground)' : 'var(--color-foreground)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
