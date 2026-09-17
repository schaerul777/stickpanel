import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft, Search, MapPin, Info, Plus, X, ImagePlus, Compass,
  Navigation, Trash2, Undo2, Check,
} from 'lucide-react';
import {
  MapContainer, TileLayer, Marker, Polyline, Polygon, useMap, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import { useToast, ToastContainer } from '../components/Toast';

// ─── Domain types & placeholder reference data ─────────────────────────────────
// NOTE: Category and Placement option lists below are PLACEHOLDERS — not covered
// by any reference doc yet. Flagged inline in the UI; swap for the real lists
// before shipping. Venue → Sub-venue is the real OpenOOH/IAB DOOH Venue
// Taxonomy v1.2.1 mapping (see https://docs.lynxssp.com/venue-taxonomy).

type Specification = 'Roadside' | 'Place-based' | 'Fleet-based';
type TypeVal = 'DOOH' | 'OOH';
type DirectionMethod = 'Custom Direction' | 'Cardinal Direction';
type LatLng = { lat: number; lng: number };

const SPEC_OPTIONS: { value: Specification; label: string; icon: typeof MapPin; hint: string }[] = [
  { value: 'Roadside',    label: 'Roadside',    icon: Navigation, hint: 'Fixed display facing a road or public thoroughfare' },
  { value: 'Place-based', label: 'Place-based',  icon: MapPin,     hint: 'Fixed display installed inside a venue' },
  { value: 'Fleet-based', label: 'Fleet-based',  icon: Compass,    hint: 'Display mounted on a moving vehicle' },
];

const CATEGORY_OPTIONS: Record<Specification, Partial<Record<TypeVal | 'any', string[]>>> = {
  'Roadside':    { DOOH: ['LED / Videotron', 'Digital Billboard'], OOH: ['Static Billboard', 'Neon Box', 'Wall Painting'] },
  'Place-based': { DOOH: ['Digital Poster', 'Video Wall', 'Digital Signage'], OOH: ['Static Poster', 'Standee'] },
  'Fleet-based': { any: ['Mobile LED', 'Mobile Showcase', 'Vehicle Wrap'] },
};

function getCategoryOptions(spec: Specification | '', type: TypeVal | ''): string[] {
  if (!spec) return [];
  const bySpec = CATEGORY_OPTIONS[spec];
  if (bySpec.any) return bySpec.any;
  if (!type) return [];
  return bySpec[type] ?? [];
}

const VENUE_TAXONOMY: Record<string, string[]> = {
  'Transit':          ['Airport', 'Bus', 'Taxi & Rideshare TV', 'Subway', 'Train', 'Ferry', 'Tram', 'Highway Rest Area'],
  'Retail':           ['Fueling Station', 'Convenience Store', 'Grocery', 'Liquor Store', 'Mall', 'Cannabis Dispensary', 'Pharmacy', 'Parking Garage', 'Furniture', 'Apparel', 'Automotive', 'Laundromat', 'Vape Shop', 'Mass Merchandising', 'Consumer Electronic', 'Retail Other', 'Sporting Good', 'Pet Store', 'Office Supply', 'Home Renovation'],
  'Outdoor':          ['Billboard', 'Urban Panel', 'Bus Shelter', 'Spectacular', 'Window Panel', 'Moving Billboard', 'Car Top', 'Aerial', 'EV Charging Station'],
  'Health & Beauty':  ['Gym', 'Salon', 'Spa', 'Tattoo'],
  'Point of Care':    ["Doctor's Office", 'Veterinary Office', 'Dentist Office', 'Hospital', 'Urgent Care', 'Physiotherapy'],
  'Education':        ['School', 'College and University'],
  'Office Building':  ['Office Building', 'Warehouse'],
  'Entertainment':    ['Recreational Location', 'Movie Theater', 'Sports Entertainment', 'Bar', 'Casual Dining', 'QSR', 'Hotel', 'Golf Cart', 'Night Club', 'High-End Dining', 'Casinos', 'Convention Center'],
  'Government':       ['DMV', 'Military Base', 'Post Office', 'First Responder Facility'],
  'Financial':        ['Bank'],
  'Residential':      ['Apartment Building and Condominium'],
};
const VENUE_PARENTS = Object.keys(VENUE_TAXONOMY);

// Placeholder — the taxonomy stops at Sub-venue, Placement is Lynx-specific and not yet supplied.
const PLACEMENT_OPTIONS = ['Entrance', 'Main Concourse', 'Food Court', 'Escalator Area', 'Parking Area', 'Checkout Area'];

const TIMEZONES = [
  'Asia/Jakarta (WIB, GMT+7)', 'Asia/Makassar (WITA, GMT+8)', 'Asia/Jayapura (WIT, GMT+9)', 'UTC (GMT+0)',
];
const CURRENCIES = ['IDR', 'USD', 'SGD'];
const DAYS: { key: string; label: string; weekend?: boolean }[] = [
  { key: 'Mon', label: 'Monday' }, { key: 'Tue', label: 'Tuesday' }, { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' }, { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday', weekend: true }, { key: 'Sun', label: 'Sunday', weekend: true },
];

// Demo data to exercise the inline "already taken" validation state.
const TAKEN_VENUE_IDS = ['JKL845RTL012CVX'];

interface FormState {
  name: string; sku: string;
  specification: Specification | ''; type: TypeVal | ''; category: string; lighting: string;
  resWidth: string; resHeight: string; width: string; height: string; heightFromGround: string;
  adSlot: string; adDuration: string;
  venueName: string; venue: string; subVenue: string; placement: string;
  location: LatLng | null; addressQuery: string;
  directionFacing: boolean; directionMethod: DirectionMethod;
  customDirection: LatLng | null; directionAngle: string; visibilityDistance: string;
  addressNotes: string; areaPoints: LatLng[];
  operatingDays: string[]; is247: boolean; startTime: string; endTime: string; timezone: string;
  rateCurrency: string; rateAmount: string;
  images: string[];
  allowRegularCampaign: boolean;
  cpmCurrency: string; cpmAmount: string; impressionMultiplier: string; venueId: string;
  potentialImpression: string;
}

const INITIAL_STATE: FormState = {
  name: '', sku: '',
  specification: '', type: '', category: '', lighting: '',
  resWidth: '', resHeight: '', width: '', height: '', heightFromGround: '',
  adSlot: '', adDuration: '',
  venueName: '', venue: '', subVenue: '', placement: '',
  location: null, addressQuery: '',
  directionFacing: false, directionMethod: 'Cardinal Direction',
  customDirection: null, directionAngle: '', visibilityDistance: '',
  addressNotes: '', areaPoints: [],
  operatingDays: [], is247: true, startTime: '', endTime: '', timezone: '',
  rateCurrency: 'IDR', rateAmount: '',
  images: [],
  allowRegularCampaign: true,
  cpmCurrency: 'IDR', cpmAmount: '', impressionMultiplier: '', venueId: '',
  potentialImpression: '',
};

// ─── Shared style tokens ────────────────────────────────────────────────────────

const LBL: React.CSSProperties = { display: 'block', marginBottom: '6px', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' };
const HELP: React.CSSProperties = { marginTop: '5px', fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)', lineHeight: 1.4 };
const ERR: React.CSSProperties = { marginTop: '5px', fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-family-geist)' };

function inputStyle(invalid?: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
    border: `1px solid ${invalid ? '#DC2626' : 'var(--border)'}`,
    backgroundColor: 'var(--input-background)', fontFamily: 'var(--font-family-geist)',
    fontSize: '14px', color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
}

// ─── Small field primitives ─────────────────────────────────────────────────────

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <label style={LBL}>
      {children}
      {required && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}
      {hint && (
        <span title={hint} style={{ marginLeft: '6px', display: 'inline-flex', verticalAlign: 'middle', color: 'var(--muted-foreground)', cursor: 'help' }}>
          <Info size={12} />
        </span>
      )}
    </label>
  );
}

function TextField({ value, onChange, placeholder, invalid, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={inputStyle(invalid)}
      onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
      onBlur={e => { e.currentTarget.style.borderColor = invalid ? '#DC2626' : 'var(--border)'; }}
    />
  );
}

function Textarea({ value, onChange, placeholder, invalid, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean; rows?: number;
}) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle(invalid), resize: 'vertical', fontFamily: 'var(--font-family-geist)' }}
      onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
      onBlur={e => { e.currentTarget.style.borderColor = invalid ? '#DC2626' : 'var(--border)'; }}
    />
  );
}

function NumberField({ value, onChange, unit, placeholder, invalid }: {
  value: string; onChange: (v: string) => void; unit?: string; placeholder?: string; invalid?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle(invalid), paddingRight: unit ? '72px' : undefined }}
        onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
        onBlur={e => { e.currentTarget.style.borderColor = invalid ? '#DC2626' : 'var(--border)'; }}
      />
      {unit && (
        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--muted-foreground)', pointerEvents: 'none' }}>
          {unit}
        </span>
      )}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder, invalid }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; invalid?: boolean;
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle(invalid), appearance: 'none', backgroundImage: 'none', cursor: 'pointer' }}
    >
      <option value="" disabled>{placeholder ?? 'Select…'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SegmentedControl<T extends string>({ value, onChange, options }: { value: T | ''; onChange: (v: T) => void; options: T[] }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt} type="button" onClick={() => onChange(opt)}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 'var(--radius)',
              border: `1.5px solid ${active ? '#7C3AED' : 'var(--border)'}`,
              backgroundColor: active ? 'rgba(124,58,237,0.06)' : 'var(--card)',
              color: active ? '#7C3AED' : 'var(--foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: active ? 600 : 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '42px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
        backgroundColor: checked ? '#7C3AED' : 'var(--border)', position: 'relative', flexShrink: 0,
        transition: 'background-color 0.15s', padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff',
        transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function CardSelector({ value, onChange }: { value: Specification | ''; onChange: (v: Specification) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {SPEC_OPTIONS.map(opt => {
        const active = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value} type="button" onClick={() => onChange(opt.value)} title={opt.hint}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              padding: '20px 12px', borderRadius: 'var(--radius-lg)',
              border: `1.5px solid ${active ? '#7C3AED' : 'var(--border)'}`,
              backgroundColor: active ? 'rgba(124,58,237,0.06)' : 'var(--card)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: active ? '#7C3AED' : 'var(--secondary)', color: active ? '#fff' : 'var(--muted-foreground)',
            }}>
              <Icon size={20} />
            </div>
            <span style={{
              fontFamily: 'var(--font-family-geist)', fontSize: '13px',
              fontWeight: active ? 600 : 500, color: active ? '#7C3AED' : 'var(--foreground)',
            }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CurrencyAmountField({ currency, onCurrency, amount, onAmount, suffix }: {
  currency: string; onCurrency: (v: string) => void; amount: string; onAmount: (v: string) => void; suffix?: string;
}) {
  const display = amount ? Number(amount.replace(/\D/g, '')).toLocaleString('en-US') : '';
  return (
    <div style={{ display: 'flex', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <select
        value={currency} onChange={e => onCurrency(e.target.value)}
        style={{ border: 'none', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', padding: '9px 8px', fontFamily: 'var(--font-family-geist)', fontSize: '14px', color: 'var(--foreground)', cursor: 'pointer', outline: 'none' }}
      >
        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        type="text" inputMode="numeric" value={display} placeholder="0"
        onChange={e => onAmount(e.target.value.replace(/\D/g, ''))}
        style={{ flex: 1, border: 'none', padding: '9px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '14px', color: 'var(--foreground)', outline: 'none', backgroundColor: 'var(--input-background)' }}
      />
      {suffix && (
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', color: 'var(--muted-foreground)', backgroundColor: 'var(--secondary)', borderLeft: '1px solid var(--border)' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontFamily: 'var(--font-family-geist)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>{children}</div>;
}

// ─── Map: pin/direction icons ───────────────────────────────────────────────────

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="5.5" fill="white"/>
    </svg>`,
    iconSize: [28, 38], iconAnchor: [14, 38],
  });
}
const MAIN_PIN = pinIcon('#7C3AED');
const DIRECTION_PIN = pinIcon('#F59E0B');

function bearingToPoint(from: LatLng, angleDeg: number, distanceM: number): LatLng {
  const R = 6378137;
  const rad = (angleDeg * Math.PI) / 180;
  const dLat = ((distanceM * Math.cos(rad)) / R) * (180 / Math.PI);
  const dLng = ((distanceM * Math.sin(rad)) / (R * Math.cos((from.lat * Math.PI) / 180))) * (180 / Math.PI);
  return { lat: from.lat + dLat, lng: from.lng + dLng };
}

function bearingBetween(from: LatLng, to: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function visibilityArc(from: LatLng, centerAngle: number, distanceM: number): LatLng[] {
  const points: LatLng[] = [from];
  for (let a = -20; a <= 20; a += 4) points.push(bearingToPoint(from, centerAngle + a, distanceM));
  points.push(from);
  return points;
}

function RecenterOnChange({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom() < 14 ? 15 : map.getZoom()); }, [center.lat, center.lng]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({ click(e) { onClick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

// ─── Location search (Nominatim via leaflet-geosearch) ─────────────────────────

const geoProvider = new OpenStreetMapProvider({ params: { countrycodes: 'id', addressdetails: 1 } });

function LocationSearch({ query, onQuery, onSelect }: {
  query: string; onQuery: (v: string) => void; onSelect: (p: LatLng, label: string) => void;
}) {
  const [results, setResults] = useState<{ label: string; x: number; y: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await geoProvider.search({ query });
        setResults(res.map(r => ({ label: r.label, x: r.x, y: r.y })));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="e.g. -6.1684047319828578, 106.8712307358206 or search an address"
          style={{ ...inputStyle(), paddingRight: '36px' }}
        />
        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: loading ? '#7C3AED' : 'var(--muted-foreground)', display: 'flex' }}>
          <Search size={15} />
        </span>
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 1100, top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '220px', overflowY: 'auto' }}>
          {results.map((r, i) => (
            <button
              key={i} type="button"
              onMouseDown={() => { onSelect({ lat: r.y, lng: r.x }, r.label); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--foreground)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Map View ───────────────────────────────────────────────────────────────────

const JAKARTA_CENTER: LatLng = { lat: -6.2088, lng: 106.8456 };

interface MapViewProps {
  location: LatLng | null;
  onSetLocation: (p: LatLng) => void;
  directionFacing: boolean;
  directionMethod: DirectionMethod;
  customDirection: LatLng | null;
  onSetCustomDirection: (p: LatLng) => void;
  directionAngle: string;
  visibilityDistance: string;
  showArea: boolean;
  areaPoints: LatLng[];
  onAreaPoints: (p: LatLng[]) => void;
}

function MapView({
  location, onSetLocation, directionFacing, directionMethod, customDirection, onSetCustomDirection,
  directionAngle, visibilityDistance, showArea, areaPoints, onAreaPoints,
}: MapViewProps) {
  const [pickingCustomPoint, setPickingCustomPoint] = useState(false);
  const [drawingArea, setDrawingArea] = useState(false);
  const center = location ?? JAKARTA_CENTER;
  const distance = Number(visibilityDistance) || 0;
  const angle = directionMethod === 'Cardinal Direction'
    ? Number(directionAngle) || 0
    : customDirection && location ? bearingBetween(location, customDirection) : 0;

  const handleMapClick = (p: LatLng) => {
    if (drawingArea) { onAreaPoints([...areaPoints, p]); return; }
    if (pickingCustomPoint) { onSetCustomDirection(p); setPickingCustomPoint(false); return; }
    if (!location) onSetLocation(p);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {!location && (
          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>
            Search above or click the map to drop the pin.
          </span>
        )}
        {location && (
          <button type="button" onClick={() => onSetLocation(location)} style={mapToolBtn(false)}>
            <MapPin size={12} /> Drag pin or click map to move
          </button>
        )}
        {directionFacing && directionMethod === 'Custom Direction' && (
          <button type="button" onClick={() => setPickingCustomPoint(v => !v)} style={mapToolBtn(pickingCustomPoint)}>
            <Compass size={12} /> {pickingCustomPoint ? 'Click map to set direction point…' : 'Pick direction point on map'}
          </button>
        )}
        {showArea && (
          <>
            <button type="button" onClick={() => setDrawingArea(v => !v)} style={mapToolBtn(drawingArea)}>
              <Plus size={12} /> {drawingArea ? 'Click map to add vertices…' : 'Draw coverage area'}
            </button>
            {areaPoints.length > 0 && (
              <>
                <button type="button" onClick={() => onAreaPoints(areaPoints.slice(0, -1))} style={mapToolBtn(false)}>
                  <Undo2 size={12} /> Undo point
                </button>
                <button type="button" onClick={() => onAreaPoints([])} style={mapToolBtn(false)}>
                  <Trash2 size={12} /> Clear area
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ height: '360px', width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={[center.lat, center.lng]} zoom={location ? 15 : 11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          {location && <RecenterOnChange center={location} />}

          {location && (
            <Marker
              position={[location.lat, location.lng]} icon={MAIN_PIN} draggable
              eventHandlers={{ dragend: e => { const m = e.target.getLatLng(); onSetLocation({ lat: m.lat, lng: m.lng }); } }}
            />
          )}

          {location && directionFacing && directionMethod === 'Custom Direction' && customDirection && (
            <>
              <Marker
                position={[customDirection.lat, customDirection.lng]} icon={DIRECTION_PIN} draggable
                eventHandlers={{ dragend: e => { const m = e.target.getLatLng(); onSetCustomDirection({ lat: m.lat, lng: m.lng }); } }}
              />
              <Polyline positions={[[location.lat, location.lng], [customDirection.lat, customDirection.lng]]} pathOptions={{ color: '#F59E0B', weight: 2, dashArray: '6 4' }} />
            </>
          )}

          {location && directionFacing && distance > 0 && (
            (directionMethod === 'Cardinal Direction' || (directionMethod === 'Custom Direction' && customDirection)) && (
              <Polygon
                positions={visibilityArc(location, angle, distance).map(p => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: '#7C3AED', weight: 1, fillColor: '#7C3AED', fillOpacity: 0.12 }}
              />
            )
          )}

          {showArea && areaPoints.length > 0 && (
            <Polygon
              positions={areaPoints.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: '#10B981', weight: 2, fillColor: '#10B981', fillOpacity: 0.15 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

function mapToolBtn(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: 'var(--radius-sm)',
    border: `1px solid ${active ? '#7C3AED' : 'var(--border)'}`,
    backgroundColor: active ? 'rgba(124,58,237,0.08)' : 'var(--card)',
    color: active ? '#7C3AED' : 'var(--muted-foreground)',
    fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  };
}

// ─── Image upload ───────────────────────────────────────────────────────────────

function ImageUpload({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => onChange([...images, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {images.map((src, i) => (
          <div key={i} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={src} alt={`Display ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <X size={11} />
            </button>
          </div>
        ))}
        <button
          type="button" onClick={() => inputRef.current?.click()}
          style={{ width: '84px', height: '84px', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border)', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)' }}
        >
          <ImagePlus size={20} />
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" multiple hidden onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <p style={HELP}>
        Image format .JPG, .JPEG, and .PNG with minimum size of 300 x 300 px.<br />
        (For optimal use, minimum size of 700 x 700 px.)
      </p>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export function CreateDisplay() {
  const navigate = useNavigate();
  const { toasts, showToast, dismiss } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Conditional visibility ──
  const showLighting = form.type === 'OOH';
  const showResolution = form.type === 'DOOH';
  const showHeightFromGround = form.specification !== 'Fleet-based';
  const showPlayback = form.type === 'DOOH';
  const showVenueSection = form.type === 'DOOH';
  const showPlacement = form.specification === 'Place-based';
  const showArea = form.specification === 'Fleet-based' && (form.category === 'Mobile LED' || form.category === 'Mobile Showcase');

  const categoryOptions = useMemo(() => getCategoryOptions(form.specification, form.type), [form.specification, form.type]);
  const subVenueOptions = form.venue ? VENUE_TAXONOMY[form.venue] ?? [] : [];

  // Reset dependent fields when a parent condition changes
  useEffect(() => { if (form.category && !categoryOptions.includes(form.category)) set('category', ''); }, [categoryOptions]);
  useEffect(() => { if (form.subVenue && !subVenueOptions.includes(form.subVenue)) set('subVenue', ''); }, [form.venue]);
  useEffect(() => { if (!showArea && form.areaPoints.length) set('areaPoints', []); }, [showArea]);
  useEffect(() => { if (!showPlacement && form.placement) set('placement', ''); }, [showPlacement]);

  const venueIdTaken = form.venueId.trim() !== '' && TAKEN_VENUE_IDS.includes(form.venueId.trim());

  const toggleDay = (day: string) => {
    set('operatingDays', form.operatingDays.includes(day) ? form.operatingDays.filter(d => d !== day) : [...form.operatingDays, day]);
  };
  const applyDayShortcut = (kind: 'weekdays' | 'weekend' | 'all') => {
    if (kind === 'weekdays') set('operatingDays', DAYS.filter(d => !d.weekend).map(d => d.key));
    else if (kind === 'weekend') set('operatingDays', DAYS.filter(d => d.weekend).map(d => d.key));
    else set('operatingDays', DAYS.map(d => d.key));
  };

  // ── Validation ──
  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, boolean>> = {};
    if (!form.name.trim()) e.name = true;
    if (!form.sku.trim()) e.sku = true;
    if (!form.specification) e.specification = true;
    if (!form.type) e.type = true;
    if (!form.category) e.category = true;
    if (showResolution && (!form.resWidth || !form.resHeight)) { e.resWidth = true; e.resHeight = true; }
    if (!form.width) e.width = true;
    if (!form.height) e.height = true;
    if (showHeightFromGround && !form.heightFromGround) e.heightFromGround = true;
    if (showPlayback && !form.adSlot) e.adSlot = true;
    if (showPlayback && !form.adDuration) e.adDuration = true;
    if (!form.location) e.location = true;
    if (!form.addressNotes.trim()) e.addressNotes = true;
    if (form.operatingDays.length === 0) e.operatingDays = true;
    if (!form.is247 && (!form.startTime || !form.endTime)) { e.startTime = true; e.endTime = true; }
    if (!form.timezone) e.timezone = true;
    if (!form.rateAmount) e.rateAmount = true;
    if (venueIdTaken) e.venueId = true;
    return e;
  }, [form, showResolution, showHeightFromGround, showPlayback, venueIdTaken]);

  const hasErrors = Object.keys(errors).length > 0;
  const invalid = (key: keyof FormState) => submitted && !!errors[key];

  const handleSave = () => {
    setSubmitted(true);
    if (hasErrors) {
      showToast('error', 'Missing required fields', 'Please fill out the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      showToast('success', 'Display saved', `"${form.name}" has been added to inventory.`);
      navigate('/inventory/display');
    }, 500);
  };

  const handleCancel = () => navigate('/inventory/display');

  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', maxWidth: '100%' }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleCancel}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginBottom: '10px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--muted-foreground)' }}
        >
          <ChevronLeft size={14} /> Inventory / Display / Add New
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3, textAlign: 'center' }}>
          Add New Display
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px', textAlign: 'center' }}>
          Please fill out the required fields below. The fields marked with (*) are required.
        </p>
      </div>

      {/* ── Form body ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <Section title="General Information">
          <div>
            <FieldLabel required>Name</FieldLabel>
            <TextField value={form.name} onChange={v => set('name', v)} placeholder="e.g. LED Billboard StickEarn HQ" invalid={invalid('name')} />
            {invalid('name') && <p style={ERR}>Name is required.</p>}
          </div>
          <div>
            <FieldLabel required>SKU</FieldLabel>
            <TextField value={form.sku} onChange={v => set('sku', v)} placeholder="e.g. 5635488" invalid={invalid('sku')} />
            {invalid('sku') && <p style={ERR}>SKU is required.</p>}
          </div>
        </Section>

        <Section title="Specification">
          <div>
            <FieldLabel required>Specification</FieldLabel>
            <CardSelector value={form.specification} onChange={v => set('specification', v)} />
            {invalid('specification') && <p style={ERR}>Please choose a specification.</p>}
          </div>
          <div>
            <FieldLabel required>Type</FieldLabel>
            <SegmentedControl value={form.type} onChange={v => set('type', v)} options={['DOOH', 'OOH']} />
            {invalid('type') && <p style={ERR}>Please choose a type.</p>}
          </div>
          <div>
            <FieldLabel required hint="Placeholder options — the real Category list (filtered by Specification/Type) still needs to be supplied.">Category</FieldLabel>
            <SelectField value={form.category} onChange={v => set('category', v)} options={categoryOptions} placeholder={form.specification ? (form.type || CATEGORY_OPTIONS[form.specification].any ? 'Select category' : 'Select Type first') : 'Select Specification first'} invalid={invalid('category')} />
            <p style={HELP}>Placeholder list — confirm the real Category options before shipping.</p>
            {invalid('category') && <p style={ERR}>Category is required.</p>}
          </div>
          {showLighting && (
            <div>
              <FieldLabel required>Lighting</FieldLabel>
              <SelectField value={form.lighting} onChange={v => set('lighting', v)} options={['No light', 'Front light', 'Back light']} placeholder="Select lighting" />
            </div>
          )}
        </Section>

        <Section title="Dimension">
          {showResolution && (
            <div>
              <FieldLabel required>Resolution</FieldLabel>
              <Row>
                <NumberField value={form.resWidth} onChange={v => set('resWidth', v)} unit="pixel(s)" placeholder="Width" invalid={invalid('resWidth')} />
                <NumberField value={form.resHeight} onChange={v => set('resHeight', v)} unit="pixel(s)" placeholder="Height" invalid={invalid('resHeight')} />
              </Row>
              {(invalid('resWidth') || invalid('resHeight')) && <p style={ERR}>Resolution width and height are required.</p>}
            </div>
          )}
          <Row>
            <div>
              <FieldLabel required>Width</FieldLabel>
              <NumberField value={form.width} onChange={v => set('width', v)} unit="meter(s)" invalid={invalid('width')} />
            </div>
            <div>
              <FieldLabel required>Height</FieldLabel>
              <NumberField value={form.height} onChange={v => set('height', v)} unit="meter(s)" invalid={invalid('height')} />
            </div>
            {showHeightFromGround && (
              <div>
                <FieldLabel required>Height from Ground</FieldLabel>
                <NumberField value={form.heightFromGround} onChange={v => set('heightFromGround', v)} unit="meter(s)" invalid={invalid('heightFromGround')} />
              </div>
            )}
          </Row>
        </Section>

        {showPlayback && (
          <Section title="Playback Configuration">
            <Row>
              <div>
                <FieldLabel required>Ad Slot in a Single Loop</FieldLabel>
                <NumberField value={form.adSlot} onChange={v => set('adSlot', v)} unit="slot(s)" invalid={invalid('adSlot')} />
              </div>
              <div>
                <FieldLabel required>Ad Duration per Slot</FieldLabel>
                <NumberField value={form.adDuration} onChange={v => set('adDuration', v)} unit="second(s)" invalid={invalid('adDuration')} />
              </div>
            </Row>
          </Section>
        )}

        {showVenueSection && (
          <Section title="Venue">
            <div>
              <FieldLabel>Venue Name</FieldLabel>
              <TextField value={form.venueName} onChange={v => set('venueName', v)} placeholder="e.g. Mall Kelapa Gading" />
            </div>
            <Row>
              <div>
                <FieldLabel>Venue</FieldLabel>
                <SelectField value={form.venue} onChange={v => set('venue', v)} options={VENUE_PARENTS} placeholder="Select venue" />
              </div>
              <div>
                <FieldLabel>Sub-venue</FieldLabel>
                <SelectField value={form.subVenue} onChange={v => set('subVenue', v)} options={subVenueOptions} placeholder={form.venue ? 'Select sub-venue' : 'Select Venue first'} />
              </div>
            </Row>
            {showPlacement && (
              <div>
                <FieldLabel hint="Placeholder options — the taxonomy stops at Sub-venue; Placement is a Lynx-specific list not yet supplied.">Placement</FieldLabel>
                <SelectField value={form.placement} onChange={v => set('placement', v)} options={PLACEMENT_OPTIONS} placeholder="Select placement" />
                <p style={HELP}>Placeholder list — confirm the real Placement options before shipping.</p>
              </div>
            )}
          </Section>
        )}

        <Section title="Location">
          <div>
            <FieldLabel required>Location (Latitude &amp; Longitude)</FieldLabel>
            <LocationSearch
              query={form.addressQuery}
              onQuery={v => set('addressQuery', v)}
              onSelect={(p, label) => { set('location', p); set('addressQuery', label); }}
            />
            {invalid('location') && <p style={ERR}>Please set a location.</p>}
          </div>

          <MapView
            location={form.location}
            onSetLocation={p => set('location', p)}
            directionFacing={form.directionFacing}
            directionMethod={form.directionMethod}
            customDirection={form.customDirection}
            onSetCustomDirection={p => set('customDirection', p)}
            directionAngle={form.directionAngle}
            visibilityDistance={form.visibilityDistance}
            showArea={showArea}
            areaPoints={form.areaPoints}
            onAreaPoints={p => set('areaPoints', p)}
          />
          {showArea && (
            <p style={HELP}>{form.areaPoints.length >= 3 ? `Coverage area drawn with ${form.areaPoints.length} points.` : 'Draw the mobile display’s coverage/service area on the map above (minimum 3 points).'}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>Direction Facing</div>
              <div style={HELP}>Specify the direction the billboard is facing to improve location and measurement accuracy.</div>
            </div>
            <ToggleSwitch checked={form.directionFacing} onChange={v => set('directionFacing', v)} />
          </div>

          {form.directionFacing && (
            <>
              <div>
                <FieldLabel>Direction Facing Method</FieldLabel>
                <SegmentedControl value={form.directionMethod} onChange={v => set('directionMethod', v)} options={['Custom Direction', 'Cardinal Direction']} />
              </div>
              {form.directionMethod === 'Custom Direction' && (
                <p style={HELP}>
                  {form.customDirection
                    ? `Custom direction point set at ${form.customDirection.lat.toFixed(5)}, ${form.customDirection.lng.toFixed(5)}.`
                    : 'Use "Pick direction point on map" above to set the second coordinate — the bearing from Location to this point defines the facing direction.'}
                </p>
              )}
              {form.directionMethod === 'Cardinal Direction' && (
                <div>
                  <FieldLabel>Direction Angle</FieldLabel>
                  <NumberField value={form.directionAngle} onChange={v => set('directionAngle', v)} unit="deg (0-360)" />
                </div>
              )}
              <div>
                <FieldLabel>Visibility Distance</FieldLabel>
                <NumberField value={form.visibilityDistance} onChange={v => set('visibilityDistance', v)} unit="m" />
              </div>
            </>
          )}

          <div>
            <FieldLabel required>Address Notes</FieldLabel>
            <Textarea value={form.addressNotes} onChange={v => set('addressNotes', v)} placeholder="Additional notes to help locate this display" invalid={invalid('addressNotes')} />
            {invalid('addressNotes') && <p style={ERR}>Address notes are required.</p>}
          </div>
        </Section>

        <Section title="Schedule">
          <div>
            <FieldLabel required>Operating Days</FieldLabel>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button type="button" onClick={() => applyDayShortcut('weekdays')} style={mapToolBtn(false)}>Weekdays</button>
              <button type="button" onClick={() => applyDayShortcut('weekend')} style={mapToolBtn(false)}>Weekend</button>
              <button type="button" onClick={() => applyDayShortcut('all')} style={mapToolBtn(false)}>All</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {DAYS.map(d => {
                const checked = form.operatingDays.includes(d.key);
                return (
                  <label key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--foreground)' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleDay(d.key)} style={{ width: '16px', height: '16px', accentColor: '#7C3AED', cursor: 'pointer' }} />
                    {d.label}
                  </label>
                );
              })}
            </div>
            {invalid('operatingDays') && <p style={ERR}>Select at least one operating day.</p>}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FieldLabel required>Operating Time</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>24/7</span>
                <ToggleSwitch checked={form.is247} onChange={v => set('is247', v)} />
              </div>
            </div>
            {!form.is247 && (
              <Row>
                <div>
                  <FieldLabel>Start at</FieldLabel>
                  <TextField type="time" value={form.startTime} onChange={v => set('startTime', v)} invalid={invalid('startTime')} />
                </div>
                <div>
                  <FieldLabel>End at</FieldLabel>
                  <TextField type="time" value={form.endTime} onChange={v => set('endTime', v)} invalid={invalid('endTime')} />
                </div>
              </Row>
            )}
            {(invalid('startTime') || invalid('endTime')) && <p style={ERR}>Start and end time are required when not 24/7.</p>}
          </div>

          <div>
            <FieldLabel required>Timezone</FieldLabel>
            <SelectField value={form.timezone} onChange={v => set('timezone', v)} options={TIMEZONES} placeholder="Select timezone" invalid={invalid('timezone')} />
            {invalid('timezone') && <p style={ERR}>Timezone is required.</p>}
          </div>
        </Section>

        <Section title="Rate">
          <div>
            <FieldLabel required>Display Rate</FieldLabel>
            <CurrencyAmountField currency={form.rateCurrency} onCurrency={v => set('rateCurrency', v)} amount={form.rateAmount} onAmount={v => set('rateAmount', v)} suffix="/ Month" />
            {invalid('rateAmount') && <p style={ERR}>Display rate is required.</p>}
          </div>
        </Section>

        <Section title="Display Images">
          <div>
            <FieldLabel>Upload Image <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span></FieldLabel>
            <ImageUpload images={form.images} onChange={v => set('images', v)} />
          </div>
        </Section>

        <Section title="Usage Settings">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>Allow Regular Campaign</div>
              <div style={HELP}>Turn on if this billboard is available for direct booking or traditional campaign scheduling.</div>
            </div>
            <ToggleSwitch checked={form.allowRegularCampaign} onChange={v => set('allowRegularCampaign', v)} />
          </div>
        </Section>

        <Section title="Programmatic">
          <div>
            <FieldLabel>CPM (Cost per Thousand Impression) <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span></FieldLabel>
            <CurrencyAmountField currency={form.cpmCurrency} onCurrency={v => set('cpmCurrency', v)} amount={form.cpmAmount} onAmount={v => set('cpmAmount', v)} />
          </div>
          <div>
            <FieldLabel>Impression Multiplier <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span></FieldLabel>
            <NumberField value={form.impressionMultiplier} onChange={v => set('impressionMultiplier', v)} />
          </div>
          <div>
            <FieldLabel>Venue ID <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span></FieldLabel>
            <TextField value={form.venueId} onChange={v => set('venueId', v)} invalid={venueIdTaken} placeholder="e.g. JKL845RTL012CVX" />
            {venueIdTaken && <p style={ERR}>The Venue ID has already been taken.</p>}
          </div>
        </Section>

        <Section title="Audiences">
          <div>
            <FieldLabel>Potential Impression per Day <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span></FieldLabel>
            <NumberField value={form.potentialImpression} onChange={v => set('potentialImpression', v)} />
          </div>
        </Section>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'sticky', bottom: '-32px', margin: '24px -32px -32px', padding: '16px 32px',
        backgroundColor: 'var(--card)', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'center', gap: '12px', zIndex: 10,
      }}>
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '720px' }}>
          <button
            onClick={handleCancel}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: '#fff', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {saving ? 'Saving…' : (<><Check size={15} /> Save</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
