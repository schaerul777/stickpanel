// ── Shared types, constants, and helpers for the Quotations feature ──────────
// Kept in a separate file to avoid circular imports between
// Quotation.tsx  <-->  QuotationDetailDrawer / CreateEditQuotationModal

// ── Types ──────────────────────────────────────────────────────────────────────

export type QuotationStatus = 'lead' | 'won' | 'lost' | 'expired' | 'draft';

export interface SalesPerson { id: string; name: string; initials: string; }

export interface ProductLineItem {
  id: string; product: string; category: string;
  quantity: number; unit: string;
  duration: number; durationUnit: 'weeks' | 'months';
  city: string; ratePrice: number; finalPrice: number;
  campaignStart: string; campaignEnd: string; notes: string;
}

export interface PaymentTerm {
  id: string; name: string; percentage: number;
  milestone: string; dueDays: number; amount: number;
}

export interface QuotationTag { label: string; color: string; bg: string; }

export interface Quotation {
  id: string; quoNo: string;
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
  products: ProductLineItem[];
  paymentTerms: PaymentTerm[];
  additionalNotes: string; cancellationPolicy: string; termsAndConditions: string;
  lostReason?: string;
}

// ── Status config ──────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bg: string; border?: string }> = {
  lead:    { label: 'Lead',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'   },
  won:     { label: 'Won',     color: '#10B981', bg: 'rgba(16,185,129,0.1)'   },
  lost:    { label: 'Lost',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)'    },
  expired: { label: 'Expired', color: '#6B7280', bg: 'rgba(107,114,128,0.1)'  },
  draft:   { label: 'Draft',   color: '#6B7280', bg: 'transparent', border: '1px solid #9CA3AF' },
};

// ── Tag definitions ────────────────────────────────────────────────────────────

export const TAG_DEFS: Record<string, QuotationTag> = {
  urgent:    { label: 'Urgent',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  highValue: { label: 'High Value', color: '#CA8A04', bg: 'rgba(202,138,4,0.1)'   },
  renewal:   { label: 'Renewal',    color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  newClient: { label: 'New Client', color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  corporate: { label: 'Corporate',  color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  sme:       { label: 'SME',        color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
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

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'QUO-252002-001', quoNo: 'QUO-252002-001',
    clientName: 'PT Kopi Kenangan Indonesia', clientBrand: 'Kenangan Coffee', clientId: 'CLT-10001',
    contactPerson: 'Sarah Johnson', contactEmail: 'sarah.j@kenangan.co.id',
    quoteName: 'Q1 2025 Jakarta Campaign - Back Window Ads',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    status: 'lead', tags: [TAG_DEFS.urgent, TAG_DEFS.highValue],
    subtotal: 45000000, discount: 2000000, totalAfterDiscount: 43000000, vat: 4730000, grandTotal: 47730000,
    validUntil: 'Mar 20, 2025', validUntilDate: new Date('2025-03-20'),
    createdDate: 'Feb 20, 2025', createdDateObj: new Date('2025-02-20'),
    products: [
      { id:'p1', product:'StickMob - Back Window', category:'StickMob', quantity:50, unit:'spots', duration:3, durationUnit:'months', city:'Jakarta',  ratePrice:5000000, finalPrice:4500000, campaignStart:'Mar 1, 2025', campaignEnd:'May 31, 2025', notes:'Premium mall locations only' },
      { id:'p2', product:'StickMob - Full-Back',   category:'StickMob', quantity:20, unit:'spots', duration:2, durationUnit:'months', city:'Bandung',  ratePrice:8000000, finalPrice:7500000, campaignStart:'Mar 1, 2025', campaignEnd:'Apr 30, 2025', notes:'' },
    ],
    paymentTerms: [
      { id:'pt1', name:'Initial Payment', percentage:50, milestone:'After Quotation Signed', dueDays:7,  amount:23865000 },
      { id:'pt2', name:'Final Payment',   percentage:50, milestone:'End of Campaign',        dueDays:14, amount:23865000 },
    ],
    additionalNotes: '<p>Campaign to be executed in premium locations across Jakarta and Bandung. Installation team will coordinate with venue management.</p>',
    cancellationPolicy: '<ul><li>Cancellation before campaign start: 100% refund</li><li>After campaign start: No refund</li><li>Early termination: Prorated refund minus 20% penalty</li></ul>',
    termsAndConditions: '<ol><li>Payment Terms: As per agreed schedule above</li><li>Campaign Execution: StickPoint executes per agreed timeline</li><li>Force Majeure: Delays due to unforeseen circumstances</li><li>Intellectual Property: Client owns campaign content</li><li>Dispute Resolution: Governed by Indonesian law</li></ol>',
  },
  {
    id: 'QUO-251802-002', quoNo: 'QUO-251802-002',
    clientName: 'PT Tokopedia', clientBrand: 'Tokopedia', clientId: 'CLT-10002',
    contactPerson: 'Andi Wijaya', contactEmail: 'andi.w@tokopedia.com',
    quoteName: 'Transjakarta Advertising Campaign Q1 2025',
    salesPerson: { id: 'USR-002', name: 'Dewi Kusuma', initials: 'DK' },
    status: 'won', tags: [TAG_DEFS.highValue, TAG_DEFS.corporate],
    subtotal: 120000000, discount: 5000000, totalAfterDiscount: 115000000, vat: 12650000, grandTotal: 127650000,
    validUntil: 'Feb 10, 2025', validUntilDate: new Date('2025-02-10'),
    createdDate: 'Feb 18, 2025', createdDateObj: new Date('2025-02-18'),
    convertedAt: 'Feb 22, 2025',
    products: [
      { id:'p1', product:'StickBus - Transjakarta Single', category:'StickBus', quantity:10, unit:'units', duration:3, durationUnit:'months', city:'Jakarta', ratePrice:15000000, finalPrice:15000000, campaignStart:'Jan 1, 2025', campaignEnd:'Mar 31, 2025', notes:'' },
    ],
    paymentTerms: [{ id:'pt1', name:'Full Payment', percentage:100, milestone:'After Quotation Signed', dueDays:7, amount:127650000 }],
    additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
  {
    id: 'QUO-251502-003', quoNo: 'QUO-251502-003',
    clientName: 'PT Gojek Indonesia', clientBrand: 'Gojek', clientId: 'CLT-10003',
    contactPerson: 'Ratna Dewi', contactEmail: 'ratna.d@gojek.com',
    quoteName: 'Mobile LED Campaign - App Promotion Jakarta',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    status: 'lost', tags: [TAG_DEFS.urgent],
    subtotal: 80000000, discount: 0, totalAfterDiscount: 80000000, vat: 8800000, grandTotal: 88800000,
    validUntil: 'Mar 15, 2025', validUntilDate: new Date('2025-03-15'),
    createdDate: 'Feb 15, 2025', createdDateObj: new Date('2025-02-15'),
    convertedAt: 'Mar 1, 2025',
    products: [
      { id:'p1', product:'Mobile LED - Regular Slot 1-10 Days', category:'LED', quantity:100, unit:'spots', duration:4, durationUnit:'weeks', city:'Jakarta', ratePrice:2500000, finalPrice:2500000, campaignStart:'Feb 15, 2025', campaignEnd:'Mar 15, 2025', notes:'' },
    ],
    paymentTerms: [], additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
    lostReason: 'Price too high',
  },
  {
    id: 'QUO-251902-004', quoNo: 'QUO-251902-004',
    clientName: 'PT Unilever Indonesia', clientBrand: 'Dove', clientId: 'CLT-10004',
    contactPerson: 'Lina Kusuma', contactEmail: 'lina.k@unilever.com',
    quoteName: 'StickMob Campaign - Dove Product Launch',
    salesPerson: { id: 'USR-003', name: 'Rudi Hartono', initials: 'RH' },
    status: 'lead', tags: [TAG_DEFS.newClient, TAG_DEFS.highValue],
    subtotal: 58000000, discount: 3000000, totalAfterDiscount: 55000000, vat: 6050000, grandTotal: 61050000,
    validUntil: 'Apr 1, 2025', validUntilDate: new Date('2025-04-01'),
    createdDate: 'Feb 19, 2025', createdDateObj: new Date('2025-02-19'),
    products: [
      { id:'p1', product:'StickMob - Back Window & Panel', category:'StickMob', quantity:40, unit:'spots', duration:2, durationUnit:'months', city:'Jakarta', ratePrice:7500000, finalPrice:7000000, campaignStart:'Mar 1, 2025', campaignEnd:'Apr 30, 2025', notes:'' },
    ],
    paymentTerms: [
      { id:'pt1', name:'Initial Payment', percentage:50, milestone:'After Quotation Signed', dueDays:7,  amount:30525000 },
      { id:'pt2', name:'Final Payment',   percentage:50, milestone:'End of Campaign',        dueDays:14, amount:30525000 },
    ],
    additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
  {
    id: 'QUO-252102-005', quoNo: 'QUO-252102-005',
    clientName: 'PT Astra Toyota', clientBrand: 'Toyota', clientId: 'CLT-10005',
    contactPerson: 'Bambang Irawan', contactEmail: 'bambang.i@astra.co.id',
    quoteName: 'Full-Back Advertising - New Model Launch Campaign',
    salesPerson: { id: 'USR-004', name: 'Siti Rahayu', initials: 'SR' },
    status: 'draft', tags: [TAG_DEFS.corporate],
    subtotal: 90000000, discount: 0, totalAfterDiscount: 90000000, vat: 9900000, grandTotal: 99900000,
    validUntil: 'Mar 25, 2025', validUntilDate: new Date('2025-03-25'),
    createdDate: 'Feb 21, 2025', createdDateObj: new Date('2025-02-21'),
    products: [
      { id:'p1', product:'StickMob - Full-Back', category:'StickMob', quantity:60, unit:'spots', duration:2, durationUnit:'months', city:'Jakarta', ratePrice:8000000, finalPrice:8000000, campaignStart:'Mar 1, 2025', campaignEnd:'Apr 30, 2025', notes:'' },
    ],
    paymentTerms: [], additionalNotes:'', cancellationPolicy:'', termsAndConditions:'',
  },
];