import { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  Building2, Search, Plus, Trash2, Edit, Eye, Globe,
  ChevronDown, X, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ChevronsUpDown, Columns3,
  AlertTriangle, Check, Copy, MapPin
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

// ── Types ──────────────────────────────────────────────────────────────────────

interface City {
  id: string;
  cityName: string;
  abbreviation: string;
  province: string;
  country: string;
  centerLat: number | null;
  centerLong: number | null;
  topLeftLat: number | null;
  topLeftLong: number | null;
  bottomRightLat: number | null;
  bottomRightLong: number | null;
  createdDate: string;
  createdDateObj: Date;
}

interface CityFormState {
  cityName: string;
  province: string;
  abbreviation: string;
  centerLat: string;
  centerLong: string;
  topLeftLat: string;
  topLeftLong: string;
  bottomRightLat: string;
  bottomRightLong: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const INDONESIAN_PROVINCES = [
  'Aceh','Bali','Bangka Belitung','Banten','Bengkulu','DI Yogyakarta',
  'DKI Jakarta','Gorontalo','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur',
  'Kalimantan Barat','Kalimantan Selatan','Kalimantan Tengah','Kalimantan Timur',
  'Kalimantan Utara','Kepulauan Riau','Lampung','Maluku','Maluku Utara',
  'Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat',
  'Papua Barat Daya','Papua Pegunungan','Papua Selatan','Papua Tengah',
  'Riau','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah',
  'Sulawesi Tenggara','Sulawesi Utara','Sumatera Barat','Sumatera Selatan',
  'Sumatera Utara',
];

const INITIAL_CITIES: City[] = [
  { id:'550e8400-e29b-41d4-a716-446655440001', cityName:'Jakarta Selatan',   abbreviation:'JKTS', province:'DKI Jakarta',      country:'Indonesia', centerLat:-6.2615,  centerLong:106.8106,  topLeftLat:-6.1900, topLeftLong:106.7500, bottomRightLat:-6.3700, bottomRightLong:106.8700, createdDate:'Feb 25, 2025', createdDateObj:new Date('2025-02-25') },
  { id:'550e8400-e29b-41d4-a716-446655440002', cityName:'Jakarta Pusat',     abbreviation:'JKTP', province:'DKI Jakarta',      country:'Indonesia', centerLat:-6.1744,  centerLong:106.8294,  topLeftLat:-6.1200, topLeftLong:106.7800, bottomRightLat:-6.2300, bottomRightLong:106.8900, createdDate:'Feb 25, 2025', createdDateObj:new Date('2025-02-25') },
  { id:'550e8400-e29b-41d4-a716-446655440003', cityName:'Jakarta Utara',     abbreviation:'JKTU', province:'DKI Jakarta',      country:'Indonesia', centerLat:-6.1214,  centerLong:106.7748,  topLeftLat:-6.0600, topLeftLong:106.6900, bottomRightLat:-6.1800, bottomRightLong:106.8500, createdDate:'Feb 25, 2025', createdDateObj:new Date('2025-02-25') },
  { id:'550e8400-e29b-41d4-a716-446655440004', cityName:'Jakarta Barat',     abbreviation:'JKTB', province:'DKI Jakarta',      country:'Indonesia', centerLat:-6.1688,  centerLong:106.7503,  topLeftLat:-6.0900, topLeftLong:106.6700, bottomRightLat:-6.2400, bottomRightLong:106.8300, createdDate:'Feb 24, 2025', createdDateObj:new Date('2025-02-24') },
  { id:'550e8400-e29b-41d4-a716-446655440005', cityName:'Jakarta Timur',     abbreviation:'JKTT', province:'DKI Jakarta',      country:'Indonesia', centerLat:-6.2250,  centerLong:106.9004,  topLeftLat:-6.1400, topLeftLong:106.8100, bottomRightLat:-6.3100, bottomRightLong:107.0000, createdDate:'Feb 24, 2025', createdDateObj:new Date('2025-02-24') },
  { id:'550e8400-e29b-41d4-a716-446655440006', cityName:'Bandung',           abbreviation:'BDG',  province:'Jawa Barat',       country:'Indonesia', centerLat:-6.9175,  centerLong:107.6191,  topLeftLat:-6.8300, topLeftLong:107.5400, bottomRightLat:-7.0100, bottomRightLong:107.7100, createdDate:'Feb 23, 2025', createdDateObj:new Date('2025-02-23') },
  { id:'550e8400-e29b-41d4-a716-446655440007', cityName:'Bekasi',            abbreviation:'BKS',  province:'Jawa Barat',       country:'Indonesia', centerLat:-6.2383,  centerLong:106.9756,  topLeftLat:-6.1700, topLeftLong:106.9100, bottomRightLat:-6.3300, bottomRightLong:107.0500, createdDate:'Feb 23, 2025', createdDateObj:new Date('2025-02-23') },
  { id:'550e8400-e29b-41d4-a716-446655440008', cityName:'Depok',             abbreviation:'DPK',  province:'Jawa Barat',       country:'Indonesia', centerLat:-6.4025,  centerLong:106.7942,  topLeftLat:-6.3400, topLeftLong:106.7300, bottomRightLat:-6.4700, bottomRightLong:106.8800, createdDate:'Feb 22, 2025', createdDateObj:new Date('2025-02-22') },
  { id:'550e8400-e29b-41d4-a716-446655440009', cityName:'Bogor',             abbreviation:'BGR',  province:'Jawa Barat',       country:'Indonesia', centerLat:-6.5971,  centerLong:106.8060,  topLeftLat:-6.5400, topLeftLong:106.7400, bottomRightLat:-6.6800, bottomRightLong:106.8700, createdDate:'Feb 22, 2025', createdDateObj:new Date('2025-02-22') },
  { id:'550e8400-e29b-41d4-a716-446655440010', cityName:'Tangerang',         abbreviation:'TNG',  province:'Banten',           country:'Indonesia', centerLat:-6.1783,  centerLong:106.6319,  topLeftLat:-6.1000, topLeftLong:106.5600, bottomRightLat:-6.2600, bottomRightLong:106.7200, createdDate:'Feb 21, 2025', createdDateObj:new Date('2025-02-21') },
  { id:'550e8400-e29b-41d4-a716-446655440011', cityName:'Tangerang Selatan', abbreviation:'TNGS', province:'Banten',           country:'Indonesia', centerLat:-6.2877,  centerLong:106.7171,  topLeftLat:-6.2300, topLeftLong:106.6500, bottomRightLat:-6.3700, bottomRightLong:106.7900, createdDate:'Feb 21, 2025', createdDateObj:new Date('2025-02-21') },
  { id:'550e8400-e29b-41d4-a716-446655440012', cityName:'Surabaya',          abbreviation:'SBY',  province:'Jawa Timur',       country:'Indonesia', centerLat:-7.2575,  centerLong:112.7521,  topLeftLat:-7.1700, topLeftLong:112.6700, bottomRightLat:-7.3600, bottomRightLong:112.8500, createdDate:'Feb 20, 2025', createdDateObj:new Date('2025-02-20') },
  { id:'550e8400-e29b-41d4-a716-446655440013', cityName:'Semarang',          abbreviation:'SMG',  province:'Jawa Tengah',      country:'Indonesia', centerLat:-6.9932,  centerLong:110.4203,  topLeftLat:-6.9100, topLeftLong:110.3100, bottomRightLat:-7.0800, bottomRightLong:110.5100, createdDate:'Feb 19, 2025', createdDateObj:new Date('2025-02-19') },
  { id:'550e8400-e29b-41d4-a716-446655440014', cityName:'Medan',             abbreviation:'MDN',  province:'Sumatera Utara',   country:'Indonesia', centerLat:3.5952,   centerLong:98.6722,   topLeftLat:3.6700,  topLeftLong:98.5900,  bottomRightLat:3.5200,  bottomRightLong:98.7600,  createdDate:'Feb 18, 2025', createdDateObj:new Date('2025-02-18') },
  { id:'550e8400-e29b-41d4-a716-446655440015', cityName:'Yogyakarta',        abbreviation:'YOG',  province:'DI Yogyakarta',    country:'Indonesia', centerLat:-7.7956,  centerLong:110.3695,  topLeftLat:-7.7400, topLeftLong:110.3100, bottomRightLat:-7.8600, bottomRightLong:110.4300, createdDate:'Feb 17, 2025', createdDateObj:new Date('2025-02-17') },
  { id:'550e8400-e29b-41d4-a716-446655440016', cityName:'Denpasar',          abbreviation:'DPS',  province:'Bali',             country:'Indonesia', centerLat:-8.6705,  centerLong:115.2126,  topLeftLat:-8.6100, topLeftLong:115.1400, bottomRightLat:-8.7300, bottomRightLong:115.2900, createdDate:'Feb 16, 2025', createdDateObj:new Date('2025-02-16') },
  { id:'550e8400-e29b-41d4-a716-446655440017', cityName:'Makassar',          abbreviation:'MKS',  province:'Sulawesi Selatan', country:'Indonesia', centerLat:-5.1477,  centerLong:119.4327,  topLeftLat:-5.0700, topLeftLong:119.3500, bottomRightLat:-5.2200, bottomRightLong:119.5200, createdDate:'Feb 15, 2025', createdDateObj:new Date('2025-02-15') },
  { id:'550e8400-e29b-41d4-a716-446655440018', cityName:'Palembang',         abbreviation:'PLB',  province:'Sumatera Selatan', country:'Indonesia', centerLat:-2.9761,  centerLong:104.7754,  topLeftLat:-2.9100, topLeftLong:104.7100, bottomRightLat:-3.0500, bottomRightLong:104.8500, createdDate:'Feb 14, 2025', createdDateObj:new Date('2025-02-14') },
];

const ALL_COLS = [
  { key: 'uuid',         label: 'UUID'          },
  { key: 'cityName',     label: 'City Name'     },
  { key: 'abbreviation', label: 'Abbr'          },
  { key: 'province',     label: 'Province'      },
  { key: 'country',      label: 'Country'       },
  { key: 'center',       label: 'Center'        },
  { key: 'topLeft',      label: 'Top-Left'      },
  { key: 'bottomRight',  label: 'Bottom-Right'  },
  { key: 'createdDate',  label: 'Created'       },
] as const;
type ColKey = typeof ALL_COLS[number]['key'];

const DEFAULT_VISIBLE_COLS = new Set<ColKey>([
  'cityName', 'abbreviation', 'province', 'country', 'center', 'topLeft', 'bottomRight',
]);

// ── Helpers ────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
}

function usePortalMenu() {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current  && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', outside);
    document.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('scroll', scroll, true); };
  }, [open]);

  const toggle = (rightAlign = true, menuWidth = 180) => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: rightAlign ? r.right - menuWidth : r.left });
    }
    setOpen(v => !v);
  };
  return { open, setOpen, pos, btnRef, menuRef, toggle };
}


function fmtCoord(lat: number | null, long: number | null): string | null {
  if (lat === null || long === null) return null;
  return `${lat.toFixed(4)}, ${long.toFixed(4)}`;
}

function parseCoord(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  return isNaN(n) ? null : n;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)',
  color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
  fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700,
  color: 'var(--color-foreground)', display: 'block', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

const helperStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-geist)', fontSize: '12px',
  color: 'var(--color-muted-foreground)', marginTop: 4,
};

// ── CoordCell ──────────────────────────────────────────────────────────────────

function CoordCell({ lat, long, onCopy }: { lat: number | null; long: number | null; onCopy: (text: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const text = fmtCoord(lat, long);

  if (!text) return <span style={{ color: 'var(--color-muted-foreground)' }}>—</span>;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).catch(() => {});
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-foreground)' }}>{text}</span>
      {hovered && (
        <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', color: copied ? '#10B981' : 'var(--color-muted-foreground)', cursor: 'pointer' }}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
      )}
    </div>
  );
}

// ── UUIDCell ───────────────────────────────────────────────────────────────────

function UUIDCell({ id, onCopy }: { id: string; onCopy: (text: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const short = id.slice(0, 8) + '...';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).catch(() => {});
    onCopy(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={id}
    >
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{short}</span>
      {hovered && (
        <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', color: copied ? '#10B981' : 'var(--color-muted-foreground)', cursor: 'pointer' }}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
      )}
    </div>
  );
}

// ── MultiSelectFilter ──────────────────────────────────────────────────────────

function MultiSelectFilter({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();
  const hasSel = selected.length > 0;
  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={() => toggle(true, 240)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--radius)', border: `1px solid ${hasSel ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: hasSel ? 'rgba(124,58,237,0.06)' : 'var(--color-card)', color: hasSel ? '#7C3AED' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        <span>{label}</span>
        {hasSel && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700 }}>{selected.length}</span>}
        <ChevronDown size={13} />
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, minWidth: 240, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            {selected.length > 0 && <button onClick={() => { onChange([]); setOpen(false); }} style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#7C3AED', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>}
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {options.map(opt => {
              const isSel = selected.includes(opt);
              return (
                <button key={opt} onClick={() => onChange(isSel ? selected.filter(s => s !== opt) : [...selected, opt])}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', textAlign: 'left', backgroundColor: isSel ? 'rgba(124,58,237,0.06)' : 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: isSel ? 'none' : '1.5px solid var(--color-border)', backgroundColor: isSel ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSel && <Check size={10} color="white" />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── ProvinceCombobox ───────────────────────────────────────────────────────────

function ProvinceCombobox({ value, onSelect, error }: { value: string; onSelect: (v: string) => void; error?: string }) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = INDONESIAN_PROVINCES.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 40); setActiveIdx(0); }
    else setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          btnRef.current  && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', handle);
    document.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('scroll', scroll, true); };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[activeIdx]) { onSelect(filtered[activeIdx]); setOpen(false); } }
    if (e.key === 'Escape')    { setOpen(false); }
  };

  return (
    <div>
      <button ref={btnRef} type="button" onClick={handleOpen}
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', borderColor: error ? '#EF4444' : 'var(--color-border)', color: value ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}
      >
        <span>{value || 'Select province...'}</span>
        <ChevronDown size={14} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={dropRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 240), zIndex: 9999, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
              <input ref={inputRef} value={search} onChange={e => { setSearch(e.target.value); setActiveIdx(0); }} onKeyDown={handleKeyDown} placeholder="Search province..." style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>No provinces found</div>
              : filtered.map((p, i) => (
                <button key={p} onClick={() => { onSelect(p); setOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', textAlign: 'left', backgroundColor: i === activeIdx ? 'rgba(124,58,237,0.08)' : 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}
                >
                  {p === value && <Check size={13} style={{ color: '#7C3AED', flexShrink: 0 }} />}
                  <span style={{ flex: 1 }}>{p}</span>
                </button>
              ))
            }
          </div>
        </div>,
        document.body
      )}
      {error
        ? <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#EF4444', marginTop: 4 }}>{error}</div>
        : <div style={helperStyle}>Select the province for this city</div>
      }
    </div>
  );
}

// ── ColumnToggle ───────────────────────────────────────────────────────────────

function ColumnToggle({ visibleCols, onToggle }: { visibleCols: Set<ColKey>; onToggle: (k: ColKey) => void }) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();
  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={() => toggle(true, 200)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}
      >
        <Columns3 size={14} /> Columns
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 200, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Columns</span>
          </div>
          {ALL_COLS.map(col => (
            <button key={col.key} onClick={() => onToggle(col.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', textAlign: 'left', backgroundColor: 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: visibleCols.has(col.key) ? 'none' : '1.5px solid var(--color-border)', backgroundColor: visibleCols.has(col.key) ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {visibleCols.has(col.key) && <Check size={10} color="white" />}
              </div>
              {col.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── CoordInput ─────────────────────────────────────────────────────────────────

function CoordInput({ label, value, onChange, placeholder, error, unit }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; error?: string; unit: 'lat' | 'long';
}) {
  const hint = unit === 'lat' ? '(-90 to 90)' : '(-180 to 180)';
  return (
    <div style={{ flex: 1 }}>
      <label style={{ ...labelStyle, marginBottom: 4 }}>{label}</label>
      <input
        type="number" step="0.000001" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px', borderColor: error ? '#EF4444' : 'var(--color-border)' }}
      />
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: error ? '#EF4444' : 'var(--color-muted-foreground)', marginTop: 3 }}>
        {error || hint}
      </div>
    </div>
  );
}

// ── AddEditCityModal ───────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof CityFormState | 'bounds', string>>;

function AddEditCityModal({ city, allCities, onSave, onClose }: {
  city: City | null;
  allCities: City[];
  onSave: (data: Omit<City, 'id' | 'createdDate' | 'createdDateObj'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CityFormState>({
    cityName:       city?.cityName       || '',
    province:       city?.province       || '',
    abbreviation:   city?.abbreviation   || '',
    centerLat:      city?.centerLat      != null ? String(city.centerLat)      : '',
    centerLong:     city?.centerLong     != null ? String(city.centerLong)     : '',
    topLeftLat:     city?.topLeftLat     != null ? String(city.topLeftLat)     : '',
    topLeftLong:    city?.topLeftLong    != null ? String(city.topLeftLong)    : '',
    bottomRightLat:  city?.bottomRightLat  != null ? String(city.bottomRightLat)  : '',
    bottomRightLong: city?.bottomRightLong != null ? String(city.bottomRightLong) : '',
  });
  const [errors, setErrors]   = useState<FormErrors>({});
  const [saving, setSaving]   = useState(false);
  const [dupWarn, setDupWarn] = useState(false);

  const setField = (field: keyof CityFormState, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  // Auto-uppercase abbreviation
  const setAbbr = (val: string) => setField('abbreviation', val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));

  // Check duplicate on city name + province change
  useEffect(() => {
    if (!form.cityName.trim() || !form.province) { setDupWarn(false); return; }
    const dup = allCities.some(c =>
      c.cityName.toLowerCase() === form.cityName.trim().toLowerCase() &&
      c.province === form.province &&
      c.id !== city?.id
    );
    setDupWarn(dup);
  }, [form.cityName, form.province]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (form.cityName.trim().length < 2)         e.cityName = 'City name must be at least 2 characters';
    if (!form.province)                          e.province = 'Province is required';
    if (form.abbreviation && (form.abbreviation.length < 2 || form.abbreviation.length > 5))
                                                 e.abbreviation = 'Abbreviation must be 2–5 characters';
    const cLat  = parseCoord(form.centerLat);
    const cLong = parseCoord(form.centerLong);
    const tLat  = parseCoord(form.topLeftLat);
    const tLong = parseCoord(form.topLeftLong);
    const bLat  = parseCoord(form.bottomRightLat);
    const bLong = parseCoord(form.bottomRightLong);
    if (form.centerLat  && (cLat  == null || cLat  < -90  || cLat  > 90))  e.centerLat   = 'Must be -90 to 90';
    if (form.centerLong && (cLong == null || cLong < -180 || cLong > 180)) e.centerLong  = 'Must be -180 to 180';
    if (form.topLeftLat && (tLat  == null || tLat  < -90  || tLat  > 90))  e.topLeftLat  = 'Must be -90 to 90';
    if (form.topLeftLong && (tLong == null || tLong < -180 || tLong > 180)) e.topLeftLong = 'Must be -180 to 180';
    if (form.bottomRightLat  && (bLat  == null || bLat  < -90  || bLat  > 90))  e.bottomRightLat  = 'Must be -90 to 90';
    if (form.bottomRightLong && (bLong == null || bLong < -180 || bLong > 180)) e.bottomRightLong = 'Must be -180 to 180';
    // Bounding box must be all-or-nothing
    const anyBound = form.topLeftLat || form.topLeftLong || form.bottomRightLat || form.bottomRightLong;
    const allBound = form.topLeftLat && form.topLeftLong && form.bottomRightLat && form.bottomRightLong;
    if (anyBound && !allBound) e.bounds = 'All four bounding box values must be provided together';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(() => {
      onSave({
        cityName:     form.cityName.trim(),
        province:     form.province,
        abbreviation: form.abbreviation,
        country:      'Indonesia',
        centerLat:     parseCoord(form.centerLat),
        centerLong:    parseCoord(form.centerLong),
        topLeftLat:    parseCoord(form.topLeftLat),
        topLeftLong:   parseCoord(form.topLeftLong),
        bottomRightLat:  parseCoord(form.bottomRightLat),
        bottomRightLong: parseCoord(form.bottomRightLong),
      });
      setSaving(false);
    }, 400);
  };

  const sectionHeader = (title: string) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>{title}</div>
      <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 700, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>
            {city ? `Edit City: ${city.cityName}` : 'Add New City'}
          </div>
          <button onClick={onClose} style={{ padding: 8, border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* Duplicate warning */}
          {dupWarn && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#F59E0B' }}>
                A city with this name already exists in {form.province}. Duplicate entries are allowed but not recommended.
              </span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div style={{ marginBottom: 20 }}>{sectionHeader('Basic Information')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {/* City Name */}
            <div>
              <label style={labelStyle}>City Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="text" value={form.cityName} onChange={e => setField('cityName', e.target.value)} placeholder="e.g., Jakarta Selatan, Bandung, Surabaya" style={{ ...inputStyle, borderColor: errors.cityName ? '#EF4444' : 'var(--color-border)' }} />
              <div style={{ ...helperStyle, color: errors.cityName ? '#EF4444' : 'var(--color-muted-foreground)' }}>{errors.cityName || 'Official city or municipality name'}</div>
            </div>

            {/* Province */}
            <div>
              <label style={labelStyle}>Province <span style={{ color: '#EF4444' }}>*</span></label>
              <ProvinceCombobox value={form.province} onSelect={v => setField('province', v)} error={errors.province} />
            </div>

            {/* Country + Abbreviation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
              <div>
                <label style={labelStyle}>Country</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)', cursor: 'not-allowed', borderColor: 'var(--color-border)' }}>
                  <Globe size={14} style={{ flexShrink: 0 }} />
                  <span>Indonesia (ID)</span>
                </div>
                <div style={helperStyle}>Currently only Indonesia is supported</div>
              </div>
              <div style={{ width: 140 }}>
                <label style={labelStyle}>Abbreviation</label>
                <input type="text" value={form.abbreviation} onChange={e => setAbbr(e.target.value)} placeholder="e.g., JKT" maxLength={5} style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.06em', borderColor: errors.abbreviation ? '#EF4444' : 'var(--color-border)' }} />
                <div style={{ ...helperStyle, color: errors.abbreviation ? '#EF4444' : 'var(--color-muted-foreground)' }}>{errors.abbreviation || '2–5 characters'}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Center Coordinates */}
          <div style={{ marginBottom: 14 }}>{sectionHeader('Center Point Coordinates')}</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <CoordInput label="Center Latitude" value={form.centerLat} onChange={v => setField('centerLat', v)} placeholder="e.g., -6.2088" error={errors.centerLat} unit="lat" />
            <CoordInput label="Center Longitude" value={form.centerLong} onChange={v => setField('centerLong', v)} placeholder="e.g., 106.8456" error={errors.centerLong} unit="long" />
          </div>

          {/* Section 3: Bounding Box */}
          <div style={{ marginBottom: 14 }}>{sectionHeader('Bounding Box Coordinates')}</div>
          {errors.bounds && (
            <div style={{ padding: '8px 12px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#EF4444', marginBottom: 12 }}>
              {errors.bounds}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <CoordInput label="Top-Left Lat" value={form.topLeftLat} onChange={v => setField('topLeftLat', v)} placeholder="e.g., -6.1000" error={errors.topLeftLat} unit="lat" />
              <CoordInput label="Top-Left Long" value={form.topLeftLong} onChange={v => setField('topLeftLong', v)} placeholder="e.g., 106.7000" error={errors.topLeftLong} unit="long" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <CoordInput label="Bottom-Right Lat" value={form.bottomRightLat} onChange={v => setField('bottomRightLat', v)} placeholder="e.g., -6.4000" error={errors.bottomRightLat} unit="lat" />
              <CoordInput label="Bottom-Right Long" value={form.bottomRightLong} onChange={v => setField('bottomRightLong', v)} placeholder="e.g., 106.9000" error={errors.bottomRightLong} unit="long" />
            </div>
            <div style={helperStyle}>All four bounding box values must be provided together, or left empty</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1 }}>
            {saving ? 'Saving...' : (city ? 'Save Changes' : 'Save City')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ViewUUIDModal ──────────────────────────────────────────────────────────────

function ViewUUIDModal({ city, onClose }: { city: City; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(city.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>City UUID Details</div>
          <button onClick={onClose} style={{ padding: 8, border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {/* City info */}
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 4 }}>{city.cityName}</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{city.province} · {city.country}</div>
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#10B981', fontWeight: 500 }}>Active</div>
          </div>
          {/* UUID display */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>UUID</div>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-foreground)', wordBreak: 'break-all', flex: 1 }}>{city.id}</span>
              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: copied ? 'rgba(16,185,129,0.08)' : 'var(--color-card)', color: copied ? '#10B981' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── DeleteCityModal ────────────────────────────────────────────────────────────

function DeleteCityModal({ city, onConfirm, onClose }: { city: City; onConfirm: () => void; onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const handleDelete = () => {
    if (!confirmed) return;
    setDeleting(true);
    setTimeout(() => { onConfirm(); setDeleting(false); }, 400);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Delete City?</div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 4 }}>Are you sure you want to delete this city?</div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>This action cannot be undone.</div>
            </div>
          </div>
          {/* City details */}
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', marginBottom: 14 }}>
            {[
              { label: 'City Name', value: city.cityName },
              { label: 'Province',  value: city.province  },
              { label: 'UUID',      value: city.id.slice(0, 18) + '...' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 8, marginBottom: 4, fontFamily: 'var(--font-family-geist)', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-muted-foreground)', width: 86, flexShrink: 0 }}>{row.label}:</span>
                <span style={{ color: 'var(--color-foreground)', fontWeight: 500, fontFamily: row.label === 'UUID' ? 'monospace' : 'inherit' }}>{row.value}</span>
              </div>
            ))}
          </div>
          {/* Impact warning */}
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#EF4444' }}>
              This city may be referenced in existing geolocation filters. Deleting it will require those filters to be updated.
            </span>
          </div>
          {/* Confirm checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => setConfirmed(v => !v)}>
            <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: confirmed ? 'none' : '1.5px solid var(--color-border)', backgroundColor: confirmed ? '#EF4444' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              {confirmed && <Check size={11} color="white" />}
            </div>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', userSelect: 'none' }}>
              I understand this action cannot be undone and may affect existing filters
            </span>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleDelete} disabled={!confirmed || deleting} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#EF4444', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: (!confirmed || deleting) ? 'not-allowed' : 'pointer', opacity: (!confirmed || deleting) ? 0.5 : 1 }}>
            {deleting ? 'Deleting...' : 'Delete City'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function Cities() {
  const { toasts, showToast, dismiss } = useToast();

  const [cities,         setCities]         = useState<City[]>(INITIAL_CITIES);
  const [search,         setSearch]         = useState('');
  const debouncedSearch                     = useDebounce(search, 300);
  const [provinceFilter, setProvinceFilter] = useState<string[]>([]);
  const [sortCol,        setSortCol]        = useState<string>('cityName');
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('asc');
  const [page,           setPage]           = useState(1);
  const [pageSize,       setPageSize]       = useState(10);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [visibleCols,    setVisibleCols]    = useState<Set<ColKey>>(DEFAULT_VISIBLE_COLS);
  const [hoveredRowId,   setHoveredRowId]   = useState<string | null>(null);
  const [highlightedId,  setHighlightedId]  = useState<string | null>(null);

  const [showModal,      setShowModal]      = useState(false);
  const [editCity,       setEditCity]       = useState<City | null>(null);
  const [uuidCity,       setUuidCity]       = useState<City | null>(null);
  const [deleteCity,     setDeleteCity]     = useState<City | null>(null);

  const allProvinces = useMemo(() => Array.from(new Set(cities.map(c => c.province))).sort(), [cities]);

  const processed = useMemo(() => {
    let data = cities;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      data = data.filter(c =>
        c.cityName.toLowerCase().includes(q) ||
        c.abbreviation.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    if (provinceFilter.length > 0) data = data.filter(c => provinceFilter.includes(c.province));

    return [...data].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortCol === 'createdDate') { va = a.createdDateObj.getTime(); vb = b.createdDateObj.getTime(); }
      else if (sortCol === 'cityName')     { va = a.cityName;     vb = b.cityName;     }
      else if (sortCol === 'abbreviation') { va = a.abbreviation; vb = b.abbreviation; }
      else if (sortCol === 'province')     { va = a.province;     vb = b.province;     }
      const diff = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [cities, debouncedSearch, provinceFilter, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageData   = processed.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const handleToggleCol = (k: ColKey) => {
    setVisibleCols(prev => {
      const n = new Set(prev);
      if (n.has(k)) { if (n.size > 1) n.delete(k); }
      else n.add(k);
      return n;
    });
  };

  const toggleSelectAll = () => {
    const allSel = pageData.every(c => selectedIds.has(c.id));
    const n = new Set(selectedIds);
    pageData.forEach(c => allSel ? n.delete(c.id) : n.add(c.id));
    setSelectedIds(n);
  };

  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const handleSave = (data: Omit<City, 'id' | 'createdDate' | 'createdDateObj'>) => {
    if (editCity) {
      setCities(cs => cs.map(c => c.id === editCity.id ? { ...c, ...data } : c));
      setHighlightedId(editCity.id);
      showToast('success', 'City Updated', `${data.cityName} has been updated successfully.`);
    } else {
      const newId = crypto.randomUUID();
      const now   = new Date();
      const newCity: City = {
        id: newId, ...data,
        createdDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdDateObj: now,
      };
      setCities(cs => [newCity, ...cs]);
      setHighlightedId(newId);
      setPage(1);
      showToast('success', 'City Created', `${data.cityName} has been added to the database.`);
    }
    setShowModal(false);
    setEditCity(null);
    setTimeout(() => setHighlightedId(null), 2200);
  };

  const handleDelete = (id: string) => {
    const c = cities.find(x => x.id === id);
    setCities(cs => cs.filter(x => x.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setDeleteCity(null);
    if (c) showToast('success', 'City Deleted', `${c.cityName} has been removed.`);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setCities(cs => cs.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    showToast('success', 'Cities Deleted', `${count} cit${count !== 1 ? 'ies' : 'y'} deleted.`);
  };

  const handleCopyCoord = (text: string) => showToast('info', 'Coordinates Copied', text);

  const clearAllFilters = () => { setProvinceFilter([]); setSearch(''); setPage(1); };
  const hasActiveFilters = provinceFilter.length > 0 || debouncedSearch.trim().length > 0;

  // ── Styles ──
  const thBase: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-family-geist)',
    fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)',
    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
    backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)',
    userSelect: 'none', position: 'sticky', top: 0, zIndex: 2,
  };
  const tdBase: React.CSSProperties = {
    padding: '12px 14px', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
    color: 'var(--color-foreground)', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle',
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ChevronsUpDown size={12} style={{ color: 'var(--color-muted-foreground)', opacity: 0.4, flexShrink: 0 }} />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} style={{ color: '#7C3AED', flexShrink: 0 }} />
      : <ArrowDown size={12} style={{ color: '#7C3AED', flexShrink: 0 }} />;
  };

  const pageNumbers: number[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pageNumbers.push(i); }
  else {
    const left = Math.max(1, safePage - 2); const right = Math.min(totalPages, safePage + 2);
    if (left > 1) pageNumbers.push(1); if (left > 2) pageNumbers.push(-1);
    for (let i = left; i <= right; i++) pageNumbers.push(i);
    if (right < totalPages - 1) pageNumbers.push(-2); if (right < totalPages) pageNumbers.push(totalPages);
  }

  return (
    <div style={{ fontFamily: 'var(--font-family-geist)' }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginBottom: 6 }}>
          Master / Cities
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)', fontWeight: 800, color: 'var(--color-foreground)', lineHeight: 1.2 }}>Cities</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginTop: 4 }}>Manage city master data with geographic coordinates</div>
          </div>
          <button onClick={() => { setEditCity(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            <Plus size={15} /> Add City
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', padding: 16, marginBottom: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by city name, abbreviation, or province..."
            style={{ ...inputStyle, paddingLeft: 38, paddingRight: search ? 36 : 12 }} />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <MultiSelectFilter label="Province" options={allProvinces} selected={provinceFilter} onChange={v => { setProvinceFilter(v); setPage(1); }} />

          {hasActiveFilters && (
            <button onClick={clearAllFilters} style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: '#7C3AED', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '8px 4px' }}>
              Clear All
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {provinceFilter.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {provinceFilter.map(p => (
              <div key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 10px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#7C3AED' }}>
                Province: {p}
                <button onClick={() => setProvinceFilter(prev => prev.filter(x => x !== p))} style={{ display: 'flex', alignItems: 'center', border: 'none', backgroundColor: 'transparent', color: '#7C3AED', cursor: 'pointer', padding: 2 }}><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bulk banner ── */}
      {selectedIds.size > 0 && (
        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: '#7C3AED', fontWeight: 500 }}>{selectedIds.size} cit{selectedIds.size !== 1 ? 'ies' : 'y'} selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelectedIds(new Set())} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
            <button onClick={handleBulkDelete} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)', color: '#EF4444', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={12} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
            {processed.length === 0 ? 'No results' : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, processed.length)} of ${processed.length} cit${processed.length !== 1 ? 'ies' : 'y'}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: '7px 28px 7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-muted-foreground)' }} />
            </div>
            <ColumnToggle visibleCols={visibleCols} onToggle={handleToggleCol} />
          </div>
        </div>

        {/* Table body */}
        <div style={{ overflowX: 'auto' }}>
          {processed.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              {hasActiveFilters ? (
                <>
                  <Search size={40} style={{ color: 'var(--color-muted-foreground)', opacity: 0.25, display: 'block', margin: '0 auto 14px' }} />
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 6 }}>No cities found</div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: 16 }}>Try adjusting your search or filters</div>
                  <button onClick={clearAllFilters} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid #7C3AED', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>Clear Search</button>
                </>
              ) : (
                <>
                  <Building2 size={40} style={{ color: 'var(--color-muted-foreground)', opacity: 0.25, display: 'block', margin: '0 auto 14px' }} />
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 6 }}>No cities in database yet</div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: 16 }}>Add your first city to start building your location database</div>
                  <button onClick={() => { setEditCity(null); setShowModal(true); }} style={{ padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Add City
                  </button>
                </>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thBase, width: 48, padding: '10px 12px' }}>
                    <div onClick={toggleSelectAll} style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer', border: (pageData.every(c => selectedIds.has(c.id)) && pageData.length > 0) ? 'none' : '1.5px solid var(--color-border)', backgroundColor: (pageData.every(c => selectedIds.has(c.id)) && pageData.length > 0) ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pageData.every(c => selectedIds.has(c.id)) && pageData.length > 0 && <Check size={10} color="white" />}
                    </div>
                  </th>
                  {visibleCols.has('uuid')         && <th style={{ ...thBase, cursor: 'pointer' }} onClick={() => handleSort('uuid')}><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>UUID <SortIcon col="uuid" /></div></th>}
                  {visibleCols.has('cityName')     && <th style={{ ...thBase, cursor: 'pointer' }} onClick={() => handleSort('cityName')}><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>City Name <SortIcon col="cityName" /></div></th>}
                  {visibleCols.has('abbreviation') && <th style={{ ...thBase, cursor: 'pointer' }} onClick={() => handleSort('abbreviation')}><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Abbr <SortIcon col="abbreviation" /></div></th>}
                  {visibleCols.has('province')     && <th style={{ ...thBase, cursor: 'pointer' }} onClick={() => handleSort('province')}><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Province <SortIcon col="province" /></div></th>}
                  {visibleCols.has('country')      && <th style={thBase}>Country</th>}
                  {visibleCols.has('center')       && <th style={thBase}>Center</th>}
                  {visibleCols.has('topLeft')      && <th style={thBase}>Top-Left</th>}
                  {visibleCols.has('bottomRight')  && <th style={thBase}>Bottom-Right</th>}
                  {visibleCols.has('createdDate')  && <th style={{ ...thBase, cursor: 'pointer' }} onClick={() => handleSort('createdDate')}><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Created <SortIcon col="createdDate" /></div></th>}
                  <th style={{ ...thBase, minWidth: 170 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((city, rowIdx) => {
                  const isSel       = selectedIds.has(city.id);
                  const isHighlight = highlightedId === city.id;
                  const isHovered   = hoveredRowId === city.id;
                  const baseBg = rowIdx % 2 === 0 ? 'var(--color-card)' : 'var(--color-secondary)';
                  const rowBg  = isHighlight ? 'rgba(124,58,237,0.07)' : isSel ? 'rgba(124,58,237,0.04)' : isHovered ? 'rgba(124,58,237,0.03)' : baseBg;

                  return (
                    <tr
                      key={city.id}
                      style={{ backgroundColor: rowBg, transition: 'background-color 0.15s', cursor: 'pointer' }}
                      onClick={() => { setEditCity(city); setShowModal(true); }}
                      onMouseEnter={() => setHoveredRowId(city.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td style={{ ...tdBase, width: 48, padding: '12px 12px' }} onClick={e => { e.stopPropagation(); toggleSelect(city.id); }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer', border: isSel ? 'none' : '1.5px solid var(--color-border)', backgroundColor: isSel ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSel && <Check size={10} color="white" />}
                        </div>
                      </td>

                      {visibleCols.has('uuid') && (
                        <td style={tdBase} onClick={e => { e.stopPropagation(); setUuidCity(city); }}>
                          <UUIDCell id={city.id} onCopy={() => showToast('info', 'UUID Copied', city.id)} />
                        </td>
                      )}

                      {visibleCols.has('cityName') && (
                        <td style={tdBase}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <MapPin size={13} style={{ color: '#7C3AED', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={city.cityName}>{city.cityName}</span>
                          </div>
                        </td>
                      )}

                      {visibleCols.has('abbreviation') && (
                        <td style={tdBase}>
                          {city.abbreviation
                            ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--color-foreground)', letterSpacing: '0.06em' }}>{city.abbreviation}</span>
                            : <span style={{ color: 'var(--color-muted-foreground)' }}>—</span>}
                        </td>
                      )}

                      {visibleCols.has('province') && (
                        <td style={tdBase}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
                            {city.province}
                          </span>
                        </td>
                      )}

                      {visibleCols.has('country') && (
                        <td style={tdBase}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Globe size={13} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--color-foreground)' }}>{city.country}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>ID</span>
                          </div>
                        </td>
                      )}

                      {visibleCols.has('center') && (
                        <td style={tdBase} onClick={e => e.stopPropagation()}>
                          <CoordCell lat={city.centerLat} long={city.centerLong} onCopy={handleCopyCoord} />
                        </td>
                      )}

                      {visibleCols.has('topLeft') && (
                        <td style={tdBase} onClick={e => e.stopPropagation()}>
                          <CoordCell lat={city.topLeftLat} long={city.topLeftLong} onCopy={handleCopyCoord} />
                        </td>
                      )}

                      {visibleCols.has('bottomRight') && (
                        <td style={tdBase} onClick={e => e.stopPropagation()}>
                          <CoordCell lat={city.bottomRightLat} long={city.bottomRightLong} onCopy={handleCopyCoord} />
                        </td>
                      )}

                      {visibleCols.has('createdDate') && (
                        <td style={tdBase}>
                          <span style={{ color: 'var(--color-muted-foreground)', fontSize: '13px' }}>{city.createdDate}</span>
                        </td>
                      )}

                      {/* Inline action buttons */}
                      <td style={{ ...tdBase, minWidth: 140 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: isHovered || isSel ? 1 : 0, transition: 'opacity 0.15s' }}>
                          <button onClick={() => { setEditCity(city); setShowModal(true); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer' }}>
                            <Edit size={12} /> Edit
                          </button>
                          <button onClick={() => setUuidCity(city)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer' }}>
                            <Eye size={12} /> UUID
                          </button>
                          <button onClick={() => setDeleteCity(city)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent', color: '#EF4444', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {processed.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>Page {safePage} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button disabled={safePage <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((p, i) => p < 0
                ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--color-muted-foreground)', fontSize: '13px' }}>...</span>
                : <button key={p} onClick={() => setPage(p)} style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: safePage === p ? '#7C3AED' : 'var(--color-card)', color: safePage === p ? 'white' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
              )}
              <button disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <AddEditCityModal city={editCity} allCities={cities} onSave={handleSave} onClose={() => { setShowModal(false); setEditCity(null); }} />
      )}
      {uuidCity && (
        <ViewUUIDModal city={uuidCity} onClose={() => setUuidCity(null)} />
      )}
      {deleteCity && (
        <DeleteCityModal city={deleteCity} onConfirm={() => handleDelete(deleteCity.id)} onClose={() => setDeleteCity(null)} />
      )}
    </div>
  );
}
