import { useSyncExternalStore } from 'react';

// ─── Tiny generic store (module-level, in-memory, no backend) ─────────────────
// Shared across CORE 4 Master pages so cross-references (Product -> Company /
// Category / Price, Price Matrix <-> Product pricing) stay in sync within a
// session without a real API.

type Listener = () => void;

function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener>();
  return {
    getState: () => state,
    setState: (updater: (prev: T) => T) => {
      state = updater(state);
      listeners.forEach(l => l());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SimpleTextRecord extends BaseRecord {
  name: string;
}

export interface CompanyRecord extends BaseRecord {
  name: string;
  abbr: string;
  increment: number;
  logo: string | null;
  address: string;
  url: string;
  phone: string;
  notes: string;
  customerData: string;
  cancellationPolicy: string;
  termsAndConditions: string;
  paymentTo: string;
}

export interface ProductCategoryRecord extends BaseRecord {
  name: string;
  image: string | null;
  quantityUnit: string;
  durationUnit: string;
  campaignable: boolean;
}

export interface ProductPriceEntry {
  priceTierId: string;
  price: number;
}

export interface ProductRecord extends BaseRecord {
  name: string;
  companyId: string;
  categoryId: string;
  image: string | null;
  quantityUnit: string;
  durationUnit: string;
  active: boolean;
  prices: ProductPriceEntry[];
}

export interface MasterState {
  cities: SimpleTextRecord[];
  brands: SimpleTextRecord[];
  termMoments: SimpleTextRecord[];
  termDues: SimpleTextRecord[];
  priceTiers: SimpleTextRecord[];
  industries: SimpleTextRecord[];
  banks: SimpleTextRecord[];
  productCategories: ProductCategoryRecord[];
  companies: CompanyRecord[];
  products: ProductRecord[];
}

// ─── id/date helpers ────────────────────────────────────────────────────────

let idCounter = 1000;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatIDR(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

// ─── Mock seed data ─────────────────────────────────────────────────────────

function simpleRecords(prefix: string, names: string[], startDaysAgo = 30): SimpleTextRecord[] {
  return names.map((name, i) => ({
    id: nextId(prefix),
    name,
    createdAt: daysAgoISO(startDaysAgo - i),
    updatedAt: daysAgoISO(startDaysAgo - i),
    deletedAt: null,
  }));
}

const cities = simpleRecords('city', [
  'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Denpasar', 'Yogyakarta',
]);

const brands = simpleRecords('brand', [
  'Nusantara Kopi', 'Garuda Mobile', 'Bali Segar', 'Cakra Elektronik', 'Merapi Fashion',
  'Samudra Otomotif', 'Khatulistiwa Snack', 'Rajawali Finance', 'Melati Kosmetik', 'Borobudur Travel',
]);

const termMoments = simpleRecords('term-moment', [
  'Before broadcast', 'After broadcast', 'Upon signing', 'End of month',
]);

const termDues = simpleRecords('term-due', [
  '7 days', '14 days', '30 days', '45 days', '60 days',
]);

const priceTiers = simpleRecords('price-tier', [
  'Standard', 'Agency', 'Corporate', 'Government', 'Promo',
]);

const industries = simpleRecords('industry', [
  'F&B', 'Retail', 'Automotive', 'FMCG', 'Property', 'Technology', 'Finance', 'Education',
]);

const banks = simpleRecords('bank', [
  'BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata',
]);

const productCategories: ProductCategoryRecord[] = [
  { id: nextId('cat'), name: 'Digital Screen',   image: null, quantityUnit: 'Screen', durationUnit: 'Day',   campaignable: true,  createdAt: daysAgoISO(28), updatedAt: daysAgoISO(28), deletedAt: null },
  { id: nextId('cat'), name: 'Taxi Top',         image: null, quantityUnit: 'Slot',   durationUnit: 'Week',  campaignable: true,  createdAt: daysAgoISO(27), updatedAt: daysAgoISO(27), deletedAt: null },
  { id: nextId('cat'), name: 'Billboard',        image: null, quantityUnit: 'Slot',   durationUnit: 'Month', campaignable: false, createdAt: daysAgoISO(26), updatedAt: daysAgoISO(26), deletedAt: null },
  { id: nextId('cat'), name: 'In-Car Display',   image: null, quantityUnit: 'Screen', durationUnit: 'Day',   campaignable: true,  createdAt: daysAgoISO(25), updatedAt: daysAgoISO(25), deletedAt: null },
  { id: nextId('cat'), name: 'Bus Wrap',         image: null, quantityUnit: 'Spot',   durationUnit: 'Month', campaignable: false, createdAt: daysAgoISO(24), updatedAt: daysAgoISO(24), deletedAt: null },
  { id: nextId('cat'), name: 'Kiosk Screen',     image: null, quantityUnit: 'Screen', durationUnit: 'Day',   campaignable: true,  createdAt: daysAgoISO(23), updatedAt: daysAgoISO(23), deletedAt: null },
];

const companies: CompanyRecord[] = [
  {
    id: nextId('company'), name: 'PT Cakrawala Media', abbr: 'CKM', increment: 42, logo: null,
    address: 'Jl. Sudirman No. 12, Jakarta Selatan', url: 'https://cakrawalamedia.co.id', phone: '021-5551234',
    notes: 'Standard notes for quotations.', customerData: 'Customer name, address, and tax ID.',
    cancellationPolicy: 'Cancellations must be made 7 days in advance.', termsAndConditions: 'Payment due per agreed terms.',
    paymentTo: 'PT Cakrawala Media\nBank Mandiri 123-456-7890', createdAt: daysAgoISO(40), updatedAt: daysAgoISO(5), deletedAt: null,
  },
  {
    id: nextId('company'), name: 'PT Nusantara Adprima', abbr: 'NAP', increment: 17, logo: null,
    address: 'Jl. Gatot Subroto Kav. 8, Jakarta', url: 'https://nusantaraadprima.id', phone: '021-5559876',
    notes: 'Include VAT in all quotations.', customerData: 'Company name and PIC contact.',
    cancellationPolicy: 'No refund within 3 days of campaign start.', termsAndConditions: 'Net 30 payment terms.',
    paymentTo: 'PT Nusantara Adprima\nBank BCA 987-654-3210', createdAt: daysAgoISO(38), updatedAt: daysAgoISO(10), deletedAt: null,
  },
  {
    id: nextId('company'), name: 'PT Borneo Reklame', abbr: 'BRK', increment: 5, logo: null,
    address: 'Jl. Ahmad Yani No. 45, Balikpapan', url: 'https://borneoreklame.com', phone: '0542-555123',
    notes: '', customerData: '', cancellationPolicy: '', termsAndConditions: '',
    paymentTo: 'PT Borneo Reklame\nBank BNI 555-111-2222', createdAt: daysAgoISO(20), updatedAt: daysAgoISO(20), deletedAt: null,
  },
  {
    id: nextId('company'), name: 'PT Katulistiwa Visual', abbr: 'KTV', increment: 0, logo: null,
    address: 'Jl. Diponegoro No. 3, Surabaya', url: '', phone: '031-5551122',
    notes: '', customerData: '', cancellationPolicy: '', termsAndConditions: '',
    paymentTo: '', createdAt: daysAgoISO(15), updatedAt: daysAgoISO(15), deletedAt: null,
  },
];

function makePrices(tierIndices: number[], base: number): ProductPriceEntry[] {
  return tierIndices.map((ti, i) => ({ priceTierId: priceTiers[ti].id, price: base + i * base * 0.25 }));
}

const products: ProductRecord[] = [
  { id: nextId('product'), name: 'Digital Screen — Mall Kelapa Gading', companyId: companies[0].id, categoryId: productCategories[0].id, image: null, quantityUnit: 'Screen', durationUnit: 'Day', active: true,  prices: makePrices([0,1,2], 500000), createdAt: daysAgoISO(20), updatedAt: daysAgoISO(2), deletedAt: null },
  { id: nextId('product'), name: 'Digital Screen — Grand Indonesia',   companyId: companies[0].id, categoryId: productCategories[0].id, image: null, quantityUnit: 'Screen', durationUnit: 'Day', active: true,  prices: makePrices([0,1], 750000), createdAt: daysAgoISO(19), updatedAt: daysAgoISO(4), deletedAt: null },
  { id: nextId('product'), name: 'Taxi Top — Bluebird Fleet A',        companyId: companies[1].id, categoryId: productCategories[1].id, image: null, quantityUnit: 'Slot',   durationUnit: 'Week', active: true,  prices: makePrices([0,3], 1200000), createdAt: daysAgoISO(18), updatedAt: daysAgoISO(6), deletedAt: null },
  { id: nextId('product'), name: 'Billboard — Tol Jagorawi KM 12',     companyId: companies[1].id, categoryId: productCategories[2].id, image: null, quantityUnit: 'Slot',   durationUnit: 'Month', active: true,  prices: makePrices([0,1,2,3], 15000000), createdAt: daysAgoISO(17), updatedAt: daysAgoISO(1), deletedAt: null },
  { id: nextId('product'), name: 'Billboard — Jl. Sudirman',           companyId: companies[0].id, categoryId: productCategories[2].id, image: null, quantityUnit: 'Slot',   durationUnit: 'Month', active: false, prices: makePrices([0], 22000000), createdAt: daysAgoISO(16), updatedAt: daysAgoISO(16), deletedAt: null },
  { id: nextId('product'), name: 'In-Car Display — Grab Fleet',        companyId: companies[2].id, categoryId: productCategories[3].id, image: null, quantityUnit: 'Screen', durationUnit: 'Day', active: true,  prices: makePrices([0,1], 300000), createdAt: daysAgoISO(15), updatedAt: daysAgoISO(3), deletedAt: null },
  { id: nextId('product'), name: 'Bus Wrap — TransJakarta Koridor 1',  companyId: companies[2].id, categoryId: productCategories[4].id, image: null, quantityUnit: 'Spot',   durationUnit: 'Month', active: true,  prices: makePrices([0,2], 8000000), createdAt: daysAgoISO(14), updatedAt: daysAgoISO(5), deletedAt: null },
  { id: nextId('product'), name: 'Kiosk Screen — Bandara Soekarno-Hatta', companyId: companies[3].id, categoryId: productCategories[5].id, image: null, quantityUnit: 'Screen', durationUnit: 'Day', active: true, prices: makePrices([0,1,4], 900000), createdAt: daysAgoISO(13), updatedAt: daysAgoISO(7), deletedAt: null },
  { id: nextId('product'), name: 'Digital Screen — Mall Taman Anggrek', companyId: companies[3].id, categoryId: productCategories[0].id, image: null, quantityUnit: 'Screen', durationUnit: 'Day', active: true, prices: makePrices([1,2], 650000), createdAt: daysAgoISO(12), updatedAt: daysAgoISO(8), deletedAt: null },
  { id: nextId('product'), name: 'Taxi Top — Gojek Fleet B',           companyId: companies[1].id, categoryId: productCategories[1].id, image: null, quantityUnit: 'Slot',   durationUnit: 'Week', active: true,  prices: makePrices([0]      , 1000000), createdAt: daysAgoISO(11), updatedAt: daysAgoISO(9), deletedAt: null },
];

const initialState: MasterState = { cities, brands, termMoments, termDues, priceTiers, industries, banks, productCategories, companies, products };

const store = createStore<MasterState>(initialState);

export function useMasterData(): MasterState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Non-reactive snapshot, for use outside components (validation, id lookups). */
export function getMasterState(): MasterState {
  return store.getState();
}

// ─── Generic helpers for simple text collections (City / Brand / Term Moment / Term Due / Price) ──

type SimpleCollectionKey = 'cities' | 'brands' | 'termMoments' | 'termDues' | 'priceTiers' | 'industries' | 'banks';

export function isSimpleNameTaken(key: SimpleCollectionKey, name: string, excludeId?: string): boolean {
  const list = store.getState()[key];
  const norm = name.trim().toLowerCase();
  return list.some(r => r.deletedAt === null && r.id !== excludeId && r.name.trim().toLowerCase() === norm);
}

export function addSimpleRecord(key: SimpleCollectionKey, name: string) {
  store.setState(s => ({
    ...s,
    [key]: [
      { id: nextId(key), name: name.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null },
      ...s[key],
    ],
  }));
}

export function updateSimpleRecord(key: SimpleCollectionKey, id: string, name: string) {
  store.setState(s => ({
    ...s,
    [key]: s[key].map(r => r.id === id ? { ...r, name: name.trim(), updatedAt: new Date().toISOString() } : r),
  }));
}

export function softDeleteSimpleRecord(key: SimpleCollectionKey, id: string) {
  store.setState(s => ({
    ...s,
    [key]: s[key].map(r => r.id === id ? { ...r, deletedAt: new Date().toISOString() } : r),
  }));
}

export function restoreSimpleRecord(key: SimpleCollectionKey, id: string) {
  store.setState(s => ({
    ...s,
    [key]: s[key].map(r => r.id === id ? { ...r, deletedAt: null, updatedAt: new Date().toISOString() } : r),
  }));
}

// ─── Reference counts (used to block deletes and show "used by N" counts) ──

export function countProductsUsingCategory(categoryId: string): number {
  return store.getState().products.filter(p => p.deletedAt === null && p.categoryId === categoryId).length;
}

export function countProductsUsingCompany(companyId: string): number {
  return store.getState().products.filter(p => p.deletedAt === null && p.companyId === companyId).length;
}

export function countProductsUsingPriceTier(priceTierId: string): number {
  return store.getState().products.filter(p => p.deletedAt === null && p.prices.some(pr => pr.priceTierId === priceTierId)).length;
}

// ─── Product Category CRUD ──────────────────────────────────────────────────

export function isCategoryNameTaken(name: string, excludeId?: string): boolean {
  const norm = name.trim().toLowerCase();
  return store.getState().productCategories.some(r => r.deletedAt === null && r.id !== excludeId && r.name.trim().toLowerCase() === norm);
}

export function upsertCategory(data: Omit<ProductCategoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, id?: string) {
  store.setState(s => {
    if (id) {
      return { ...s, productCategories: s.productCategories.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) };
    }
    const rec: ProductCategoryRecord = { ...data, id: nextId('cat'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null };
    return { ...s, productCategories: [rec, ...s.productCategories] };
  });
}

export function softDeleteCategory(id: string) {
  store.setState(s => ({ ...s, productCategories: s.productCategories.map(c => c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c) }));
}

export function restoreCategory(id: string) {
  store.setState(s => ({ ...s, productCategories: s.productCategories.map(c => c.id === id ? { ...c, deletedAt: null, updatedAt: new Date().toISOString() } : c) }));
}

// ─── Company CRUD ───────────────────────────────────────────────────────────

export function isCompanyNameTaken(name: string, excludeId?: string): boolean {
  const norm = name.trim().toLowerCase();
  return store.getState().companies.some(r => r.deletedAt === null && r.id !== excludeId && r.name.trim().toLowerCase() === norm);
}

export function getCompany(id: string): CompanyRecord | undefined {
  return store.getState().companies.find(c => c.id === id);
}

export function upsertCompany(data: Omit<CompanyRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, id?: string) {
  store.setState(s => {
    if (id) {
      return { ...s, companies: s.companies.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) };
    }
    const rec: CompanyRecord = { ...data, id: nextId('company'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null };
    return { ...s, companies: [rec, ...s.companies] };
  });
}

export function softDeleteCompany(id: string) {
  store.setState(s => ({ ...s, companies: s.companies.map(c => c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c) }));
}

export function restoreCompany(id: string) {
  store.setState(s => ({ ...s, companies: s.companies.map(c => c.id === id ? { ...c, deletedAt: null, updatedAt: new Date().toISOString() } : c) }));
}

// ─── Product CRUD ───────────────────────────────────────────────────────────

export function isProductNameTaken(name: string, excludeId?: string): boolean {
  const norm = name.trim().toLowerCase();
  return store.getState().products.some(r => r.deletedAt === null && r.id !== excludeId && r.name.trim().toLowerCase() === norm);
}

export function getProduct(id: string): ProductRecord | undefined {
  return store.getState().products.find(p => p.id === id);
}

export function upsertProduct(data: Omit<ProductRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, id?: string) {
  store.setState(s => {
    if (id) {
      return { ...s, products: s.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p) };
    }
    const rec: ProductRecord = { ...data, id: nextId('product'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null };
    return { ...s, products: [rec, ...s.products] };
  });
}

export function setProductActive(id: string, active: boolean) {
  store.setState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, active, updatedAt: new Date().toISOString() } : p) }));
}

export function softDeleteProduct(id: string) {
  store.setState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p) }));
}

export function restoreProduct(id: string) {
  store.setState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, deletedAt: null, updatedAt: new Date().toISOString() } : p) }));
}

/** Set a single price-tier price on a product (used by both Product's Pricing section and Price Matrix). */
export function setProductPrice(productId: string, priceTierId: string, price: number | null) {
  store.setState(s => ({
    ...s,
    products: s.products.map(p => {
      if (p.id !== productId) return p;
      const withoutTier = p.prices.filter(pr => pr.priceTierId !== priceTierId);
      const next = price == null ? withoutTier : [...withoutTier, { priceTierId, price }];
      return { ...p, prices: next, updatedAt: new Date().toISOString() };
    }),
  }));
}
