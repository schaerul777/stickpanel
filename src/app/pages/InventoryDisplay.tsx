import { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router';
import {
  Search, SlidersHorizontal, Columns3, Plus, Pencil, Copy, Trash2, Eye,
  ChevronDown, X, ChevronLeft, ChevronRight, Check, HelpCircle, ImageOff,
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// ─── Types ────────────────────────────────────────────────────────────────────

type DisplayType = 'Digital' | 'Conventional';
type ConnectionType = 'ScreenApp' | 'HTML' | 'API INTEGRATION';
type StatusType = 'Online' | 'Offline';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  lastUpdate: string;
  type: string;
  category: string;
  displayType: DisplayType;
  price: number;
  priceUnit: string;
  cpm: number | null;
  resolution: string | null;
  connection: ConnectionType | null;
  status: StatusType | null;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_ITEMS: InventoryItem[] = [
  { id: 'i-1',  name: 'LED Videotron Kuningan',              sku: 'JUG67KGA2001', lastUpdate: '18/08/2026 09:14', type: 'DOOH', category: 'Digital Billboard', displayType: 'Digital',      price: 150_000_000, priceUnit: 'per month', cpm: 80_000, resolution: '1920 x 1080', connection: 'ScreenApp',      status: 'Online'  },
  { id: 'i-2',  name: 'Videotron Ancol Beach',                sku: 'JUG67KGA2002', lastUpdate: '18/08/2026 09:02', type: 'DOOH', category: 'Digital Billboard', displayType: 'Digital',      price: 120_000_000, priceUnit: 'per month', cpm: 75_000, resolution: '1920 x 1080', connection: 'HTML',           status: 'Online'  },
  { id: 'i-3',  name: 'LED Screen Kuningan Tower',            sku: 'JUG67KGA2003', lastUpdate: '17/08/2026 16:40', type: 'DOOH', category: 'Digital Signage',   displayType: 'Digital',      price: 95_000_000,  priceUnit: 'per month', cpm: null,   resolution: '1080 x 1920', connection: 'API INTEGRATION', status: 'Online'  },
  { id: 'i-4',  name: 'Digital Panel Kuningan City',          sku: 'JUG67KGA2004', lastUpdate: '17/08/2026 11:22', type: 'DOOH', category: 'Digital Billboard', displayType: 'Digital',      price: 110_000_000, priceUnit: 'per month', cpm: 65_000, resolution: null,          connection: 'ScreenApp',      status: 'Offline' },
  { id: 'i-5',  name: 'LED Screen Sudirman Plaza',            sku: 'JUG67KGA2005', lastUpdate: '16/08/2026 14:05', type: 'DOOH', category: 'Digital Signage',   displayType: 'Digital',      price: 130_000_000, priceUnit: 'per month', cpm: 90_000, resolution: '1920 x 1080', connection: null,             status: 'Online'  },
  { id: 'i-6',  name: 'Videotron Bundaran HI',                sku: 'JUG67KGA2006', lastUpdate: '15/08/2026 08:51', type: 'DOOH', category: 'Digital Billboard', displayType: 'Digital',      price: 175_000_000, priceUnit: 'per month', cpm: 100_000, resolution: '3840 x 2160', connection: 'API INTEGRATION', status: 'Offline' },
  { id: 'i-7',  name: 'Static Billboard Sudirman',            sku: 'JUG67KGA2007', lastUpdate: '18/08/2026 10:32', type: 'OOH',  category: 'Static Billboard',  displayType: 'Conventional', price: 45_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-8',  name: 'Billboard MH Thamrin',                 sku: 'JUG67KGA2008', lastUpdate: '17/08/2026 13:47', type: 'OOH',  category: 'Static Billboard',  displayType: 'Conventional', price: 55_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-9',  name: 'Baliho Semanggi',                      sku: 'JUG67KGA2009', lastUpdate: '16/08/2026 09:18', type: 'OOH',  category: 'Baliho',            displayType: 'Conventional', price: 25_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-10', name: 'Static Panel Kemayoran',                sku: 'JUG67KGA2010', lastUpdate: '15/08/2026 15:29', type: 'OOH',  category: 'Static Panel',      displayType: 'Conventional', price: 30_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-11', name: 'Billboard Cempaka Mas I',                sku: 'JUG67KGA2011', lastUpdate: '14/08/2026 11:05', type: 'OOH',  category: 'Billboard',         displayType: 'Conventional', price: 40_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-12', name: 'Static Billboard Thamrin',               sku: 'JUG67KGA2012', lastUpdate: '13/08/2026 17:38', type: 'OOH',  category: 'Static Billboard',  displayType: 'Conventional', price: 60_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-13', name: 'Static Billboard Sudirman North',        sku: 'JUG67KGA2013', lastUpdate: '12/08/2026 08:57', type: 'OOH',  category: 'Static Billboard',  displayType: 'Conventional', price: 38_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
  { id: 'i-14', name: 'Billboard ITC Cempaka Putih (Pilar)',    sku: 'JUG67KGA2014', lastUpdate: '11/08/2026 12:14', type: 'OOH',  category: 'Pillar Billboard',  displayType: 'Conventional', price: 33_000_000,  priceUnit: 'per month', cpm: null, resolution: null, connection: null, status: null },
];

// ─── Digital-only column config ────────────────────────────────────────────────

const DIGITAL_ONLY_COLS = [
  { key: 'cpm',        label: 'CPM',        width: 160, tooltip: 'Cost per 1,000 impressions shown on this display.' },
  { key: 'resolution', label: 'Resolution', width: 160, tooltip: null as string | null },
  { key: 'connection', label: 'Connection', width: 160, tooltip: 'How this display connects to receive content updates.' },
  { key: 'status',     label: 'Status',     width: 140, tooltip: 'Whether the display is currently online and reporting.' },
] as const;
type DigitalColKey = typeof DIGITAL_ONLY_COLS[number]['key'];

const PARENT_FIXED_COLS = ['96px', 'minmax(220px, 1fr)', '200px'];

function buildGridCols(tab: DisplayType, visibleDigitalCols: Set<DigitalColKey>) {
  const parts = [...PARENT_FIXED_COLS];
  if (tab === 'Conventional') parts.push('160px'); // Price — Conventional only
  if (tab === 'Digital') {
    for (const c of DIGITAL_ONLY_COLS) {
      if (visibleDigitalCols.has(c.key)) parts.push(`${c.width}px`);
    }
  }
  parts.push('148px');
  return parts.join(' ');
}

// ─── Small shared helpers ───────────────────────────────────────────────────────

function usePortalMenu() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', outside);
    document.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('scroll', scroll, true); };
  }, [open]);

  const toggle = (rightAlign = true, menuWidth = 200) => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: rightAlign ? r.right - menuWidth : r.left });
    }
    setOpen(v => !v);
  };
  return { open, pos, btnRef, menuRef, toggle };
}

function TooltipIcon({ text }: { text: string }) {
  return (
    <span title={text} style={{ display: 'inline-flex', cursor: 'help' }}>
      <HelpCircle size={13} style={{ color: 'var(--muted-foreground)' }} />
    </span>
  );
}

function StatusPill({ status }: { status: StatusType }) {
  const isOnline = status === 'Online';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 12px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: isOnline ? 'rgba(82,196,26,0.1)' : 'rgba(115,115,115,0.1)',
      border: `1px solid ${isOnline ? 'rgba(82,196,26,0.35)' : 'var(--border)'}`,
      color: isOnline ? '#389e0d' : 'var(--muted-foreground)',
      fontFamily: 'var(--font-family-geist)',
    }}>
      {status}
    </span>
  );
}

function AddFieldButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        border: 'none', background: 'none', padding: 0, cursor: 'pointer',
        color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '13px',
        fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px',
      }}
    >
      <Plus size={13} /> Add {label}
    </button>
  );
}

// ─── Preview quick-look lightbox ────────────────────────────────────────────────

function PreviewLightbox({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', width: '480px', maxWidth: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </div>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--muted)', cursor: 'pointer', display: 'flex', color: 'var(--muted-foreground)' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ aspectRatio: '4 / 3', backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageWithFallback src="/inventory-placeholder.png" alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ padding: '12px 18px', fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>
          {item.sku} · Last update: {item.lastUpdate}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── ColumnToggle ───────────────────────────────────────────────────────────────

function ColumnToggle({ visibleCols, onToggle }: { visibleCols: Set<DigitalColKey>; onToggle: (k: DigitalColKey) => void }) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();
  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => toggle(true, 200)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 13px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          backgroundColor: open ? 'var(--muted)' : 'var(--card)',
          color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', cursor: 'pointer',
        }}
      >
        <Columns3 size={14} /> Columns
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: '200px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Digital Columns
            </span>
          </div>
          {DIGITAL_ONLY_COLS.map(col => (
            <button
              key={col.key}
              onClick={() => onToggle(col.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: 'none', textAlign: 'left', backgroundColor: 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', cursor: 'pointer' }}
            >
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: visibleCols.has(col.key) ? 'none' : '1.5px solid var(--border)', backgroundColor: visibleCols.has(col.key) ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {visibleCols.has(col.key) && <Check size={10} color="white" />}
              </div>
              {col.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── MultiSelect (filter panel) ─────────────────────────────────────────────────

function MultiSelect({ options, value, onChange, placeholder }: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (opt: string) => onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  const label = value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value.length} selected`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', height: '36px', padding: '0 10px', border: `1px solid ${open ? '#7C3AED' : 'var(--border)'}`, borderRadius: 'var(--radius)', backgroundColor: 'var(--input-background)', color: value.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {value.length > 0 && (
          <span onClick={e => { e.stopPropagation(); onChange([]); }} style={{ display: 'inline-flex', cursor: 'pointer', color: 'var(--muted-foreground)', flexShrink: 0 }}>
            <X size={12} />
          </span>
        )}
        <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '100%', overflow: 'hidden' }}>
          {options.map(opt => {
            const checked = value.includes(opt);
            return (
              <button key={opt} onClick={() => toggle(opt)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', backgroundColor: checked ? 'rgba(124,58,237,0.06)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '13px', textAlign: 'left' }}>
                <div style={{ width: '15px', height: '15px', borderRadius: '3px', flexShrink: 0, border: checked ? '1px solid #7C3AED' : '1px solid var(--border)', backgroundColor: checked ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {checked && <Check size={10} style={{ color: 'white' }} />}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', backgroundColor: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-family-geist)', border: '1px solid rgba(124,58,237,0.25)' }}>
      {label}
      <button onClick={onRemove} style={{ display: 'inline-flex', border: 'none', background: 'none', color: '#7C3AED', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
        <X size={11} />
      </button>
    </span>
  );
}

function PaginationButton({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 'var(--radius)', border: active ? '1px solid #7C3AED' : '1px solid var(--border)', backgroundColor: active ? '#7C3AED' : disabled ? 'transparent' : 'var(--card)', color: active ? 'white' : disabled ? 'var(--muted-foreground)' : 'var(--foreground)', fontSize: '13px', fontFamily: 'var(--font-family-geist)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
    >
      {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50];

export function InventoryDisplay() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [activeTab, setActiveTab] = useState<DisplayType>('Digital');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterConnection, setFilterConnection] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [visibleDigitalCols, setVisibleDigitalCols] = useState<Set<DigitalColKey>>(
    new Set(DIGITAL_ONLY_COLS.map(c => c.key)),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const { toasts, showToast, dismiss } = useToast();

  const toggleDigitalCol = (k: DigitalColKey) => {
    setVisibleDigitalCols(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const setField = (id: string, patch: Partial<InventoryItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };

  const handleDuplicate = (item: InventoryItem) => {
    const copy: InventoryItem = { ...item, id: `${item.id}-copy-${Date.now()}`, name: `${item.name} (Copy)`, sku: `${item.sku}-C` };
    setItems(prev => [copy, ...prev]);
    showToast('success', 'Item Duplicated', `${item.name} has been duplicated.`);
  };

  const handleRemove = (item: InventoryItem) => {
    setItems(prev => prev.filter(it => it.id !== item.id));
    showToast('success', 'Item Removed', `${item.name} has been removed.`);
  };

  const tabCounts = useMemo(() => ({
    Digital: items.filter(i => i.displayType === 'Digital').length,
    Conventional: items.filter(i => i.displayType === 'Conventional').length,
  }), [items]);

  const categoryOptions = useMemo(() => [...new Set(items.map(i => i.category))], [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(it => {
      if (it.displayType !== activeTab) return false;
      if (q && !it.name.toLowerCase().includes(q) && !it.sku.toLowerCase().includes(q)) return false;
      if (filterCategory.length > 0 && !filterCategory.includes(it.category)) return false;
      if (activeTab === 'Digital') {
        if (filterConnection.length > 0 && (!it.connection || !filterConnection.includes(it.connection))) return false;
        if (filterStatus.length > 0 && (!it.status || !filterStatus.includes(it.status))) return false;
      }
      return true;
    });
  }, [items, activeTab, search, filterCategory, filterConnection, filterStatus]);

  const activeFilterCount = filterCategory.length + filterConnection.length + filterStatus.length;
  const clearFilters = () => { setFilterCategory([]); setFilterConnection([]); setFilterStatus([]); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const gridCols = buildGridCols(activeTab, visibleDigitalCols);

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600,
    color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap', backgroundColor: 'var(--muted)', overflow: 'hidden',
  };
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--font-family-geist)',
    color: 'var(--foreground)', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', minWidth: 0,
  };
  const inputStyle: React.CSSProperties = {
    height: '36px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    backgroundColor: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)',
    fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', maxWidth: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
          Inventory / Display
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>
              Display
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px', lineHeight: 1.5, fontWeight: 400 }}>
              Browse and manage all digital and conventional display inventory.
            </p>
          </div>
          <button
            onClick={() => navigate('/inventory/display/new')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={14} /> Add Display
          </button>
        </div>
      </div>

      {/* ── Tabs — Display Type ── */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['Digital', 'Conventional'] as DisplayType[]).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              style={{
                position: 'relative', padding: '12px 16px', border: 'none', backgroundColor: 'transparent',
                fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 500,
                color: activeTab === tab ? '#7C3AED' : 'var(--muted-foreground)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
              }}
            >
              <span>{tab}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '18px', padding: '0 5px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: activeTab === tab ? 'rgba(124,58,237,0.12)' : 'var(--muted)', color: activeTab === tab ? '#7C3AED' : 'var(--muted-foreground)' }}>
                {tabCounts[tab]}
              </span>
              {activeTab === tab && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: '#7C3AED' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + Filters + Columns row ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '16px' : 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or SKU"
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '36px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: showFilters ? 'var(--muted)' : 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <SlidersHorizontal size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#7C3AED', color: 'white', fontSize: '11px', fontWeight: 600 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeTab === 'Digital' && (
            <ColumnToggle visibleCols={visibleDigitalCols} onToggle={toggleDigitalCol} />
          )}
        </div>

        {showFilters && (
          <div style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'Digital' ? 'repeat(3, 1fr)' : '1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Category</div>
                <MultiSelect options={categoryOptions} value={filterCategory} onChange={v => { setFilterCategory(v); setPage(1); }} placeholder="All categories" />
              </div>
              {activeTab === 'Digital' && (
                <>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Connection</div>
                    <MultiSelect options={['ScreenApp', 'HTML', 'API INTEGRATION']} value={filterConnection} onChange={v => { setFilterConnection(v); setPage(1); }} placeholder="All connections" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px' }}>Status</div>
                    <MultiSelect options={['Online', 'Offline']} value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} placeholder="All statuses" />
                  </div>
                </>
              )}
            </div>
            {activeFilterCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {filterCategory.map(c => <FilterChip key={c} label={`Category: ${c}`} onRemove={() => setFilterCategory(filterCategory.filter(x => x !== c))} />)}
                {filterConnection.map(c => <FilterChip key={c} label={`Connection: ${c}`} onRemove={() => setFilterConnection(filterConnection.filter(x => x !== c))} />)}
                {filterStatus.map(c => <FilterChip key={c} label={`Status: ${c}`} onRemove={() => setFilterStatus(filterStatus.filter(x => x !== c))} />)}
                <button onClick={clearFilters} style={{ fontSize: '12px', color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', padding: '0 4px' }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
        Showing {filtered.length} of {items.filter(i => i.displayType === activeTab).length} {activeTab.toLowerCase()} displays.
      </div>

      {/* ── Table ── */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <ImageOff size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>No results</div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Try adjusting your filters or search query.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div role="table" style={{ minWidth: '900px' }}>
              {/* Header row */}
              <div role="row" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
                <div role="columnheader" style={thStyle}>Preview</div>
                <div role="columnheader" style={thStyle}>Name &amp; SKU</div>
                <div role="columnheader" style={thStyle}>Type &amp; Category</div>
                {activeTab === 'Conventional' && <div role="columnheader" style={thStyle}>Price</div>}
                {activeTab === 'Digital' && DIGITAL_ONLY_COLS.filter(c => visibleDigitalCols.has(c.key)).map(col => (
                  <div key={col.key} role="columnheader" style={thStyle}>
                    {col.label}
                    {col.tooltip && <TooltipIcon text={col.tooltip} />}
                  </div>
                ))}
                <div role="columnheader" style={{ ...thStyle, justifyContent: 'center' }}>Action</div>
              </div>

              {/* Body rows */}
              {paginated.map(item => {
                const isHovered = hoveredRowId === item.id;
                return (
                  <div
                    key={item.id}
                    role="row"
                    style={{ display: 'grid', gridTemplateColumns: gridCols, backgroundColor: isHovered ? 'var(--muted)' : 'transparent', transition: 'background-color 0.15s' }}
                    onMouseEnter={() => setHoveredRowId(item.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    {/* Preview */}
                    <div role="cell" style={tdStyle}>
                      <div
                        onClick={() => setPreviewItem(item)}
                        style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, backgroundColor: 'var(--muted)' }}
                      >
                        <ImageWithFallback src="/inventory-placeholder.png" alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s',
                        }}>
                          <Eye size={20} style={{ color: 'white' }} />
                        </div>
                      </div>
                    </div>

                    {/* Name & SKU */}
                    <div role="cell" style={tdStyle}>
                      <div style={{ minWidth: 0, width: '100%' }}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{item.sku}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', opacity: 0.75, marginTop: '4px' }}>Last update: {item.lastUpdate}</div>
                      </div>
                    </div>

                    {/* Type & Category */}
                    <div role="cell" style={tdStyle}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.type}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{item.category}</div>
                      </div>
                    </div>

                    {/* Price — Conventional only */}
                    {activeTab === 'Conventional' && (
                      <div role="cell" style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{item.price.toLocaleString()}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{item.priceUnit}</div>
                        </div>
                      </div>
                    )}

                    {/* Digital-only columns */}
                    {activeTab === 'Digital' && visibleDigitalCols.has('cpm') && (
                      <div role="cell" style={tdStyle}>
                        {item.cpm != null
                          ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{`IDR ${item.cpm.toLocaleString()}`}</span>
                          : <AddFieldButton label="CPM" onClick={() => setField(item.id, { cpm: 50_000 })} />}
                      </div>
                    )}
                    {activeTab === 'Digital' && visibleDigitalCols.has('resolution') && (
                      <div role="cell" style={tdStyle}>
                        {item.resolution
                          ? <span>{item.resolution}</span>
                          : <AddFieldButton label="Resolution" onClick={() => setField(item.id, { resolution: '1920 x 1080' })} />}
                      </div>
                    )}
                    {activeTab === 'Digital' && visibleDigitalCols.has('connection') && (
                      <div role="cell" style={tdStyle}>
                        {item.connection
                          ? <span>{item.connection}</span>
                          : <AddFieldButton label="Connection" onClick={() => setField(item.id, { connection: 'ScreenApp' })} />}
                      </div>
                    )}
                    {activeTab === 'Digital' && visibleDigitalCols.has('status') && (
                      <div role="cell" style={tdStyle}>
                        {item.connection
                          ? <StatusPill status={item.status ?? 'Offline'} />
                          : <span style={{ color: 'var(--muted-foreground)' }}>N/A</span>}
                      </div>
                    )}

                    {/* Action — hover-reveal icon buttons */}
                    <div role="cell" style={{ ...tdStyle, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <button
                          onClick={() => showToast('info', 'Coming Soon', 'The Edit Display form is not yet available in this prototype.')}
                          title="Edit"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', flexShrink: 0, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(item)}
                          title="Duplicate"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', flexShrink: 0, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleRemove(item)}
                          title="Remove"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', flexShrink: 0, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220,38,38,0.3)', backgroundColor: 'var(--card)', color: '#DC2626', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer / Pagination ── */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Rows per page:</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ height: '32px', padding: '0 28px 0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', appearance: 'none', cursor: 'pointer', outline: 'none' }}
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PaginationButton disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></PaginationButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PaginationButton key={p} active={p === page} onClick={() => setPage(p)}>{p}</PaginationButton>
              ))}
              <PaginationButton disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></PaginationButton>
            </div>
          </div>
        </div>
      )}

      {previewItem && <PreviewLightbox item={previewItem} onClose={() => setPreviewItem(null)} />}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
