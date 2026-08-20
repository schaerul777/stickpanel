import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  MapPin, Search, Plus, Trash2, Edit, MoreVertical,
  ChevronDown, X, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ChevronsUpDown,
  AlertTriangle, Check,
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeoFilter {
  id: string;
  cityName: string;
  district: string;
  city: string;
  province: string;
  createdDate: string;
  createdDateObj: Date;
  createdBy: string;
}

interface MasterCity {
  name: string;
  defaultDistrict: string;
  city: string;
  province: string;
}

// ── Master Data ────────────────────────────────────────────────────────────────

const MASTER_CITIES: MasterCity[] = [
  { name: 'Jakarta Selatan',   defaultDistrict: 'Kebayoran Baru',  city: 'Jakarta',           province: 'DKI Jakarta'       },
  { name: 'Jakarta Pusat',     defaultDistrict: 'Menteng',          city: 'Jakarta',           province: 'DKI Jakarta'       },
  { name: 'Jakarta Utara',     defaultDistrict: 'Penjaringan',      city: 'Jakarta',           province: 'DKI Jakarta'       },
  { name: 'Jakarta Barat',     defaultDistrict: 'Cengkareng',       city: 'Jakarta',           province: 'DKI Jakarta'       },
  { name: 'Jakarta Timur',     defaultDistrict: 'Jatinegara',       city: 'Jakarta',           province: 'DKI Jakarta'       },
  { name: 'Bandung',           defaultDistrict: 'Dago',              city: 'Bandung',           province: 'Jawa Barat'        },
  { name: 'Bekasi',            defaultDistrict: 'Bekasi Utara',     city: 'Bekasi',            province: 'Jawa Barat'        },
  { name: 'Depok',             defaultDistrict: 'Beji',              city: 'Depok',             province: 'Jawa Barat'        },
  { name: 'Bogor',             defaultDistrict: 'Bogor Tengah',     city: 'Bogor',             province: 'Jawa Barat'        },
  { name: 'Tangerang',         defaultDistrict: 'Benda',             city: 'Tangerang',         province: 'Banten'            },
  { name: 'Tangerang Selatan', defaultDistrict: 'Serpong',           city: 'Tangerang Selatan', province: 'Banten'            },
  { name: 'Surabaya',          defaultDistrict: 'Gubeng',            city: 'Surabaya',          province: 'Jawa Timur'        },
  { name: 'Semarang',          defaultDistrict: 'Simpang Lima',     city: 'Semarang',          province: 'Jawa Tengah'       },
  { name: 'Medan',             defaultDistrict: 'Medan Baru',       city: 'Medan',             province: 'Sumatera Utara'    },
  { name: 'Yogyakarta',        defaultDistrict: 'Malioboro',         city: 'Yogyakarta',        province: 'DI Yogyakarta'     },
  { name: 'Denpasar',          defaultDistrict: 'Sanur',             city: 'Denpasar',          province: 'Bali'              },
  { name: 'Makassar',          defaultDistrict: 'Panakkukang',       city: 'Makassar',          province: 'Sulawesi Selatan'  },
  { name: 'Palembang',         defaultDistrict: 'Ilir Barat',       city: 'Palembang',         province: 'Sumatera Selatan'  },
];

const INITIAL_FILTERS: GeoFilter[] = [
  { id:'GEO-001', cityName:'Jakarta Selatan',   district:'Kebayoran Baru',  city:'Jakarta',           province:'DKI Jakarta',      createdDate:'Feb 25, 2025', createdDateObj:new Date('2025-02-25'), createdBy:'Ahmad'  },
  { id:'GEO-002', cityName:'Jakarta Pusat',     district:'Menteng',          city:'Jakarta',           province:'DKI Jakarta',      createdDate:'Feb 25, 2025', createdDateObj:new Date('2025-02-25'), createdBy:'Ahmad'  },
  { id:'GEO-003', cityName:'Bandung',           district:'Dago',              city:'Bandung',           province:'Jawa Barat',       createdDate:'Feb 24, 2025', createdDateObj:new Date('2025-02-24'), createdBy:'Dewi'   },
  { id:'GEO-004', cityName:'Bandung',           district:'Cihampelas',        city:'Bandung',           province:'Jawa Barat',       createdDate:'Feb 24, 2025', createdDateObj:new Date('2025-02-24'), createdBy:'Dewi'   },
  { id:'GEO-005', cityName:'Surabaya',          district:'Gubeng',            city:'Surabaya',          province:'Jawa Timur',       createdDate:'Feb 23, 2025', createdDateObj:new Date('2025-02-23'), createdBy:'Rudi'   },
  { id:'GEO-006', cityName:'Surabaya',          district:'Wonokromo',         city:'Surabaya',          province:'Jawa Timur',       createdDate:'Feb 23, 2025', createdDateObj:new Date('2025-02-23'), createdBy:'Rudi'   },
  { id:'GEO-007', cityName:'Semarang',          district:'Simpang Lima',     city:'Semarang',          province:'Jawa Tengah',      createdDate:'Feb 22, 2025', createdDateObj:new Date('2025-02-22'), createdBy:'Siti'   },
  { id:'GEO-008', cityName:'Medan',             district:'Medan Baru',       city:'Medan',             province:'Sumatera Utara',   createdDate:'Feb 21, 2025', createdDateObj:new Date('2025-02-21'), createdBy:'Ahmad'  },
  { id:'GEO-009', cityName:'Yogyakarta',        district:'Malioboro',         city:'Yogyakarta',        province:'DI Yogyakarta',    createdDate:'Feb 20, 2025', createdDateObj:new Date('2025-02-20'), createdBy:'Dewi'   },
  { id:'GEO-010', cityName:'Denpasar',          district:'Sanur',             city:'Denpasar',          province:'Bali',             createdDate:'Feb 19, 2025', createdDateObj:new Date('2025-02-19'), createdBy:'Rudi'   },
  { id:'GEO-011', cityName:'Jakarta Utara',     district:'Penjaringan',       city:'Jakarta',           province:'DKI Jakarta',      createdDate:'Feb 18, 2025', createdDateObj:new Date('2025-02-18'), createdBy:'Siti'   },
  { id:'GEO-012', cityName:'Jakarta Barat',     district:'Cengkareng',        city:'Jakarta',           province:'DKI Jakarta',      createdDate:'Feb 18, 2025', createdDateObj:new Date('2025-02-18'), createdBy:'Siti'   },
  { id:'GEO-013', cityName:'Jakarta Timur',     district:'Jatinegara',        city:'Jakarta',           province:'DKI Jakarta',      createdDate:'Feb 17, 2025', createdDateObj:new Date('2025-02-17'), createdBy:'Ahmad'  },
  { id:'GEO-014', cityName:'Bandung',           district:'Buah Batu',         city:'Bandung',           province:'Jawa Barat',       createdDate:'Feb 16, 2025', createdDateObj:new Date('2025-02-16'), createdBy:'Rudi'   },
  { id:'GEO-015', cityName:'Bekasi',            district:'Bekasi Utara',      city:'Bekasi',            province:'Jawa Barat',       createdDate:'Feb 15, 2025', createdDateObj:new Date('2025-02-15'), createdBy:'Dewi'   },
  { id:'GEO-016', cityName:'Depok',             district:'Beji',              city:'Depok',             province:'Jawa Barat',       createdDate:'Feb 15, 2025', createdDateObj:new Date('2025-02-15'), createdBy:'Dewi'   },
  { id:'GEO-017', cityName:'Tangerang',         district:'Benda',             city:'Tangerang',         province:'Banten',           createdDate:'Feb 14, 2025', createdDateObj:new Date('2025-02-14'), createdBy:'Ahmad'  },
  { id:'GEO-018', cityName:'Tangerang Selatan', district:'Serpong',           city:'Tangerang Selatan', province:'Banten',           createdDate:'Feb 14, 2025', createdDateObj:new Date('2025-02-14'), createdBy:'Ahmad'  },
  { id:'GEO-019', cityName:'Bogor',             district:'Bogor Tengah',      city:'Bogor',             province:'Jawa Barat',       createdDate:'Feb 13, 2025', createdDateObj:new Date('2025-02-13'), createdBy:'Rudi'   },
  { id:'GEO-020', cityName:'Makassar',          district:'Panakkukang',        city:'Makassar',          province:'Sulawesi Selatan', createdDate:'Feb 12, 2025', createdDateObj:new Date('2025-02-12'), createdBy:'Siti'   },
  { id:'GEO-021', cityName:'Palembang',         district:'Ilir Barat',        city:'Palembang',         province:'Sumatera Selatan', createdDate:'Feb 11, 2025', createdDateObj:new Date('2025-02-11'), createdBy:'Dewi'   },
  { id:'GEO-022', cityName:'Surabaya',          district:'Rungkut',           city:'Surabaya',          province:'Jawa Timur',       createdDate:'Feb 10, 2025', createdDateObj:new Date('2025-02-10'), createdBy:'Rudi'   },
  { id:'GEO-023', cityName:'Bandung',           district:'Antapani',          city:'Bandung',           province:'Jawa Barat',       createdDate:'Feb 9, 2025',  createdDateObj:new Date('2025-02-09'), createdBy:'Dewi'   },
  { id:'GEO-024', cityName:'Semarang',          district:'Banyumanik',        city:'Semarang',          province:'Jawa Tengah',      createdDate:'Feb 8, 2025',  createdDateObj:new Date('2025-02-08'), createdBy:'Siti'   },
  { id:'GEO-025', cityName:'Medan',             district:'Polonia',           city:'Medan',             province:'Sumatera Utara',   createdDate:'Feb 7, 2025',  createdDateObj:new Date('2025-02-07'), createdBy:'Ahmad'  },
  { id:'GEO-026', cityName:'Yogyakarta',        district:'Kotagede',          city:'Yogyakarta',        province:'DI Yogyakarta',    createdDate:'Feb 6, 2025',  createdDateObj:new Date('2025-02-06'), createdBy:'Dewi'   },
  { id:'GEO-027', cityName:'Denpasar',          district:'Kuta',              city:'Denpasar',          province:'Bali',             createdDate:'Feb 5, 2025',  createdDateObj:new Date('2025-02-05'), createdBy:'Rudi'   },
];

const ALL_COLS = [
  { key: 'id',          label: 'ID'          },
  { key: 'cityName',    label: 'City Name'   },
  { key: 'district',    label: 'District Filter' },
  { key: 'city',        label: 'City Filter'     },
  { key: 'province',    label: 'Province Filter' },
  { key: 'createdDate', label: 'Created'     },
  { key: 'createdBy',   label: 'Created By'  },
] as const;
type ColKey = typeof ALL_COLS[number]['key'];

const DEFAULT_VISIBLE_COLS = new Set<ColKey>(['cityName', 'district', 'city', 'province', 'createdDate']);

// ── Helpers ────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function usePortalMenu() {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', outside);
    document.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('scroll', scroll, true);
    };
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

// ── MultiSelectFilter ──────────────────────────────────────────────────────────

function MultiSelectFilter({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();
  const hasSelection = selected.length > 0;

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => toggle(true, 230)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 'var(--radius)',
          border: `1px solid ${hasSelection ? '#7C3AED' : 'var(--color-border)'}`,
          backgroundColor: hasSelection ? 'rgba(124,58,237,0.06)' : 'var(--color-card)',
          color: hasSelection ? '#7C3AED' : 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span>{label}</span>
        {hasSelection && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
            backgroundColor: '#7C3AED', color: 'white',
            fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700,
          }}>
            {selected.length}
          </span>
        )}
        <ChevronDown size={13} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
          minWidth: 230, backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </span>
            {selected.length > 0 && (
              <button onClick={() => { onChange([]); setOpen(false); }} style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#7C3AED', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                Clear
              </button>
            )}
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {options.map(opt => {
              const isSel = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onChange(isSel ? selected.filter(s => s !== opt) : [...selected, opt])}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', border: 'none', textAlign: 'left',
                    backgroundColor: isSel ? 'rgba(124,58,237,0.06)' : 'transparent',
                    color: 'var(--color-foreground)',
                    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: isSel ? 'none' : '1.5px solid var(--color-border)',
                    backgroundColor: isSel ? '#7C3AED' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
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

// ── CityCombobox ───────────────────────────────────────────────────────────────

function CityCombobox({ value, onSelect, error }: {
  value: string;
  onSelect: (city: MasterCity | null) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const searchRef  = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = MASTER_CITIES.find(c => c.name === value);
  const filtered = MASTER_CITIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (open) { setTimeout(() => searchRef.current?.focus(), 40); setActiveIdx(0); }
    else setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[activeIdx]) { onSelect(filtered[activeIdx]); setOpen(false); } }
    if (e.key === 'Escape')    { setOpen(false); }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {selected ? (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius)',
          border: `1px solid ${error ? '#EF4444' : 'rgba(124,58,237,0.3)'}`,
          backgroundColor: 'rgba(124,58,237,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={14} style={{ color: '#7C3AED', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>
              {selected.name}
            </span>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
              {selected.province}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(true); }}
            style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#7C3AED', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', textAlign: 'left',
            borderColor: error ? '#EF4444' : 'var(--color-border)',
            color: 'var(--color-muted-foreground)',
          }}
        >
          <span>Select city...</span>
          <ChevronDown size={14} />
        </button>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 200,
          backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', overflow: 'hidden',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search cities..."
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>
                No cities found
              </div>
            ) : filtered.map((city, i) => (
              <button
                key={city.name}
                onClick={() => { onSelect(city); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', border: 'none', textAlign: 'left',
                  backgroundColor: i === activeIdx ? 'rgba(124,58,237,0.08)' : 'transparent',
                  color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer',
                }}
              >
                <MapPin size={13} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{city.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{city.city} · {city.province}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {error
        ? <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#EF4444', marginTop: 4 }}>{error}</div>
        : <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: 4 }}>Select the city for this geolocation filter</div>
      }
    </div>
  );
}

// ── AddEditModal ───────────────────────────────────────────────────────────────

interface FormState { cityName: string; district: string; city: string; province: string; }

function AddEditModal({ filter, onSave, onClose }: {
  filter: GeoFilter | null;
  onSave: (data: Omit<GeoFilter, 'id' | 'createdDate' | 'createdDateObj' | 'createdBy'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    cityName: filter?.cityName || '',
    district: filter?.district || '',
    city:     filter?.city     || '',
    province: filter?.province || '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);

  const setField = (field: keyof FormState, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  // City Name selection only updates cityName — District, City, Province remain independent free-text
  const handleCitySelect = (city: MasterCity | null) => {
    if (city) {
      setForm(f => ({ ...f, cityName: city.name }));
      setErrors(e => ({ ...e, cityName: undefined }));
    } else {
      setForm(f => ({ ...f, cityName: '' }));
    }
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.cityName.trim())           e.cityName = 'City Name is required';
    if (form.district.trim().length < 2) e.district = 'District Filter must be at least 2 characters';
    if (form.city.trim().length < 2)     e.city     = 'City Filter must be at least 2 characters';
    if (form.province.trim().length < 3) e.province = 'Province Filter must be at least 3 characters';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(() => { onSave(form); setSaving(false); }, 400);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 600, backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>
            {filter ? `Edit Geolocation Filter: ${filter.cityName}` : 'Add New Geolocation Filter'}
          </div>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Location Information
            </div>
            <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* City Name combobox */}
            <div>
              <label style={labelStyle}>City Name <span style={{ color: '#EF4444' }}>*</span></label>
              <CityCombobox value={form.cityName} onSelect={handleCitySelect} error={errors.cityName} />
            </div>

            {/* District — independent free-text */}
            <div>
              <label style={labelStyle}>District Filter <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text" value={form.district}
                onChange={e => setField('district', e.target.value)}
                placeholder="e.g., Kebayoran Baru, Dago, Gubeng, Menteng"
                style={{ ...inputStyle, borderColor: errors.district ? '#EF4444' : 'var(--color-border)' }}
              />
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: errors.district ? '#EF4444' : 'var(--color-muted-foreground)', marginTop: 4 }}>
                {errors.district || 'Enter the district or sub-area name'}
              </div>
            </div>

            {/* City — independent free-text */}
            <div>
              <label style={labelStyle}>City Filter <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text" value={form.city}
                onChange={e => setField('city', e.target.value)}
                placeholder="e.g., Jakarta, Bandung, Surabaya"
                style={{ ...inputStyle, borderColor: errors.city ? '#EF4444' : 'var(--color-border)' }}
              />
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: errors.city ? '#EF4444' : 'var(--color-muted-foreground)', marginTop: 4 }}>
                {errors.city || 'Enter the city or municipality name'}
              </div>
            </div>

            {/* Province — independent free-text */}
            <div>
              <label style={labelStyle}>Province Filter <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text" value={form.province}
                onChange={e => setField('province', e.target.value)}
                placeholder="e.g., DKI Jakarta, Jawa Barat, Jawa Timur"
                style={{ ...inputStyle, borderColor: errors.province ? '#EF4444' : 'var(--color-border)' }}
              />
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: errors.province ? '#EF4444' : 'var(--color-muted-foreground)', marginTop: 4 }}>
                {errors.province || 'Enter the province name'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={saving}
            style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1 }}
          >
            {saving ? 'Saving...' : (filter ? 'Save Changes' : 'Save Filter')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DeleteModal ────────────────────────────────────────────────────────────────

function DeleteModal({ filter, onConfirm, onClose }: {
  filter: GeoFilter; onConfirm: () => void; onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = () => { setDeleting(true); setTimeout(() => { onConfirm(); setDeleting(false); }, 400); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Delete Geolocation Filter?</div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 4 }}>Are you sure you want to delete this geolocation filter?</div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>This action cannot be undone.</div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
            {[
              { label: 'City Name', value: filter.cityName },
              { label: 'District Filter', value: filter.district },
              { label: 'Province Filter', value: filter.province },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 8, marginBottom: 4, fontFamily: 'var(--font-family-geist)', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-muted-foreground)', width: 90, flexShrink: 0 }}>{row.label}:</span>
                <span style={{ color: 'var(--color-foreground)', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#EF4444' }}>
              Warning: Are you sure you want to remove this geolocation?
            </span>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#EF4444', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.8 : 1 }}>
            {deleting ? 'Deleting...' : 'Delete Filter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ColumnToggle ───────────────────────────────────────────────────────────────

function ColumnToggle({ visibleCols, onToggle }: { visibleCols: Set<ColKey>; onToggle: (k: ColKey) => void }) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();
  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => toggle(true, 200)}
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
            <button key={col.key} onClick={() => onToggle(col.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', textAlign: 'left', backgroundColor: 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>
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

// ── RowActionMenu ──────────────────────────────────────────────────────────────

function RowActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();
  return (
    <div>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); toggle(true, 150); }}
        style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <MoreVertical size={14} />
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 150, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <button onClick={() => { onEdit(); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer', textAlign: 'left' }}>
            <Edit size={13} /> Edit
          </button>
          <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer', textAlign: 'left' }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function GeolocationFilter() {
  const { toasts, showToast, dismiss } = useToast();

  const [filters,     setFilters]     = useState<GeoFilter[]>(INITIAL_FILTERS);
  const [search,      setSearch]      = useState('');
  const debouncedSearch               = useDebounce(search, 300);
  const [cityFilter,     setCityFilter]     = useState<string[]>([]);
  const [sortCol,     setSortCol]     = useState<ColKey>('cityName');
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('asc');
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(DEFAULT_VISIBLE_COLS);
  const [showModal,   setShowModal]   = useState(false);
  const [editFilter,  setEditFilter]  = useState<GeoFilter | null>(null);
  const [deleteFilter,setDeleteFilter]= useState<GeoFilter | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Derived
  const availableCities = useMemo(() =>
    Array.from(new Set(filters.map(f => f.city))).sort(),
    [filters]
  );

  const processed = useMemo(() => {
    let data = filters;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      data = data.filter(f =>
        f.cityName.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.province.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
    }
    if (cityFilter.length > 0)     data = data.filter(f => cityFilter.includes(f.city));
    return [...data].sort((a, b) => {
      if (sortCol === 'createdDate') {
        const diff = a.createdDateObj.getTime() - b.createdDateObj.getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      const va = String(a[sortCol]);
      const vb = String(b[sortCol]);
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filters, debouncedSearch, cityFilter, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageData   = processed.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (col: ColKey) => {
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

  const toggleSelectAll = useCallback(() => {
    const allSelected = pageData.every(f => selectedIds.has(f.id));
    const n = new Set(selectedIds);
    pageData.forEach(f => allSelected ? n.delete(f.id) : n.add(f.id));
    setSelectedIds(n);
  }, [pageData, selectedIds]);

  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const handleSave = (data: Omit<GeoFilter, 'id' | 'createdDate' | 'createdDateObj' | 'createdBy'>) => {
    if (editFilter) {
      setFilters(fs => fs.map(f => f.id === editFilter.id ? { ...f, ...data } : f));
      setHighlightedId(editFilter.id);
      showToast('success', 'Filter Updated', `${data.cityName} geolocation filter updated successfully.`);
    } else {
      const newId = `GEO-${String(filters.length + 1).padStart(3, '0')}`;
      const now = new Date();
      const newFilter: GeoFilter = {
        id: newId, ...data,
        createdDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdDateObj: now, createdBy: 'Admin',
      };
      setFilters(fs => [newFilter, ...fs]);
      setHighlightedId(newId);
      setPage(1);
      showToast('success', 'Filter Created', `${data.cityName} geolocation filter created successfully.`);
    }
    setShowModal(false);
    setEditFilter(null);
    setTimeout(() => setHighlightedId(null), 2200);
  };

  const handleDelete = (id: string) => {
    const f = filters.find(x => x.id === id);
    setFilters(fs => fs.filter(x => x.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setDeleteFilter(null);
    if (f) showToast('success', 'Filter Deleted', `${f.cityName} has been removed.`);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setFilters(fs => fs.filter(f => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    showToast('success', 'Filters Deleted', `${count} geolocation filter${count !== 1 ? 's' : ''} deleted.`);
  };

  const clearAllFilters = () => { setCityFilter([]); setSearch(''); setPage(1); };
  const hasActiveFilters = cityFilter.length > 0 || debouncedSearch.trim().length > 0;

  // ── Shared cell styles ──
  const thBase: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-family-geist)',
    fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)',
    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
    backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)',
    userSelect: 'none', position: 'sticky', top: 0, zIndex: 2,
  };
  const tdBase: React.CSSProperties = {
    padding: '14px 16px', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
    color: 'var(--color-foreground)', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle',
  };

  const SortIcon = ({ col }: { col: ColKey }) => {
    if (sortCol !== col) return <ChevronsUpDown size={12} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0, opacity: 0.4 }} />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} style={{ color: '#7C3AED', flexShrink: 0 }} />
      : <ArrowDown size={12} style={{ color: '#7C3AED', flexShrink: 0 }} />;
  };

  // ── Pagination numbers ──
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

  return (
    <div style={{ fontFamily: 'var(--font-family-geist)' }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginBottom: 6 }}>
          Master / Geolocation Filter
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)', fontWeight: 800, color: 'var(--color-foreground)', lineHeight: 1.2 }}>
              Geolocation Filter
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginTop: 4 }}>
              Manage geographic targeting filters for campaigns
            </div>
          </div>
          <button
            onClick={() => { setEditFilter(null); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            <Plus size={15} /> Add Filter
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', padding: 16, marginBottom: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by city name, district, or province..."
            style={{ ...inputStyle, paddingLeft: 38, paddingRight: search ? 36 : 12 }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <MultiSelectFilter label="City Filter" options={availableCities} selected={cityFilter} onChange={v => { setCityFilter(v); setPage(1); }} />
          {hasActiveFilters && (
            <button onClick={clearAllFilters} style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: '#7C3AED', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '8px 4px' }}>
              Clear All
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {cityFilter.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {cityFilter.map(c => (
              <div key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 10px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#7C3AED' }}>
                City Filter: {c}
                <button onClick={() => setCityFilter(prev => prev.filter(x => x !== c))} style={{ display: 'flex', alignItems: 'center', border: 'none', backgroundColor: 'transparent', color: '#7C3AED', cursor: 'pointer', padding: 2 }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bulk selection banner ── */}
      {selectedIds.size > 0 && (
        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: '#7C3AED', fontWeight: 500 }}>
            {selectedIds.size} filter{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelectedIds(new Set())} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer' }}>
              Clear
            </button>
            <button onClick={handleBulkDelete} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)', color: '#EF4444', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={12} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
            {processed.length === 0
              ? 'No results'
              : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, processed.length)} of ${processed.length} filter${processed.length !== 1 ? 's' : ''}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: '7px 28px 7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-muted-foreground)' }} />
            </div>

          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {processed.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              {hasActiveFilters ? (
                <>
                  <Search size={40} style={{ color: 'var(--color-muted-foreground)', opacity: 0.25, display: 'block', margin: '0 auto 14px' }} />
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 6 }}>No filters found</div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: 16 }}>Try adjusting your search or filters</div>
                  <button onClick={clearAllFilters} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid #7C3AED', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <MapPin size={40} style={{ color: 'var(--color-muted-foreground)', opacity: 0.25, display: 'block', margin: '0 auto 14px' }} />
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 6 }}>No geolocation filters yet</div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: 16 }}>Create your first filter to start organizing campaign locations</div>
                  <button onClick={() => { setEditFilter(null); setShowModal(true); }} style={{ padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Add Filter
                  </button>
                </>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {/* Select all checkbox */}
                  <th style={{ ...thBase, width: 48, padding: '10px 12px' }}>
                    <div
                      onClick={toggleSelectAll}
                      style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer', border: (pageData.every(f => selectedIds.has(f.id)) && pageData.length > 0) ? 'none' : '1.5px solid var(--color-border)', backgroundColor: (pageData.every(f => selectedIds.has(f.id)) && pageData.length > 0) ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {pageData.every(f => selectedIds.has(f.id)) && pageData.length > 0 && <Check size={10} color="white" />}
                    </div>
                  </th>

                  {ALL_COLS.filter(c => visibleCols.has(c.key)).map(col => (
                    <th key={col.key} style={{ ...thBase, cursor: 'pointer' }} onClick={() => handleSort(col.key)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {col.label} <SortIcon col={col.key} />
                      </div>
                    </th>
                  ))}

                  <th style={{ ...thBase, width: 56, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((filter, rowIdx) => {
                  const isSel       = selectedIds.has(filter.id);
                  const isHighlight = highlightedId === filter.id;
                  const baseBg = rowIdx % 2 === 0 ? 'var(--color-card)' : 'var(--color-secondary)';
                  const rowBg  = isHighlight ? 'rgba(124,58,237,0.07)' : isSel ? 'rgba(124,58,237,0.04)' : baseBg;

                  return (
                    <tr
                      key={filter.id}
                      style={{ backgroundColor: rowBg, transition: 'background-color 0.2s', cursor: 'pointer' }}
                      onClick={() => { setEditFilter(filter); setShowModal(true); }}
                      onMouseEnter={e => { if (!isSel && !isHighlight) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124,58,237,0.03)'; }}
                      onMouseLeave={e => { if (!isSel && !isHighlight) (e.currentTarget as HTMLElement).style.backgroundColor = rowBg; }}
                    >
                      {/* Checkbox */}
                      <td style={{ ...tdBase, width: 48, padding: '14px 12px' }} onClick={e => { e.stopPropagation(); toggleSelect(filter.id); }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer', border: isSel ? 'none' : '1.5px solid var(--color-border)', backgroundColor: isSel ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSel && <Check size={10} color="white" />}
                        </div>
                      </td>

                      {visibleCols.has('id') && (
                        <td style={tdBase}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{filter.id}</span>
                        </td>
                      )}

                      {visibleCols.has('cityName') && (
                        <td style={tdBase}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <MapPin size={13} style={{ color: '#7C3AED', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filter.cityName}>
                              {filter.cityName}
                            </span>
                          </div>
                        </td>
                      )}

                      {visibleCols.has('district') && (
                        <td style={tdBase}>
                          <span>{filter.district || '—'}</span>
                        </td>
                      )}

                      {visibleCols.has('city') && (
                        <td style={tdBase}>
                          <span>{filter.city}</span>
                        </td>
                      )}

                      {visibleCols.has('province') && (
                        <td style={tdBase}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
                            {filter.province}
                          </span>
                        </td>
                      )}

                      {visibleCols.has('createdDate') && (
                        <td style={tdBase}>
                          <span style={{ color: 'var(--color-muted-foreground)', fontSize: '13px' }}>
                            {filter.createdDate}
                          </span>
                        </td>
                      )}

                      {visibleCols.has('createdBy') && (
                        <td style={tdBase}>
                          <span style={{ color: 'var(--color-muted-foreground)', fontSize: '13px' }}>{filter.createdBy}</span>
                        </td>
                      )}

                      {/* Actions */}
                      <td style={{ ...tdBase, width: 56, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <RowActionMenu
                          onEdit={() => { setEditFilter(filter); setShowModal(true); }}
                          onDelete={() => setDeleteFilter(filter)}
                        />
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
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
              Page {safePage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((p, i) =>
                p < 0 ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-muted-foreground)', fontSize: '13px' }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: safePage === p ? '#7C3AED' : 'var(--color-card)', color: safePage === p ? 'white' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <AddEditModal
          filter={editFilter}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditFilter(null); }}
        />
      )}
      {deleteFilter && (
        <DeleteModal
          filter={deleteFilter}
          onConfirm={() => handleDelete(deleteFilter.id)}
          onClose={() => setDeleteFilter(null)}
        />
      )}
    </div>
  );
}
