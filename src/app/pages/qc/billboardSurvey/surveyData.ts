// ─── QC · Billboard Survey — types, seed data & auto-pass rules ───────────────
// Front-end prototype only: everything here is dummy data generated relative to
// the current date. The store (surveyStore.ts) plays the role of the server.

export type AdStatus = 'Filled' | 'Empty' | 'Space available' | 'No longer exists';
export type MediaType = 'Conventional' | 'LED';
export type Orientation = '' | 'Horizontal' | 'Vertical';
export type Lighting = '' | 'Frontlit' | 'Backlit' | 'No lighting';
export type AdState = 'pending' | 'approved' | 'rejected';

export const AD_STATUSES: AdStatus[] = ['Filled', 'Empty', 'Space available', 'No longer exists'];

export interface PointAttrs {
  street: string;
  mediaOwner: string;
  mediaType: MediaType | '';
  width: number | null;
  height: number | null;
  orientation: Orientation;
  lighting: Lighting;
}

export interface Billboard {
  id: string;
  code: string;
  city: string;
  subdistrict: string;
  route: string;
  lat: number;
  lng: number;
  cpOnFile: string | null;
  attrs: PointAttrs;
}

export interface AdContent {
  status: AdStatus;
  brand: string;
  subBrand: string;
  cp: string;
  adCopy: string;
}

/** What the photo actually shows — used only to render the dummy photo. */
export interface PhotoScene {
  status: AdStatus;
  brand: string;
  cp: string;
  owner: string | null;
  blurry?: boolean;
}

export interface SurveyPhoto {
  seed: number;
  takenAt: number;
  uploadedAt: number;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  scene: PhotoScene;
}

export interface ChangeEntry {
  by: string;
  at: number;
  field: string;
  from: string;
  to: string;
  reason: string;
}

export interface FieldDiff {
  field: string;
  from: string;
  to: string;
}

export interface SurveyAd {
  id: string;
  billboardId: string;
  month: string; // YYYY-MM
  photo: SurveyPhoto | null;
  surveyor: { name: string; input: AdContent };
  ocr: { cp: string | null; logoOwner: string | null; adCopy: string };
  inSample: boolean;
  state: AdState;
  result: AdContent | null;
  qc: { by: string; at: number; method: 'manual' | 'auto' } | null;
  rejectReason: string | null;
  claim: { by: string; expiresAt: number } | null;
  corrections: FieldDiff[];
  changes: ChangeEntry[];
  version: number;
}

// ─── People ───────────────────────────────────────────────────────────────────

export const ME = 'Rina Kusuma';
export const OTHER_QCS = ['Dimas Pratama', 'Sari Wulandari', 'Yoga Saputra'];
const SURVEYORS = ['Agus Salim', 'Budi Hartono', 'Fajar Nugroho', 'Lestari Ayu'];

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLAIM_MS = 15 * 60 * 1000;
export const OVERDUE_DAYS = 3;
export const MAX_DRIFT_M = 50;
export const PAGE_SIZE = 20;
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export const REJECT_REASONS = [
  'Angle miring tidak terbaca',
  'Billboard bukan komersil',
  'Double / pernah di upload',
  'Double BB Beda ID - Delete',
  'Foto Blurry - Konten Tidak Jelas',
  'Foto survey terhalang pohon atau kabel',
  'Foto survey terlalu jauh',
  'Foto survey terpotong',
  'Jenis Billboard - Delete',
  'Keliru type BB dari OOH jadi DOOH atau sebaliknya',
  'Konstruksi Non Permanen - Delete',
  'Lokasi - Delete',
  'Tidak sesuai foto default',
];

// ─── Brand taxonomy (brand → industry) ────────────────────────────────────────

export const BRANDS: { name: string; industry: string; color: string; subBrands: string[]; copy: string }[] = [
  { name: 'Telkomsel',                industry: 'Telecommunication', color: '#E60012', subBrands: ['by.U', 'Telkomsel Halo'], copy: 'Internetan makin lancar · Kuota 50GB' },
  { name: 'Indomie',                  industry: 'FMCG',              color: '#D7261E', subBrands: ['Goreng Rendang', 'Kuah Soto'],  copy: 'Indomie seleraku' },
  { name: 'Shopee',                   industry: 'E-commerce',        color: '#EE4D2D', subBrands: ['ShopeePay', 'Shopee Food'],     copy: 'Gratis ongkir se-Indonesia 11.11' },
  { name: 'Tokopedia',                industry: 'E-commerce',        color: '#03AC0E', subBrands: ['GoTo Financial'],               copy: 'Mulai aja dulu' },
  { name: 'Gojek',                    industry: 'Transportation',    color: '#00AA13', subBrands: ['GoRide', 'GoFood'],             copy: 'Pasti ada jalan' },
  { name: 'Bank BCA',                 industry: 'Banking',           color: '#0060AF', subBrands: ['BCA mobile', 'KPR BCA'],        copy: 'Senantiasa di sisi Anda' },
  { name: 'Honda',                    industry: 'Automotive',        color: '#CC0000', subBrands: ['Honda Vario', 'Honda Beat'],    copy: 'Satu hati' },
  { name: 'Wardah',                   industry: 'Beauty',            color: '#1FA39A', subBrands: ['Wardah Lightening'],            copy: 'Halal dari awal' },
  { name: 'Kopi Kenangan',            industry: 'Food & Beverage',   color: '#7A4B2A', subBrands: ['Kenangan Signature'],           copy: 'Kopi kekinian, harga temen' },
  { name: 'Traveloka',                industry: 'Travel',            color: '#1BA0E2', subBrands: ['Traveloka Xperience'],          copy: 'Liburan jadi gampang' },
  { name: 'Samsung',                  industry: 'Electronics',       color: '#1428A0', subBrands: ['Galaxy S26', 'Galaxy A57'],     copy: 'Galaxy AI is here' },
  { name: 'Aqua',                     industry: 'FMCG',              color: '#0091D5', subBrands: ['Aqua Life'],                    copy: 'Ada Aqua?' },
  { name: 'Gereja Tiberias Indonesia', industry: 'Religious organization', color: '#5B2C83', subBrands: [],                          copy: 'Ibadah raya setiap Minggu' },
];

export function industryOf(brand: string): string {
  return BRANDS.find(b => b.name === brand)?.industry ?? '';
}

export function brandColor(brand: string): string {
  return BRANDS.find(b => b.name === brand)?.color ?? '#475569';
}

const MEDIA_OWNERS = ['PT Warna Warni Media', 'PT Prima Visual', 'PT Matahari Reklame', 'CV Citra Iklan'];

// ─── Geography ────────────────────────────────────────────────────────────────

const CITIES: { city: string; code: string; lat: number; lng: number; subdistricts: string[]; streets: string[] }[] = [
  { city: 'Jakarta Selatan', code: 'JKS', lat: -6.2615, lng: 106.8106, subdistricts: ['Kebayoran Baru', 'Tebet', 'Setiabudi', 'Mampang'], streets: ['Jl. Jend. Sudirman', 'Jl. HR Rasuna Said', 'Jl. Gatot Subroto', 'Jl. Prof. Dr. Satrio', 'Jl. Kapten Tendean', 'Jl. Panglima Polim'] },
  { city: 'Jakarta Pusat',   code: 'JKP', lat: -6.1865, lng: 106.8341, subdistricts: ['Menteng', 'Tanah Abang', 'Gambir'],                 streets: ['Jl. MH Thamrin', 'Jl. Medan Merdeka Barat', 'Jl. Kebon Sirih', 'Jl. KH Mas Mansyur'] },
  { city: 'Jakarta Barat',   code: 'JKB', lat: -6.1683, lng: 106.7589, subdistricts: ['Grogol', 'Kebon Jeruk', 'Palmerah'],                 streets: ['Jl. Letjen S. Parman', 'Jl. Panjang', 'Jl. Daan Mogot', 'Jl. Kyai Tapa'] },
  { city: 'Bandung',         code: 'BDG', lat: -6.9147, lng: 107.6098, subdistricts: ['Coblong', 'Sumur Bandung', 'Cicendo'],               streets: ['Jl. Ir. H. Juanda', 'Jl. Asia Afrika', 'Jl. Pasteur', 'Jl. Merdeka'] },
  { city: 'Surabaya',        code: 'SBY', lat: -7.2575, lng: 112.7521, subdistricts: ['Genteng', 'Tegalsari', 'Wonokromo'],                 streets: ['Jl. Basuki Rahmat', 'Jl. Raya Darmo', 'Jl. Pemuda', 'Jl. A. Yani'] },
  { city: 'Tangerang',       code: 'TNG', lat: -6.1781, lng: 106.6300, subdistricts: ['Karawaci', 'Cipondoh'],                              streets: ['Jl. MH Thamrin Lippo', 'Jl. Imam Bonjol', 'Jl. Daan Mogot Tangerang'] },
];

export const CITY_NAMES = CITIES.map(c => c.city);

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthShort(key: string) {
  return MONTH_SHORT[Number(key.slice(5, 7)) - 1];
}

export function monthLabel(key: string) {
  return `${MONTH_SHORT[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
}

export function monthLong(key: string) {
  return `${MONTH_LONG[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
}

export function fmtDateTime(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fmtShortDateTime(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// The active cycle is the current month; early in a month the previous month
// is still being worked so the survey window has data in it.
const NOW = Date.now();
const nowDate = new Date(NOW);
const cycleStartDate = nowDate.getDate() < 10
  ? new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1)
  : new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);

export const CYCLE = {
  month: monthKey(cycleStartDate),
  start: cycleStartDate.getTime(),
  end: new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth() + 1, 1).getTime(),
  sampleCutoff: new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), 14).getTime(),
};

function monthOffset(offset: number) {
  return monthKey(new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth() + offset, 1));
}

function monthStart(offset: number) {
  return new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth() + offset, 1).getTime();
}

export function waitingDays(ad: SurveyAd, now: number) {
  if (!ad.photo) return 0;
  return Math.max(0, Math.floor((now - ad.photo.uploadedAt) / DAY));
}

// ─── Geo helpers ──────────────────────────────────────────────────────────────

export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function compass(deg: number) {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

function offsetPoint(lat: number, lng: number, meters: number, bearing: number) {
  const rad = (bearing * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111320;
  const dLng = (meters * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

// ─── Content helpers ──────────────────────────────────────────────────────────

export function contentSummary(c: Pick<AdContent, 'status' | 'brand'> | null) {
  if (!c) return '—';
  return c.status === 'Filled' && c.brand ? `Filled · ${c.brand}` : c.status;
}

export const CONTENT_FIELDS: { key: keyof AdContent; label: string }[] = [
  { key: 'status',   label: 'Status' },
  { key: 'brand',    label: 'Brand' },
  { key: 'subBrand', label: 'Sub-brand' },
  { key: 'cp',       label: 'CP number' },
  { key: 'adCopy',   label: 'Ad copy' },
];

export const ATTR_FIELDS: { key: keyof PointAttrs; label: string }[] = [
  { key: 'street',      label: 'Street name' },
  { key: 'mediaOwner',  label: 'Media owner' },
  { key: 'mediaType',   label: 'Media type' },
  { key: 'width',       label: 'Width (m)' },
  { key: 'height',      label: 'Height (m)' },
  { key: 'orientation', label: 'Orientation' },
  { key: 'lighting',    label: 'Lighting' },
];

function show(v: unknown) {
  return v === '' || v == null ? '(empty)' : String(v);
}

export function diffContent(a: AdContent, b: AdContent): FieldDiff[] {
  return CONTENT_FIELDS
    .filter(f => (a[f.key] ?? '') !== (b[f.key] ?? ''))
    .map(f => ({ field: f.label, from: show(a[f.key]), to: show(b[f.key]) }));
}

export function diffAttrs(a: PointAttrs, b: PointAttrs): FieldDiff[] {
  return ATTR_FIELDS
    .filter(f => (a[f.key] ?? '') !== (b[f.key] ?? ''))
    .map(f => ({ field: f.label, from: show(a[f.key]), to: show(b[f.key]) }));
}

// ─── Auto-pass rule chain ─────────────────────────────────────────────────────
// Sequential, no scoring; the first failing step routes the ad to manual review.

export interface AutoPassResult {
  eligible: boolean; // only Empty / Space available are evaluated
  pass: boolean;
  reason: string | null;
}

export function evaluateAutoPass(ad: SurveyAd, billboard: Billboard, prev: SurveyAd | null): AutoPassResult {
  const input = ad.surveyor.input;
  if (input.status !== 'Empty' && input.status !== 'Space available') {
    return { eligible: false, pass: false, reason: null };
  }
  const photo = ad.photo;
  // 1. Coordinate drift
  if (!photo || photo.lat == null || photo.lng == null) {
    return { eligible: true, pass: false, reason: 'Photo GPS not captured' };
  }
  if (distanceM(photo.lat, photo.lng, billboard.lat, billboard.lng) > MAX_DRIFT_M) {
    return { eligible: true, pass: false, reason: 'Coordinates drifted > 50 m' };
  }
  // 2. Survey period
  if (photo.takenAt < CYCLE.start || photo.takenAt >= CYCLE.end) {
    return { eligible: true, pass: false, reason: 'Photo taken outside survey period' };
  }
  // 3. Status
  if (input.status === 'Empty') {
    if (prev?.result?.status === 'Filled') {
      return { eligible: true, pass: false, reason: 'Status changed from Filled, cannot auto-pass' };
    }
    return { eligible: true, pass: true, reason: null };
  }
  // 4. CP number match → pass; otherwise fall back to
  // 5. Media-owner logo match
  const cpMatch = !!ad.ocr.cp && !!billboard.cpOnFile && ad.ocr.cp === billboard.cpOnFile;
  if (cpMatch) return { eligible: true, pass: true, reason: null };
  const logoMatch = !!ad.ocr.logoOwner && !!billboard.attrs.mediaOwner && ad.ocr.logoOwner === billboard.attrs.mediaOwner;
  if (logoMatch) return { eligible: true, pass: true, reason: null };
  const extra = !ad.ocr.cp ? ' · CP number unreadable' : '';
  return { eligible: true, pass: false, reason: `CP number and media owner logo do not match${extra}` };
}

// ─── Seed generation ──────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Scenario =
  | 'filled-same' | 'filled-brand-changed' | 'filled-from-empty' | 'filled-brand-missing'
  | 'empty-auto' | 'empty-prev-filled' | 'empty-drift' | 'empty-no-gps' | 'empty-out-period'
  | 'space-cp-match' | 'space-logo-match' | 'space-no-match'
  | 'no-longer-exists' | 'approved-done' | 'approved-mine' | 'rejected-done';

const SCENARIOS: Scenario[] = [
  'filled-brand-changed', 'empty-prev-filled', 'filled-brand-missing', 'space-no-match', 'space-no-match',
  'empty-auto', 'space-cp-match', 'filled-same', 'empty-drift', 'filled-brand-changed',
  'space-logo-match', 'filled-same', 'no-longer-exists', 'empty-auto', 'filled-same',
  'approved-done', 'empty-no-gps', 'filled-brand-changed', 'space-cp-match', 'filled-same',
  'empty-out-period', 'filled-from-empty', 'empty-auto', 'filled-same', 'rejected-done',
  'filled-brand-changed', 'space-no-match', 'filled-same', 'empty-auto', 'approved-mine',
  'filled-same', 'filled-from-empty', 'filled-same', 'space-logo-match', 'filled-brand-changed',
  'filled-same', 'empty-prev-filled', 'approved-mine', 'filled-same', 'approved-done',
  'empty-auto', 'filled-brand-changed', 'filled-same', 'filled-same',
];

// Ads already opened by other QCs at load time (index → QC)
const SEED_CLAIMS: Record<number, string> = { 3: OTHER_QCS[0], 7: OTHER_QCS[1], 13: OTHER_QCS[2] };

function emptyContent(status: AdStatus): AdContent {
  return { status, brand: '', subBrand: '', cp: '', adCopy: '' };
}

function filledContent(brandIdx: number, rng: () => number): AdContent {
  const b = BRANDS[brandIdx % BRANDS.length];
  const sub = b.subBrands.length && rng() > 0.4 ? b.subBrands[Math.floor(rng() * b.subBrands.length)] : '';
  return { status: 'Filled', brand: b.name, subBrand: sub, cp: '', adCopy: b.copy };
}

function spaceContent(cp: string): AdContent {
  return { status: 'Space available', brand: '', subBrand: '', cp, adCopy: `DISEWAKAN · Hub. ${cp}` };
}

function sceneOf(c: AdContent, owner: string | null): PhotoScene {
  return { status: c.status, brand: c.brand, cp: c.cp, owner };
}

export interface SeedState {
  billboards: Billboard[];
  ads: SurveyAd[];
  doneToday: number;
}

export function buildSeed(): SeedState {
  const rng = mulberry32(20261020);
  const billboards: Billboard[] = [];
  const ads: SurveyAd[] = [];
  let doneToday = 0;

  SCENARIOS.forEach((scenario, i) => {
    const cityDef = CITIES[i % CITIES.length];
    // Every 9th billboard sits ~30 m from the previous one so "nearby points" shows up.
    const clustered = i % 9 === 1 && billboards.length > 0 && billboards[i - 1].city === cityDef.city;
    const base = clustered
      ? offsetPoint(billboards[i - 1].lat, billboards[i - 1].lng, 30, 70)
      : { lat: cityDef.lat + (rng() - 0.5) * 0.05, lng: cityDef.lng + (rng() - 0.5) * 0.05 };
    const street = clustered ? billboards[i - 1].attrs.street : cityDef.streets[Math.floor(rng() * cityDef.streets.length)];
    const subdistrict = clustered ? billboards[i - 1].subdistrict : cityDef.subdistricts[Math.floor(rng() * cityDef.subdistricts.length)];
    const mediaOwner = i % 7 === 3 ? '' : MEDIA_OWNERS[Math.floor(rng() * MEDIA_OWNERS.length)];
    const cpOnFile = i % 5 === 2 ? null : `08${Math.floor(11 + rng() * 88)}-${Math.floor(1000 + rng() * 8999)}-${Math.floor(1000 + rng() * 8999)}`;
    const isLed = i % 6 === 4;
    const partial = i % 4 === 1; // some points have incomplete attributes

    const bb: Billboard = {
      id: `bb-${i + 1}`,
      code: `${cityDef.code}-${String(101 + i).padStart(4, '0')}`,
      city: cityDef.city,
      subdistrict,
      route: `Route ${cityDef.code}-${String.fromCharCode(65 + (i % 4))}`,
      lat: base.lat,
      lng: base.lng,
      cpOnFile,
      attrs: {
        street: `${street} No. ${Math.floor(1 + rng() * 120)}`,
        mediaOwner,
        mediaType: isLed ? 'LED' : 'Conventional',
        width: partial ? null : [4, 5, 6, 8, 10][Math.floor(rng() * 5)],
        height: partial ? null : [3, 4, 5][Math.floor(rng() * 3)],
        orientation: partial ? '' : rng() > 0.3 ? 'Horizontal' : 'Vertical',
        lighting: partial ? '' : isLed ? 'Backlit' : rng() > 0.4 ? 'Frontlit' : 'No lighting',
      },
    };
    billboards.push(bb);

    const owner = mediaOwner || null;
    const brandA = Math.floor(rng() * (BRANDS.length - 1));
    const brandB = (brandA + 1 + Math.floor(rng() * 4)) % BRANDS.length;
    const cp = cpOnFile ?? `0813-${Math.floor(1000 + rng() * 8999)}-${Math.floor(1000 + rng() * 8999)}`;

    // ── Previous months (verified) ──
    let prev: AdContent;
    let older: AdContent;
    switch (scenario) {
      case 'filled-brand-changed':
        prev = filledContent(brandA, rng); older = prev; break;
      case 'filled-brand-missing':
        prev = spaceContent(cp); older = prev; break;
      case 'filled-from-empty':
        prev = emptyContent('Empty'); older = filledContent(brandA, rng); break;
      case 'empty-auto':
        prev = i % 2 ? spaceContent(cp) : emptyContent('Empty'); older = prev; break;
      case 'space-cp-match': case 'space-logo-match': case 'space-no-match':
        prev = spaceContent(cp); older = filledContent(brandA, rng); break;
      case 'empty-drift': case 'empty-no-gps': case 'empty-out-period':
        prev = emptyContent('Empty'); older = prev; break;
      default:
        prev = filledContent(brandA, rng); older = prev;
    }

    for (let m = -3; m <= -1; m++) {
      if (m === -3 && i % 4 === 0) continue; // no survey that month
      const content = m === -1 ? prev : older;
      const start = monthStart(m);
      const taken = start + (3 + Math.floor(rng() * 10)) * DAY + Math.floor(8 + rng() * 9) * HOUR;
      const pos = offsetPoint(bb.lat, bb.lng, 8 + rng() * 22, rng() * 360);
      ads.push({
        id: `ad-${i + 1}-${monthOffset(m)}`,
        billboardId: bb.id,
        month: monthOffset(m),
        photo: {
          seed: i * 10 + m + 50, takenAt: taken, uploadedAt: taken + 2 * HOUR,
          lat: pos.lat, lng: pos.lng, heading: Math.round(bearingDeg(pos.lat, pos.lng, bb.lat, bb.lng)),
          scene: sceneOf(content, owner),
        },
        surveyor: { name: SURVEYORS[(i + m + 4) % SURVEYORS.length], input: { ...content } },
        ocr: { cp: content.cp || null, logoOwner: owner, adCopy: content.adCopy },
        inSample: false,
        state: 'approved',
        result: { ...content },
        qc: { by: OTHER_QCS[(i + m + 3) % OTHER_QCS.length], at: taken + (1 + Math.floor(rng() * 3)) * DAY, method: content.status === 'Filled' ? 'manual' : 'auto' },
        rejectReason: null,
        claim: null,
        corrections: [],
        changes: [],
        version: 1,
      });
    }

    // ── This cycle ──
    // Waiting time: a handful are deliberately > 3 days to fill the overdue group.
    const waitDays = i % 6 === 0 ? 4 + Math.floor(rng() * 3) : Math.floor(rng() * 3);
    const uploadedAt = Math.max(CYCLE.start + 2 * HOUR, NOW - waitDays * DAY - Math.floor(rng() * 6) * HOUR);
    let takenAt = uploadedAt - Math.floor(1 + rng() * 5) * HOUR;
    if (takenAt < CYCLE.start) takenAt = CYCLE.start + HOUR;
    let photoPos: { lat: number | null; lng: number | null } = offsetPoint(bb.lat, bb.lng, 6 + rng() * 28, rng() * 360);

    let input: AdContent;
    let scene: PhotoScene;
    let ocr: SurveyAd['ocr'];
    switch (scenario) {
      case 'filled-brand-changed': case 'filled-from-empty':
        input = filledContent(brandB, rng); break;
      case 'filled-brand-missing':
        input = emptyContent('Filled'); break;
      case 'empty-prev-filled':
        input = emptyContent('Empty'); break;
      case 'empty-auto': case 'empty-drift': case 'empty-no-gps': case 'empty-out-period':
        input = emptyContent('Empty'); break;
      case 'space-cp-match': case 'space-logo-match': case 'space-no-match':
        input = spaceContent(cp); break;
      case 'no-longer-exists':
        input = emptyContent('No longer exists'); break;
      default:
        input = { ...prev };
    }
    scene = sceneOf(input, owner);
    ocr = { cp: input.cp || null, logoOwner: owner, adCopy: input.adCopy };

    if (scenario === 'empty-prev-filled' && i < 10) {
      // Surveyor tagged it Empty but the old ad is still on the board.
      scene = sceneOf(prev, owner);
      ocr = { cp: null, logoOwner: owner, adCopy: prev.adCopy };
    }
    if (scenario === 'empty-drift') photoPos = offsetPoint(bb.lat, bb.lng, 85 + rng() * 60, rng() * 360);
    if (scenario === 'empty-no-gps') photoPos = { lat: null, lng: null };
    if (scenario === 'empty-out-period') takenAt = CYCLE.start - (3 + Math.floor(rng() * 5)) * DAY;
    if (scenario === 'space-cp-match') ocr = { cp: cpOnFile ?? cp, logoOwner: null, adCopy: input.adCopy };
    if (scenario === 'space-logo-match') {
      ocr = { cp: null, logoOwner: owner ?? MEDIA_OWNERS[0], adCopy: 'DISEWAKAN' };
      if (!owner) bb.attrs.mediaOwner = MEDIA_OWNERS[0];
      scene = { ...scene, cp: '', owner: owner ?? MEDIA_OWNERS[0] };
    }
    if (scenario === 'space-no-match') {
      ocr = { cp: null, logoOwner: null, adCopy: 'DISEWAKAN' };
      scene = { ...scene, cp: '', owner: null, blurry: true };
    }

    const heading = photoPos.lat != null && photoPos.lng != null && i % 8 !== 5
      ? Math.round(bearingDeg(photoPos.lat, photoPos.lng, bb.lat, bb.lng))
      : null;

    const ad: SurveyAd = {
      id: `ad-${i + 1}-${CYCLE.month}`,
      billboardId: bb.id,
      month: CYCLE.month,
      photo: { seed: i * 10 + 7, takenAt, uploadedAt, lat: photoPos.lat, lng: photoPos.lng, heading, scene },
      surveyor: { name: SURVEYORS[i % SURVEYORS.length], input },
      ocr,
      inSample: rng() < 0.4,
      state: 'pending',
      result: null,
      qc: null,
      rejectReason: null,
      claim: SEED_CLAIMS[i] ? { by: SEED_CLAIMS[i], expiresAt: NOW + (4 + i % 5) * 60 * 1000 } : null,
      corrections: [],
      changes: [],
      version: 1,
    };

    if (scenario === 'approved-done' || scenario === 'approved-mine') {
      const by = scenario === 'approved-mine' ? ME : OTHER_QCS[i % OTHER_QCS.length];
      ad.state = 'approved';
      ad.result = { ...input };
      ad.qc = { by, at: scenario === 'approved-mine' ? NOW - (1 + i % 3) * HOUR : uploadedAt + 5 * HOUR, method: 'manual' };
      if (scenario === 'approved-mine') doneToday++;
    }
    if (scenario === 'rejected-done') {
      ad.state = 'rejected';
      ad.photo!.scene = { ...ad.photo!.scene, blurry: true };
      ad.rejectReason = 'Photo blurry or unreadable';
      ad.qc = { by: OTHER_QCS[1], at: uploadedAt + 3 * HOUR, method: 'manual' };
    }
    ads.push(ad);
  });

  return { billboards, ads, doneToday };
}
