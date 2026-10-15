// ── Shared types, constants, and helpers for the Quotations feature ──────────
// Kept in a separate file to avoid circular imports between
// Quotation.tsx  <-->  QuotationDetailDrawer / CreateEditQuotationModal

// ── Types ──────────────────────────────────────────────────────────────────────

export type QuotationStatus = 'lead' | 'filled' | 'signed' | 'salesOrder';

export interface SalesPerson { id: string; name: string; initials: string; }

export interface ProductLineItem {
  id: string; product: string; category: string;
  quantity: number; unit: string;
  duration: number; durationUnit: 'weeks' | 'months';
  city: string; ratePrice: number; finalPrice: number;
  startDate: string; notes: string;
  description: string; discount: number;
}

export interface PaymentTerm {
  id: string; name: string; percent: number;
  masQuotationTermMoment_id: string; masQuotationTermDue_id: string; amount: number;
}

export interface QuotationTag { label: string; color: string; bg: string; }

export interface Quotation {
  id: string; quotationNumber: string; quotationNumberRev: string;
  masCompany_id: string;
  setClientProfile_id: string;
  setClientContact_id: string;
  setClientBilling_id: string;
  masBrand_id: string;
  clientName: string; clientBrand: string; clientId: string;
  brandId?: string;
  contactPerson: string; contactEmail: string;
  quoteName: string;
  salesPerson: SalesPerson;
  status: QuotationStatus;
  tags: QuotationTag[];
  subtotal: number; discount: number; totalAfterDiscount: number; vat: number; grandTotal: number;
  validUntil: string; validUntilDate: Date;
  createdDate: string; createdDateObj: Date;
  convertedAt?: string;
  image: string | null;
  appToDate: string | null;
  cancelledAt: string | null;
  products: ProductLineItem[];
  paymentTerms: PaymentTerm[];
  attachments: QuotationAttachment[];
  additionalNotes: string; cancellationPolicy: string; termsAndConditions: string;
}

export interface QuotationAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

// ── Status config ──────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bg: string; border?: string }> = {
  lead:       { label: 'Lead',        color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'   },
  filled:     { label: 'Filled',      color: '#2563EB', bg: 'rgba(37,99,235,0.1)'    },
  signed:     { label: 'Signed',      color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'   },
  salesOrder: { label: 'Sales Order', color: '#10B981', bg: 'rgba(16,185,129,0.1)'   },
};

// ── Tag definitions ────────────────────────────────────────────────────────────

export const TAG_DEFS: Record<string, QuotationTag> = {
  urgent:    { label: 'Urgent',     color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  highValue: { label: 'High Value', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  renewal:   { label: 'Renewal',    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  newClient: { label: 'New Client', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  corporate: { label: 'Corporate',  color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  sme:       { label: 'SME',        color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
};

// ── Master reference data ──────────────────────────────────────────────────────

export const MASTER_PRODUCTS = [
  { name: 'StickMob - Back Window',              category: 'StickMob', unit: 'spots', defaultRate: 5000000  },
  { name: 'StickMob - Full-Back',                category: 'StickMob', unit: 'spots', defaultRate: 8000000  },
  { name: 'StickMob - Back Window & Panel',      category: 'StickMob', unit: 'spots', defaultRate: 7500000  },
  { name: 'StickBus - Transjakarta Single',      category: 'StickBus', unit: 'units', defaultRate: 15000000 },
  { name: 'Mobile LED - Regular Slot 1-10 Days', category: 'LED',      unit: 'spots', defaultRate: 2500000  },
];

export const SALES_PERSONS_LIST: SalesPerson[] = [
  { id: 'USR-001', name: 'Ahmad Rahman',  initials: 'AR' },
  { id: 'USR-002', name: 'Dewi Kusuma',   initials: 'DK' },
  { id: 'USR-003', name: 'Rudi Hartono',  initials: 'RH' },
  { id: 'USR-004', name: 'Siti Rahayu',   initials: 'SR' },
  { id: 'USR-005', name: 'Budi Santoso',  initials: 'BS' },
];

export const CITIES = ['Jakarta','Bandung','Surabaya','Semarang','Medan','Yogyakarta','Makassar','Palembang'];

export const MILESTONE_OPTIONS = [
  'After Quotation Signed','Before Installation','After Campaign Started',
  'After 1st Month','After 2nd Month','After 3rd Month',
  'Monthly (recurring)','End of Campaign','2 Weeks Before End of Campaign',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

export const formatIDR = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

export const getExpiryInfo = (date: Date): { text: string; color: string; urgent: boolean } => {
  const today = new Date('2026-02-20');
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `Expired ${Math.abs(diff)}d ago`, color: '#EF4444', urgent: false };
  if (diff <= 7) return { text: `Expires in ${diff} days`, color: '#F59E0B', urgent: true };
  return {
    text: `Valid until ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    color: 'var(--color-muted-foreground)', urgent: false,
  };
};

// ── Mock seed data ─────────────────────────────────────────────────────────────

import { getMasterState } from '../core/masterStore';
const _ms = getMasterState();
const _companyId = _ms.companies[0]?.id ?? 'company-1';

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'QUO-252002-001', quotationNumber: 'QUO-252002-001', quotationNumberRev: 'A',
    masCompany_id: _companyId, setClientProfile_id: 'CLT-10001', setClientContact_id: 'CT-001', setClientBilling_id: 'BIL-001', masBrand_id: 'BRD-001-1',
    clientName: 'PT Kopi Kenangan Indonesia', clientBrand: 'Kenangan Coffee', clientId: 'CLT-10001',
    contactPerson: 'Sarah Johnson', contactEmail: 'sarah.j@kenangan.co.id',
    quoteName: 'Q1 2025 Jakarta Campaign - Back Window Ads',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    status: 'lead', tags: [TAG_DEFS.urgent, TAG_DEFS.highValue],
    subtotal: 45000000, discount: 2000000, totalAfterDiscount: 43000000, vat: 4730000, grandTotal: 47730000,
    validUntil: 'Mar 20, 2025', validUntilDate: new Date('2025-03-20'),
    createdDate: 'Feb 20, 2025', createdDateObj: new Date('2025-02-20'),
    image: null, appToDate: null, cancelledAt: null,
    products: [
      { id:'p1', product:'StickMob - Back Window', category:'StickMob', quantity:50, unit:'spots', duration:3, durationUnit:'months', city:'Jakarta',  ratePrice:5000000, finalPrice:4500000, startDate:'Mar 1, 2025', notes:'Premium mall locations only', description: 'Back window advertising on StickMob fleet', discount: 500000 },
      { id:'p2', product:'StickMob - Full-Back',   category:'StickMob', quantity:20, unit:'spots', duration:2, durationUnit:'months', city:'Bandung',  ratePrice:8000000, finalPrice:7500000, startDate:'Mar 1, 2025', notes:'', description: 'Full-back wrap advertising', discount: 500000 },
    ],
    paymentTerms: [
      { id:'pt1', name:'Initial Payment', percent:50, masQuotationTermMoment_id:'term-moment-1', masQuotationTermDue_id:'term-due-1', amount:23865000 },
      { id:'pt2', name:'Final Payment',   percent:50, masQuotationTermMoment_id:'term-moment-2', masQuotationTermDue_id:'term-due-2', amount:23865000 },
    ],
    attachments: [],
    additionalNotes: '<p>Campaign to be executed in premium locations across Jakarta and Bandung. Installation team will coordinate with venue management.</p>',
    cancellationPolicy: '<ul><li>Cancellation before campaign start: 100% refund</li><li>After campaign start: No refund</li><li>Early termination: Prorated refund minus 20% penalty</li></ul>',
    termsAndConditions: '<ol><li>Payment Terms: As per agreed schedule above</li><li>Campaign Execution: StickPoint executes per agreed timeline</li><li>Force Majeure: Delays due to unforeseen circumstances</li><li>Intellectual Property: Client owns campaign content</li><li>Dispute Resolution: Governed by Indonesian law</li></ol>',
  },
  {
    id: 'QUO-251802-002', quotationNumber: 'QUO-251802-002', quotationNumberRev: 'A',
    masCompany_id: _companyId, setClientProfile_id: 'CLT-10002', setClientContact_id: 'CT-002', setClientBilling_id: 'BIL-002', masBrand_id: 'BRD-002-1',
    clientName: 'PT Tokopedia', clientBrand: 'Tokopedia', clientId: 'CLT-10002',
    contactPerson: 'Andi Wijaya', contactEmail: 'andi.w@tokopedia.com',
    quoteName: 'Transjakarta Advertising Campaign Q1 2025',
    salesPerson: { id: 'USR-002', name: 'Dewi Kusuma', initials: 'DK' },
    status: 'salesOrder', tags: [TAG_DEFS.highValue, TAG_DEFS.corporate],
    subtotal: 120000000, discount: 5000000, totalAfterDiscount: 115000000, vat: 12650000, grandTotal: 127650000,
    validUntil: 'Feb 10, 2025', validUntilDate: new Date('2025-02-10'),
    createdDate: 'Feb 18, 2025', createdDateObj: new Date('2025-02-18'),
    convertedAt: 'Feb 22, 2025',
    image: null, appToDate: null, cancelledAt: null,
    products: [
      { id:'p1', product:'StickBus - Transjakarta Single', category:'StickBus', quantity:10, unit:'units', duration:3, durationUnit:'months', city:'Jakarta', ratePrice:15000000, finalPrice:15000000, startDate:'Jan 1, 2025', notes:'', description: 'Transjakarta single bus wrap', discount: 0 },
    ],
    paymentTerms: [{ id:'pt1', name:'Full Payment', percent:100, masQuotationTermMoment_id:'term-moment-1', masQuotationTermDue_id:'term-due-1', amount:127650000 }],
    attachments:[], additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
  {
    id: 'QUO-251502-003', quotationNumber: 'QUO-251502-003', quotationNumberRev: 'A',
    masCompany_id: _companyId, setClientProfile_id: 'CLT-10003', setClientContact_id: 'CT-003', setClientBilling_id: 'BIL-003', masBrand_id: 'BRD-003-1',
    clientName: 'PT Gojek Indonesia', clientBrand: 'Gojek', clientId: 'CLT-10003',
    contactPerson: 'Ratna Dewi', contactEmail: 'ratna.d@gojek.com',
    quoteName: 'Mobile LED Campaign - App Promotion Jakarta',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    status: 'signed', tags: [TAG_DEFS.urgent],
    subtotal: 80000000, discount: 0, totalAfterDiscount: 80000000, vat: 8800000, grandTotal: 88800000,
    validUntil: 'Mar 15, 2025', validUntilDate: new Date('2025-03-15'),
    createdDate: 'Feb 15, 2025', createdDateObj: new Date('2025-02-15'),
    convertedAt: 'Mar 1, 2025',
    image: null, appToDate: null, cancelledAt: null,
    products: [
      { id:'p1', product:'Mobile LED - Regular Slot 1-10 Days', category:'LED', quantity:100, unit:'spots', duration:4, durationUnit:'weeks', city:'Jakarta', ratePrice:2500000, finalPrice:2500000, startDate:'Feb 15, 2025', notes:'', description: 'Mobile LED advertising slot', discount: 0 },
    ],
    paymentTerms: [], attachments:[], additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
  {
    id: 'QUO-251902-004', quotationNumber: 'QUO-251902-004', quotationNumberRev: 'A',
    masCompany_id: _companyId, setClientProfile_id: 'CLT-10004', setClientContact_id: 'CT-004', setClientBilling_id: 'BIL-004', masBrand_id: 'BRD-004-1',
    clientName: 'PT Unilever Indonesia', clientBrand: 'Dove', clientId: 'CLT-10004',
    contactPerson: 'Lina Kusuma', contactEmail: 'lina.k@unilever.com',
    quoteName: 'StickMob Campaign - Dove Product Launch',
    salesPerson: { id: 'USR-003', name: 'Rudi Hartono', initials: 'RH' },
    status: 'filled', tags: [TAG_DEFS.newClient, TAG_DEFS.highValue],
    subtotal: 58000000, discount: 3000000, totalAfterDiscount: 55000000, vat: 6050000, grandTotal: 61050000,
    validUntil: 'Apr 1, 2025', validUntilDate: new Date('2025-04-01'),
    createdDate: 'Feb 19, 2025', createdDateObj: new Date('2025-02-19'),
    image: null, appToDate: null, cancelledAt: null,
    products: [
      { id:'p1', product:'StickMob - Back Window & Panel', category:'StickMob', quantity:40, unit:'spots', duration:2, durationUnit:'months', city:'Jakarta', ratePrice:7500000, finalPrice:7000000, startDate:'Mar 1, 2025', notes:'', description: 'Back window and panel combo', discount: 500000 },
    ],
    paymentTerms: [
      { id:'pt1', name:'Initial Payment', percent:50, masQuotationTermMoment_id:'term-moment-1', masQuotationTermDue_id:'term-due-1', amount:30525000 },
      { id:'pt2', name:'Final Payment',   percent:50, masQuotationTermMoment_id:'term-moment-2', masQuotationTermDue_id:'term-due-2', amount:30525000 },
    ],
    attachments:[], additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
  {
    id: 'QUO-252102-005', quotationNumber: 'QUO-252102-005', quotationNumberRev: 'A',
    masCompany_id: _companyId, setClientProfile_id: 'CLT-10005', setClientContact_id: 'CT-005', setClientBilling_id: 'BIL-005', masBrand_id: 'BRD-005-1',
    clientName: 'PT Astra Toyota', clientBrand: 'Toyota', clientId: 'CLT-10005',
    contactPerson: 'Bambang Irawan', contactEmail: 'bambang.i@astra.co.id',
    quoteName: 'Full-Back Advertising - New Model Launch Campaign',
    salesPerson: { id: 'USR-004', name: 'Siti Rahayu', initials: 'SR' },
    status: 'lead', tags: [TAG_DEFS.corporate],
    subtotal: 90000000, discount: 0, totalAfterDiscount: 90000000, vat: 9900000, grandTotal: 99900000,
    validUntil: 'Mar 25, 2025', validUntilDate: new Date('2025-03-25'),
    createdDate: 'Feb 21, 2025', createdDateObj: new Date('2025-02-21'),
    image: null, appToDate: null, cancelledAt: null,
    products: [
      { id:'p1', product:'StickMob - Full-Back', category:'StickMob', quantity:60, unit:'spots', duration:2, durationUnit:'months', city:'Jakarta', ratePrice:8000000, finalPrice:8000000, startDate:'Mar 1, 2025', notes:'', description: 'Full-back vehicle wrap', discount: 0 },
    ],
    paymentTerms: [], attachments:[], additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
];
