import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Search,
  MapPin,
  Coins,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Edit,
  UserCheck,
  Ban,
  Star,
  StarOff,
  Download,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  Check,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Checkbox } from './Checkbox';
import { StatusTabs } from './StatusTabs';

export interface VehicleRecord {
  id: string;
  vehicleType: string;
  plateNumber: string;
  vehicleOwner?: string;
  vehicleColor?: string;
  manufacturedYear?: number;
  odometerSticker?: string;
  licenseNumberType?: 'Black' | 'Yellow';
  stnkImage?: boolean;
  isActive: boolean;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  mobile: string;
  whatsappVerified: boolean;
  channel: 'GTI' | 'TPI' | 'NON GRAB';
  city: string;
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  nationalId: string;
  driverLicense: string;
  profileCompletion: number;
  bankAccountName: string;
  bankAccountNumber: string;
  accountRelation: 'Self' | 'Wife/Husband' | 'Brother/Sister' | 'Parents' | 'Other';
  vehicleType: string;
  plateNumber: string;
  vehicleOwner?: string;
  vehicleColor?: string;
  manufacturedYear?: number;
  odometerSticker?: string;
  licenseNumberType?: 'Black' | 'Yellow';
  stnkImage?: boolean;
  vehicles?: VehicleRecord[];
  totalPoints: number;
  lastCampaign?: { name: string; date: string };
  community?: string;
  driverType: 'Normal' | 'Replacement' | 'Vendor';
  isVIP: boolean;
  religion?: string;
  birthDate: string;
  domicile: string;
  blacklistReason?: string;
  suspendedReason?: string;
}

interface DriversTableProps {
  drivers: Driver[];
  onDriverAction?: (action: string, driverId: string) => void;
  onRowClick?: (driver: Driver) => void;
}

type SortCol = 'name' | 'points' | 'profile' | null;
type SortDir = 'asc' | 'desc';

// All toggleable columns (checkbox & actions are always visible)
const ALL_COLS = [
  { key: 'name',    label: 'Name'    },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'mobile',  label: 'Mobile'  },
  { key: 'channel', label: 'Channel' },
  { key: 'points',  label: 'Points'  },
  { key: 'city',    label: 'City'    },
  { key: 'status',  label: 'Status'  },
  { key: 'profile', label: 'Profile' },
] as const;
type ColKey = typeof ALL_COLS[number]['key'];

// ── Deterministic registration date (matches DriverDetailDrawer seed) ────────
function driverRegDate(id: string): Date {
  const seed = parseInt(id.replace('DRV-', '')) || 10000;
  const s1 = Math.sin(seed * 127.1 + 200 * 311.7) * 43758.5453123;
  const s2 = Math.sin(seed * 127.1 + 201 * 311.7) * 43758.5453123;
  return new Date(2022, Math.floor((s1 - Math.floor(s1)) * 12), Math.floor(1 + (s2 - Math.floor(s2)) * 27));
}

// ── DualRangeSlider ────────────────────────────────────────────────────────────
function DualRangeSlider({
  min, max, minVal, maxVal, step = 1, onChange, formatValue,
}: {
  min: number; max: number; minVal: number; maxVal: number; step?: number;
  onChange: (lo: number, hi: number) => void;
  formatValue?: (v: number) => string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fmt   = formatValue ?? ((v: number) => v.toLocaleString());
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const snap  = (v: number) => Math.round(v / step) * step;

  const drag = (which: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const onMove = (ev: PointerEvent) => {
      const pct = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const raw = snap(min + pct * (max - min));
      if (which === 'min') onChange(clamp(raw, min, maxVal - step), maxVal);
      else                 onChange(minVal, clamp(raw, minVal + step, max));
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const lp = ((minVal - min) / (max - min)) * 100;
  const rp = ((maxVal - min) / (max - min)) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{fmt(minVal)}</span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{fmt(maxVal)}</span>
      </div>
      <div ref={trackRef} style={{ position: 'relative', height: '20px', userSelect: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', transform: 'translateY(-50%)', backgroundColor: 'var(--color-border)', borderRadius: '2px' }}>
          <div style={{ position: 'absolute', left: `${lp}%`, width: `${rp - lp}%`, height: '100%', backgroundColor: '#7C3AED', borderRadius: '2px' }} />
        </div>
        {(['min', 'max'] as const).map((which, i) => (
          <div key={which} onPointerDown={drag(which)} style={{
            position: 'absolute', left: `${i === 0 ? lp : rp}%`, top: '50%',
            transform: 'translate(-50%, -50%)', width: '16px', height: '16px',
            borderRadius: '50%', backgroundColor: 'var(--color-card)',
            border: '2.5px solid #7C3AED', cursor: 'grab', touchAction: 'none',
            boxShadow: '0 1px 6px rgba(124,58,237,0.3)', zIndex: 2,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{fmt(min)}</span>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{fmt(max)}</span>
      </div>
    </div>
  );
}

// ── MultiCheckboxFilter ────────────────────────────────────────────────────────
function MultiCheckboxFilter({
  selected, onChange, options, placeholder,
}: {
  selected: Set<string>;
  onChange: (v: Set<string>) => void;
  options: string[];
  placeholder: string;
}) {
  const [open,     setOpen]     = useState(false);
  const [search,   setSearch]   = useState('');
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const active  = selected.size > 0;

  const openDropdown = () => {
    if (btnRef.current) setDropRect(btnRef.current.getBoundingClientRect());
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false); setSearch('');
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => { if (btnRef.current) setDropRect(btnRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);

  const toggle = (opt: string) => {
    const ns = new Set(selected);
    ns.has(opt) ? ns.delete(opt) : ns.add(opt);
    onChange(ns);
  };

  const visibleOpts = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const displayLabel = active
    ? selected.size === 1 ? Array.from(selected)[0] : `${selected.size} selected`
    : placeholder;

  const dropdown = open && dropRect ? ReactDOM.createPortal(
    <div ref={dropRef} style={{
      position: 'fixed',
      top: dropRect.bottom + 4,
      left: dropRect.left,
      width: Math.max(dropRect.width, 200),
      zIndex: 99999,
      backgroundColor: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
      overflow: 'hidden',
    }}>
      {options.length > 5 && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
            <input
              autoFocus type="text" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '5px 8px 5px 26px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)',
                fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
      <div style={{ padding: '5px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => onChange(new Set(options))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: '#7C3AED', padding: '2px 0' }}>All</button>
        <button onClick={() => onChange(new Set())}        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: 'var(--color-muted-foreground)', padding: '2px 0' }}>None</button>
        {active && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{selected.size} of {options.length}</span>}
      </div>
      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {visibleOpts.map(opt => {
          const checked = selected.has(opt);
          return (
            <div
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '8px 10px', cursor: 'pointer',
                backgroundColor: checked ? 'rgba(124,58,237,0.04)' : 'transparent',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = checked ? 'rgba(124,58,237,0.04)' : 'transparent'; }}
            >
              <div style={{
                width: '15px', height: '15px', borderRadius: '3px', flexShrink: 0,
                border: `1.5px solid ${checked ? '#7C3AED' : 'var(--color-border)'}`,
                backgroundColor: checked ? '#7C3AED' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}>
                {checked && <Check size={9} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{opt}</span>
            </div>
          );
        })}
        {visibleOpts.length === 0 && (
          <div style={{ padding: '16px 10px', textAlign: 'center', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
            No matches
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={openDropdown}
        style={{
          width: '100%', padding: '8px 32px 8px 10px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${active || open ? '#7C3AED' : 'var(--color-border)'}`,
          backgroundColor: active ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)',
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          color: active ? '#7C3AED' : 'var(--color-foreground)',
          fontWeight: active ? 500 : 400,
          textAlign: 'left', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        {active && (
          <span style={{
            minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px',
            backgroundColor: '#7C3AED', color: 'white', fontSize: '10px', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {selected.size}
          </span>
        )}
      </button>
      <ChevronDown size={13} style={{
        position: 'absolute', right: '10px', top: '50%',
        transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})`,
        color: active ? '#7C3AED' : 'var(--color-muted-foreground)', pointerEvents: 'none',
        transition: 'transform 0.15s',
      }} />
      {dropdown}
    </div>
  );
}

// ── VIPToggle ──────────────────────────────────────────────────────────────────
function VIPToggle({ value, onChange }: { value: 'all' | 'vip' | 'non-vip'; onChange: (v: 'all' | 'vip' | 'non-vip') => void }) {
  const opts: { label: string; value: 'all' | 'vip' | 'non-vip' }[] = [
    { label: 'All', value: 'all' }, { label: '⭐ VIP', value: 'vip' }, { label: 'Non-VIP', value: 'non-vip' },
  ];
  return (
    <div style={{ display: 'flex', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden', backgroundColor: 'var(--color-input-background)' }}>
      {opts.map((o, i) => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, padding: '8px 6px',
          border: 'none', borderRight: i < opts.length - 1 ? '1px solid var(--color-border)' : 'none',
          backgroundColor: value === o.value ? '#7C3AED' : 'transparent',
          color: value === o.value ? 'white' : 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)', fontSize: '12px',
          fontWeight: value === o.value ? 600 : 400,
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ── FilterChip ─────────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 8px 3px 10px', borderRadius: 'var(--radius)',
      backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
      fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: '#7C3AED',
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', display: 'flex', alignItems: 'center', color: '#7C3AED', opacity: 0.7 }}>
        <X size={11} />
      </button>
    </div>
  );
}

// ── FilterLabel ────────────────────────────────────────────────────────────────
function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
      {children}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Driver['channel'] }) {
  const styles = {
    GTI:        { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB', border: 'rgba(59,130,246,0.25)' },
    TPI:        { bg: 'rgba(124,58,237,0.1)',  color: '#7C3AED', border: 'rgba(124,58,237,0.25)' },
    'NON GRAB': { bg: 'rgba(115,115,115,0.1)', color: '#525252', border: 'rgba(115,115,115,0.25)' },
  };
  const s = styles[channel];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: '11px',
      fontFamily: 'var(--font-family-geist)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {channel}
    </span>
  );
}

function DriverStatusBadge({ status }: { status: Driver['status'] }) {
  const cfg = {
    active:      { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', dot: '#22C55E', label: 'Active' },
    inactive:    { bg: 'rgba(115,115,115,0.1)', color: '#525252', dot: '#A3A3A3', label: 'Inactive' },
    suspended:   { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', dot: '#F59E0B', label: 'Suspended' },
    blacklisted: { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626', dot: '#EF4444', label: 'Blacklisted' },
  };
  const c = cfg[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 8px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: c.bg,
      color: c.color,
      fontSize: '12px',
      fontFamily: 'var(--font-family-geist)',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function ProfileCompletionBar({ value }: { value: number }) {
  const barColor  = value < 50 ? '#EF4444' : value <= 80 ? '#F59E0B' : '#22C55E';
  const textColor = value < 50 ? '#DC2626' : value <= 80 ? '#D97706' : '#16A34A';
  return (
    <div style={{ minWidth: '110px' }}>
      <div style={{ marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-family-geist)', fontWeight: 500, color: textColor }}>
          {value}%
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, backgroundColor: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// Generic portal dropdown hook
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

function ActionMenu({ driver, onAction }: { driver: Driver; onAction: (action: string, id: string) => void }) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();

  const isSuspended   = driver.status === 'suspended';
  const isBlacklisted = driver.status === 'blacklisted';

  const menuItems = [
    { action: 'view',    label: 'View Details',    Icon: ExternalLink, danger: false },
    { action: 'edit',    label: 'Edit Driver',      Icon: Edit,         danger: false },
    { action: 'verify',  label: 'Verify Documents', Icon: UserCheck,    danger: false },
    isSuspended
      ? { action: 'activate',    label: 'Activate Driver',      Icon: UserCheck, danger: false }
      : { action: 'suspend',     label: 'Suspend Driver',        Icon: Ban,       danger: true },
    isBlacklisted
      ? { action: 'unblacklist', label: 'Remove from Blacklist', Icon: UserCheck, danger: false }
      : { action: 'blacklist',   label: 'Blacklist Driver',      Icon: Ban,       danger: true },
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 195)}
        style={{
          width: '32px', height: '32px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-muted-foreground)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.color = 'var(--color-foreground)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.backgroundColor = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-muted-foreground)'; } }}
      >
        <MoreVertical size={15} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '195px', overflow: 'hidden',
        }}>
          {menuItems.map((item, idx) => {
            const { Icon } = item;
            return (
              <button
                key={item.action}
                onClick={e => { e.stopPropagation(); onAction(item.action, driver.id); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 14px', border: 'none',
                  borderTop: idx === 3 ? '1px solid var(--color-border)' : 'none',
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

// Bulk Actions dropdown
function BulkActionsMenu({ selectedIds, onAction, onClose }: {
  selectedIds: Set<string>;
  onAction: (action: string, ids: string) => void;
  onClose: () => void;
}) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();

  const bulkItems = [
    { action: 'bulk-suspend',    label: 'Suspend',       Icon: Ban,     danger: true  },
    { action: 'bulk-activate',   label: 'Activate',      Icon: UserCheck, danger: false },
    { action: 'bulk-vip',        label: 'Mark as VIP',   Icon: Star,    danger: false },
    { action: 'bulk-unvip',      label: 'Remove VIP',    Icon: StarOff, danger: false },
    { action: 'bulk-blacklist',  label: 'Blacklist',     Icon: Ban,     danger: true  },
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 180)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(59,130,246,0.35)',
          backgroundColor: 'transparent',
          color: '#3B82F6',
          fontFamily: 'var(--font-family-geist)',
          fontSize: '12px', fontWeight: 500, cursor: 'pointer',
        }}
      >
        Bulk Actions
        <ChevronDown size={13} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '180px', overflow: 'hidden',
        }}>
          {bulkItems.map((item, idx) => {
            const { Icon } = item;
            return (
              <button
                key={item.action}
                onClick={e => {
                  e.stopPropagation();
                  onAction(item.action, Array.from(selectedIds).join(','));
                  setOpen(false);
                  onClose();
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 14px', border: 'none',
                  borderTop: idx === 2 ? '1px solid var(--color-border)' : 'none',
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

// Column visibility toggle dropdown
function ColumnToggle({
  visibleCols,
  onToggle,
}: {
  visibleCols: Set<ColKey>;
  onToggle: (key: ColKey) => void;
}) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 200)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
      >
        <Columns3 size={15} />
        Columns
        <ChevronDown size={13} style={{ color: 'var(--color-muted-foreground)' }} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '200px', overflow: 'hidden',
          padding: '6px 0',
        }}>
          <div style={{
            padding: '8px 14px 6px',
            fontFamily: 'var(--font-family-geist)',
            fontSize: '11px', fontWeight: 600,
            color: 'var(--color-muted-foreground)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '4px',
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
                  backgroundColor: 'transparent',
                  color: 'var(--color-foreground)',
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
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
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

// Sortable column header
function SortableTh({
  children, colKey, sortCol, sortDir, onSort, style,
}: {
  children: React.ReactNode;
  colKey: SortCol;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  style?: React.CSSProperties;
}) {
  const isActive = sortCol === colKey;
  return (
    <th
      onClick={() => onSort(colKey)}
      style={{
        ...style,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {children}
        <span style={{ color: isActive ? '#7C3AED' : 'var(--color-border)', display: 'flex', transition: 'color 0.15s' }}>
          {isActive
            ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
            : <ChevronsUpDown size={12} />
          }
        </span>
      </div>
    </th>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DriversTable({ drivers, onDriverAction = () => {}, onRowClick }: DriversTableProps) {
  const [activeTab,    setActiveTab]    = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortCol,      setSortCol]      = useState<SortCol>(null);
  const [sortDir,      setSortDir]      = useState<SortDir>('asc');
  const [visibleCols,  setVisibleCols]  = useState<Set<ColKey>>(
    new Set(ALL_COLS.map(c => c.key))
  );
  const [pageDropOpen, setPageDropOpen] = useState(false);
  const [rppDropOpen,  setRppDropOpen]  = useState(false);
  const pageDropRef = useRef<HTMLDivElement>(null);
  const rppDropRef  = useRef<HTMLDivElement>(null);

  // ── Advanced filter state ──────────────────────────────────────────────────
  const [filtersOpen,      setFiltersOpen]      = useState(false);
  const [filterChannels,    setFilterChannels]    = useState<Set<string>>(new Set());
  const [filterCities,      setFilterCities]      = useState<Set<string>>(new Set());
  const [filterDriverTypes, setFilterDriverTypes] = useState<Set<string>>(new Set());
  const [filterVIP,         setFilterVIP]         = useState<'all' | 'vip' | 'non-vip'>('all');
  const [filterVehicles,    setFilterVehicles]    = useState<Set<string>>(new Set());
  const [filterCommunities, setFilterCommunities] = useState<Set<string>>(new Set());
  const [filterRegFrom,     setFilterRegFrom]     = useState('');
  const [filterRegTo,       setFilterRegTo]       = useState('');
  const [profileRange,      setProfileRange]      = useState<[number, number]>([0, 100]);

  // ── Derived dropdown options ───────────────────────────────────────────────
  const uniqueCities      = Array.from(new Set(drivers.map(d => d.city))).sort();
  const uniqueVehicles    = Array.from(new Set(drivers.map(d => d.vehicleType))).sort();
  const uniqueCommunities = Array.from(new Set(drivers.filter(d => d.community).map(d => d.community!))).sort();

  // ── Active filter count + clear ────────────────────────────────────────────
  const activeFilterCount = [
    filterChannels.size > 0,
    filterCities.size > 0,
    filterDriverTypes.size > 0,
    filterVehicles.size > 0,
    filterCommunities.size > 0,
    filterRegFrom, filterRegTo,
    filterVIP !== 'all',
    profileRange[0] > 0 || profileRange[1] < 100,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterChannels(new Set()); setFilterCities(new Set()); setFilterDriverTypes(new Set());
    setFilterVIP('all'); setFilterVehicles(new Set()); setFilterCommunities(new Set());
    setFilterRegFrom(''); setFilterRegTo('');
    setProfileRange([0, 100]);
    setCurrentPage(1);
  };

  // Close page / rpp dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pageDropRef.current && !pageDropRef.current.contains(e.target as Node)) setPageDropOpen(false);
      if (rppDropRef.current  && !rppDropRef.current.contains(e.target as Node))  setRppDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const statusTabs = [
    { label: 'All Drivers', value: 'all',         count: drivers.length },
    { label: 'Active',      value: 'active',      count: drivers.filter(d => d.status === 'active').length },
    { label: 'Suspended',   value: 'suspended',   count: drivers.filter(d => d.status === 'suspended').length },
    { label: 'Blacklisted', value: 'blacklisted', count: drivers.filter(d => d.status === 'blacklisted').length },
  ];

  // ── Filter ──
  const tabFiltered = activeTab === 'all' ? drivers : drivers.filter(d => d.status === activeTab);
  const searched = tabFiltered.filter(d => {
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        d.mobile.toLowerCase().includes(q) ||
        d.nationalId.includes(q) ||
        d.driverLicense.toLowerCase().includes(q) ||
        d.plateNumber.toLowerCase().replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      );
      if (!match) return false;
    }
    // Multi-select filters
    if (filterChannels.size > 0    && !filterChannels.has(d.channel))                             return false;
    if (filterCities.size > 0      && !filterCities.has(d.city))                                  return false;
    if (filterDriverTypes.size > 0 && !filterDriverTypes.has(d.driverType))                       return false;
    if (filterVehicles.size > 0    && !filterVehicles.has(d.vehicleType))                         return false;
    if (filterCommunities.size > 0 && (!d.community || !filterCommunities.has(d.community)))      return false;
    // VIP
    if (filterVIP === 'vip'     && !d.isVIP) return false;
    if (filterVIP === 'non-vip' &&  d.isVIP) return false;
    // Registration date range
    if (filterRegFrom || filterRegTo) {
      const reg = driverRegDate(d.id);
      if (filterRegFrom && reg < new Date(filterRegFrom))             return false;
      if (filterRegTo   && reg > new Date(filterRegTo + 'T23:59:59')) return false;
    }
    // Profile completion slider
    if (d.profileCompletion < profileRange[0] || d.profileCompletion > profileRange[1]) return false;
    return true;
  });

  // ── Sort ──
  const filtered = [...searched].sort((a, b) => {
    if (!sortCol) return 0;
    let aVal: number | string = 0;
    let bVal: number | string = 0;
    if (sortCol === 'name')    { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
    if (sortCol === 'points')  { aVal = a.totalPoints;        bVal = b.totalPoints; }
    if (sortCol === 'profile') { aVal = a.profileCompletion;  bVal = b.profileCompletion; }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex   = Math.min(startIndex + itemsPerPage, totalItems);
  const paginated  = filtered.slice(startIndex, endIndex);

  const selectedTotalPoints = drivers
    .filter(d => selectedIds.has(d.id))
    .reduce((sum, d) => sum + d.totalPoints, 0);

  // ── Handlers ──
  const handleTabChange = (tab: string) => { setActiveTab(tab); setCurrentPage(1); setSelectedIds(new Set()); };
  const handleSearch    = (q: string)   => { setSearchQuery(q); setCurrentPage(1); };
  const handleSort      = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const handleToggleCol = (key: ColKey) => {
    setVisibleCols(prev => {
      const ns = new Set(prev);
      if (ns.has(key)) { if (ns.size > 1) ns.delete(key); }
      else ns.add(key);
      return ns;
    });
  };

  const allPageSelected = paginated.length > 0 && paginated.every(d => selectedIds.has(d.id));
  const handleSelectAll = (checked: boolean) => {
    const ns = new Set(selectedIds);
    if (checked) paginated.forEach(d => ns.add(d.id));
    else paginated.forEach(d => ns.delete(d.id));
    setSelectedIds(ns);
  };
  const handleSelectRow = (id: string) => {
    const ns = new Set(selectedIds);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelectedIds(ns);
  };

  // ── Shared cell styles ──
  const thBase: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontFamily: 'var(--font-family-geist)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-muted-foreground)',
    backgroundColor: 'var(--color-secondary)',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--color-border)',
    userSelect: 'none',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  const tdBase: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'middle',
  };

  // ── Page number list ──
  const pageNumbers: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    const left  = Math.max(1, safePage - 2);
    const right = Math.min(totalPages, safePage + 2);
    if (left > 1)               pageNumbers.push(1);
    if (left > 2)               pageNumbers.push(-1);
    for (let i = left; i <= right; i++) pageNumbers.push(i);
    if (right < totalPages - 1) pageNumbers.push(-2);
    if (right < totalPages)     pageNumbers.push(totalPages);
  }

  // visible column count for colSpan
  const visibleColCount = 2 + visibleCols.size; // checkbox + visible cols + actions

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-foreground)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>

      {/* ── Status Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0 24px' }}>
        <StatusTabs tabs={statusTabs} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* ── Toolbar: Search + Filters + Columns toggle ── */}
      <div style={{ padding: '16px 24px', borderBottom: filtersOpen ? 'none' : '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{
              position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-muted-foreground)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search by name, email, phone, Driver ID, National ID, license number, plate number..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-input-background)',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 14px', borderRadius: 'var(--radius)',
              border: `1px solid ${filtersOpen || activeFilterCount > 0 ? '#7C3AED' : 'var(--color-border)'}`,
              backgroundColor: filtersOpen ? '#7C3AED' : activeFilterCount > 0 ? 'rgba(124,58,237,0.06)' : 'var(--color-card)',
              color: filtersOpen ? 'white' : activeFilterCount > 0 ? '#7C3AED' : 'var(--color-foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px',
                backgroundColor: filtersOpen ? 'rgba(255,255,255,0.28)' : '#7C3AED',
                color: 'white', fontSize: '11px', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Column visibility */}
          <ColumnToggle visibleCols={visibleCols} onToggle={handleToggleCol} />
        </div>
      </div>

      {/* ── Advanced Filters Panel ─────────────────────────────────────────── */}
      <div style={{
        maxHeight: filtersOpen ? '480px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          padding: '20px 24px 24px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-secondary)',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>

          {/* Row 1: Channel | City | Driver Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <FilterLabel>Channel</FilterLabel>
              <MultiCheckboxFilter
                selected={filterChannels}
                onChange={v => { setFilterChannels(v); setCurrentPage(1); }}
                options={['GTI', 'TPI', 'NON GRAB']}
                placeholder="All Channels"
              />
            </div>
            <div>
              <FilterLabel>City</FilterLabel>
              <MultiCheckboxFilter
                selected={filterCities}
                onChange={v => { setFilterCities(v); setCurrentPage(1); }}
                options={uniqueCities}
                placeholder="All Cities"
              />
            </div>
            <div>
              <FilterLabel>Driver Type</FilterLabel>
              <MultiCheckboxFilter
                selected={filterDriverTypes}
                onChange={v => { setFilterDriverTypes(v); setCurrentPage(1); }}
                options={['Normal', 'Replacement', 'Vendor']}
                placeholder="All Types"
              />
            </div>
          </div>

          {/* Row 2: VIP | Vehicle Type | Community */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <FilterLabel>VIP Status</FilterLabel>
              <VIPToggle value={filterVIP} onChange={v => { setFilterVIP(v); setCurrentPage(1); }} />
            </div>
            <div>
              <FilterLabel>Vehicle Type</FilterLabel>
              <MultiCheckboxFilter
                selected={filterVehicles}
                onChange={v => { setFilterVehicles(v); setCurrentPage(1); }}
                options={uniqueVehicles}
                placeholder="All Vehicles"
              />
            </div>
            <div>
              <FilterLabel>Community</FilterLabel>
              <MultiCheckboxFilter
                selected={filterCommunities}
                onChange={v => { setFilterCommunities(v); setCurrentPage(1); }}
                options={uniqueCommunities}
                placeholder="All Communities"
              />
            </div>
          </div>

          {/* Row 3: Registration Date | Profile Completion (2-col) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

            {/* Registration Date range */}
            <div>
              <FilterLabel>Registration Date</FilterLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['From', 'To'] as const).map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', width: '26px' }}>{label}</span>
                    <input
                      type="date"
                      value={label === 'From' ? filterRegFrom : filterRegTo}
                      onChange={e => { label === 'From' ? setFilterRegFrom(e.target.value) : setFilterRegTo(e.target.value); setCurrentPage(1); }}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 'var(--radius)', boxSizing: 'border-box',
                        border: `1px solid ${(label === 'From' ? filterRegFrom : filterRegTo) ? '#7C3AED' : 'var(--color-border)'}`,
                        backgroundColor: (label === 'From' ? filterRegFrom : filterRegTo) ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)',
                        fontFamily: 'var(--font-family-geist)', fontSize: '13px',
                        color: 'var(--color-foreground)', outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Completion slider */}
            <div>
              <FilterLabel>Profile Completion</FilterLabel>
              <DualRangeSlider
                min={0} max={100} step={5}
                minVal={profileRange[0]} maxVal={profileRange[1]}
                onChange={(lo, hi) => { setProfileRange([lo, hi]); setCurrentPage(1); }}
                formatValue={v => `${v}%`}
              />
            </div>
          </div>

          {/* Active chips + Clear All */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', minHeight: '24px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {filterChannels.size > 0 && (
                <FilterChip
                  label={filterChannels.size === 1 ? `Channel: ${Array.from(filterChannels)[0]}` : `Channel (${filterChannels.size})`}
                  onRemove={() => { setFilterChannels(new Set()); setCurrentPage(1); }}
                />
              )}
              {filterCities.size > 0 && (
                <FilterChip
                  label={filterCities.size === 1 ? `City: ${Array.from(filterCities)[0]}` : `City (${filterCities.size})`}
                  onRemove={() => { setFilterCities(new Set()); setCurrentPage(1); }}
                />
              )}
              {filterDriverTypes.size > 0 && (
                <FilterChip
                  label={filterDriverTypes.size === 1 ? `Type: ${Array.from(filterDriverTypes)[0]}` : `Type (${filterDriverTypes.size})`}
                  onRemove={() => { setFilterDriverTypes(new Set()); setCurrentPage(1); }}
                />
              )}
              {filterVIP !== 'all' && (
                <FilterChip label={filterVIP === 'vip' ? '⭐ VIP Only' : 'Non-VIP'} onRemove={() => { setFilterVIP('all'); setCurrentPage(1); }} />
              )}
              {filterVehicles.size > 0 && (
                <FilterChip
                  label={filterVehicles.size === 1 ? `Vehicle: ${Array.from(filterVehicles)[0]}` : `Vehicle (${filterVehicles.size})`}
                  onRemove={() => { setFilterVehicles(new Set()); setCurrentPage(1); }}
                />
              )}
              {filterCommunities.size > 0 && (
                <FilterChip
                  label={filterCommunities.size === 1 ? `Community: ${Array.from(filterCommunities)[0]}` : `Community (${filterCommunities.size})`}
                  onRemove={() => { setFilterCommunities(new Set()); setCurrentPage(1); }}
                />
              )}
              {(filterRegFrom || filterRegTo) && (
                <FilterChip label={`Reg: ${filterRegFrom || '…'} → ${filterRegTo || '…'}`} onRemove={() => { setFilterRegFrom(''); setFilterRegTo(''); setCurrentPage(1); }} />
              )}
              {(profileRange[0] > 0 || profileRange[1] < 100) && (
                <FilterChip label={`Profile: ${profileRange[0]}%–${profileRange[1]}%`} onRemove={() => { setProfileRange([0, 100]); setCurrentPage(1); }} />
              )}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px',
                border: 'none', backgroundColor: 'transparent',
                color: '#DC2626', fontFamily: 'var(--font-family-geist)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                textDecoration: 'underline', textUnderlineOffset: '2px',
              }}>
                <X size={12} /> Clear All Filters
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Count row ── */}
      <div style={{
        padding: '12px 24px',
        borderBottom: selectedIds.size > 0 ? 'none' : '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
          color: 'var(--color-muted-foreground)',
        }}>
          Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems.toLocaleString()} drivers
        </span>
      </div>

      {/* ── Selection banner ── */}
      {selectedIds.size > 0 && (
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(59,130,246,0.2)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
          backgroundColor: 'rgba(59,130,246,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <span style={{
            fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: '#3B82F6',
          }}>
            {selectedIds.size} driver{selectedIds.size !== 1 ? 's' : ''} selected
            &nbsp;·&nbsp;
            <span style={{ fontWeight: 400 }}>{selectedTotalPoints.toLocaleString()} total pts</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clear */}
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius)',
                border: '1px solid rgba(59,130,246,0.35)', backgroundColor: 'transparent',
                color: '#3B82F6', fontFamily: 'var(--font-family-geist)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Clear
            </button>

            {/* Export */}
            <button
              onClick={() => onDriverAction('bulk-export', Array.from(selectedIds).join(','))}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: 'var(--radius)',
                border: '1px solid rgba(59,130,246,0.35)', backgroundColor: 'transparent',
                color: '#3B82F6', fontFamily: 'var(--font-family-geist)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Download size={13} />
              Export Selected
            </button>

            {/* Bulk Actions dropdown */}
            <BulkActionsMenu
              selectedIds={selectedIds}
              onAction={onDriverAction}
              onClose={() => setSelectedIds(new Set())}
            />
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr>
              {/* Checkbox */}
              <th style={{ ...thBase, width: '56px', padding: '12px 12px' }}>
                <Checkbox checked={allPageSelected} onChange={handleSelectAll} />
              </th>

              {/* Name — sortable */}
              {visibleCols.has('name') && (
                <SortableTh colKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                  style={{ ...thBase, minWidth: '196px' }}>
                  Name
                </SortableTh>
              )}

              {/* Vehicle */}
              {visibleCols.has('vehicle') && (
                <th style={{ ...thBase, minWidth: '160px' }}>Vehicle</th>
              )}

              {/* Mobile */}
              {visibleCols.has('mobile') && (
                <th style={{ ...thBase, minWidth: '144px' }}>Mobile No</th>
              )}

              {/* Channel */}
              {visibleCols.has('channel') && (
                <th style={{ ...thBase, width: '96px' }}>Channel</th>
              )}

              {/* Points — sortable */}
              {visibleCols.has('points') && (
                <SortableTh colKey="points" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                  style={{ ...thBase, width: '104px' }}>
                  Points
                </SortableTh>
              )}

              {/* City */}
              {visibleCols.has('city') && (
                <th style={{ ...thBase, width: '108px' }}>City</th>
              )}

              {/* Status */}
              {visibleCols.has('status') && (
                <th style={{ ...thBase, minWidth: '116px' }}>Status</th>
              )}

              {/* Profile — sortable */}
              {visibleCols.has('profile') && (
                <SortableTh colKey="profile" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                  style={{ ...thBase, minWidth: '132px' }}>
                  Profile
                </SortableTh>
              )}

              {/* Actions sticky */}
              <th style={{
                ...thBase, position: 'sticky', right: 0, zIndex: 20,
                width: '60px', textAlign: 'center', boxShadow: '-3px 0 8px rgba(0,0,0,0.06)',
              }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} style={{
                  padding: '64px 24px', textAlign: 'center',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
                  color: 'var(--color-muted-foreground)',
                }}>
                  No drivers found matching your search.
                </td>
              </tr>
            ) : paginated.map(driver => {
              const isSelected = selectedIds.has(driver.id);
              return (
                <tr
                  key={driver.id}
                  style={{ backgroundColor: isSelected ? 'rgba(124,58,237,0.04)' : 'transparent', transition: 'background-color 0.15s', cursor: onRowClick ? 'pointer' : 'default' }}
                  onClick={() => onRowClick?.(driver)}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(124,58,237,0.04)' : 'transparent'; }}
                >
                  {/* Checkbox */}
                  <td style={{ ...tdBase, padding: '16px 12px' }} onClick={e => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onChange={() => handleSelectRow(driver.id)} />
                  </td>

                  {/* Name */}
                  {visibleCols.has('name') && (
                    <td style={tdBase}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          {driver.name}
                        </span>
                        <span title={driver.email} style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 400, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                          {driver.email}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Vehicle */}
                  {visibleCols.has('vehicle') && (
                    <td style={tdBase}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          {driver.vehicleType}
                        </span>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 400, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {driver.plateNumber}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Mobile */}
                  {visibleCols.has('mobile') && (
                    <td style={tdBase}>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                        {driver.mobile}
                      </span>
                    </td>
                  )}

                  {/* Channel */}
                  {visibleCols.has('channel') && (
                    <td style={tdBase}><ChannelBadge channel={driver.channel} /></td>
                  )}

                  {/* Points */}
                  {visibleCols.has('points') && (
                    <td style={tdBase}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Coins size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          {driver.totalPoints.toLocaleString()}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* City */}
                  {visibleCols.has('city') && (
                    <td style={tdBase}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={12} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          {driver.city}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Status */}
                  {visibleCols.has('status') && (
                    <td style={tdBase}><DriverStatusBadge status={driver.status} /></td>
                  )}

                  {/* Profile */}
                  {visibleCols.has('profile') && (
                    <td style={tdBase}><ProfileCompletionBar value={driver.profileCompletion} /></td>
                  )}

                  {/* Actions sticky */}
                  <td
                    onClick={e => e.stopPropagation()}
                    style={{
                      ...tdBase, position: 'sticky', right: 0,
                      backgroundColor: isSelected ? 'rgba(124,58,237,0.04)' : 'var(--color-card)',
                      zIndex: 5, boxShadow: '-3px 0 8px rgba(0,0,0,0.06)', textAlign: 'center',
                    }}
                  >
                    <ActionMenu driver={driver} onAction={onDriverAction} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination bar ── */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        flexWrap: 'wrap',
      }}>

        {/* Left: count label + rows per page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
            color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap',
          }}>
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems.toLocaleString()} drivers
          </span>

          {/* Rows per page dropdown */}
          <div ref={rppDropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setRppDropOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {itemsPerPage} / page
              <ChevronDown size={12} style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
            {rppDropOpen && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 4px)', left: 0,
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                zIndex: 9999, overflow: 'hidden', minWidth: '110px',
              }}>
                {[25, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => { setItemsPerPage(n); setCurrentPage(1); setRppDropOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', border: 'none',
                      backgroundColor: 'transparent',
                      color: n === itemsPerPage ? '#7C3AED' : 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      fontWeight: n === itemsPerPage ? 500 : 400,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {n} rows
                    {n === itemsPerPage && <Check size={12} color="#7C3AED" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: page number controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Prev */}
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ ...btnBase, opacity: safePage === 1 ? 0.4 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page buttons / ellipsis */}
          {pageNumbers.map((page, idx) =>
            page < 0 ? (
              <span key={`ellipsis-${idx}`} style={{
                padding: '0 4px', fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)',
              }}>…</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  minWidth: '32px', height: '32px',
                  borderRadius: 'var(--radius)',
                  border: page === safePage ? '1px solid #7C3AED' : '1px solid var(--color-border)',
                  backgroundColor: page === safePage ? '#7C3AED' : 'var(--color-card)',
                  color: page === safePage ? 'white' : 'var(--color-foreground)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                  fontWeight: page === safePage ? 500 : 400,
                  padding: '0 8px', transition: 'all 0.15s',
                }}
              >
                {page}
              </button>
            )
          )}

          {/* Page jump dropdown */}
          <div ref={pageDropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setPageDropOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                height: '32px', padding: '0 10px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-muted-foreground)',
                fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              Go to
              <ChevronDown size={12} />
            </button>
            {pageDropOpen && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 4px)', right: 0,
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                zIndex: 9999,
                maxHeight: '220px', overflowY: 'auto',
                minWidth: '90px',
              }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => { setCurrentPage(p); setPageDropOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 12px', border: 'none',
                      backgroundColor: 'transparent',
                      color: p === safePage ? '#7C3AED' : 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      fontWeight: p === safePage ? 500 : 400,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    Page {p}
                    {p === safePage && <Check size={11} color="#7C3AED" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Next */}
          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ ...btnBase, opacity: safePage === totalPages ? 0.4 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

    </div>
  );
}