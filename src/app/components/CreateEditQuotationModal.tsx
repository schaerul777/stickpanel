import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, Plus, Trash2, Copy, ChevronLeft, ChevronDown, Check,
  AlertTriangle, Save, FileText, Printer, Info, Lock,
} from 'lucide-react';
import type { Quotation, ProductLineItem, PaymentTerm, QuotationTag, QuotationStatus } from '../pages/quotation-data';
import {
  MASTER_PRODUCTS, SALES_PERSONS_LIST, CITIES, MILESTONE_OPTIONS,
  STATUS_CONFIG, formatIDR,
} from '../pages/quotation-data';

interface Props {
  quo: Quotation | null;
  onSave: (data: Quotation) => void;
  onClose: () => void;
}

// Defined inline — no import dependency at module scope to avoid TDZ issues
const ALL_TAGS: QuotationTag[] = [
  { label: 'Urgent',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  { label: 'High Value', color: '#CA8A04', bg: 'rgba(202,138,4,0.1)'   },
  { label: 'Renewal',    color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  { label: 'New Client', color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  { label: 'Corporate',  color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  { label: 'SME',        color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
];

const DUE_DAYS_OPTIONS = [0, 3, 7, 14, 21, 30, 45, 60, 90];
const VAT_RATE = 0.11;

const PAYMENT_DESCRIPTION_OPTIONS = [
  'Initial Payment',
  'Down Payment',
  'Progress Payment',
  'Completion Payment',
  'Final Payment',
  'Full Payment',
];

const UNIT_OPTIONS = ['spots', 'items', 'units'];

// Typed outside JSX to avoid inline TypeScript `as` assertions inside TSX expressions
const STATUS_PREVIEW_ROWS: Array<{ action: string; s: 'draft' | 'lead' }> = [
  { action: 'Save as Draft', s: 'draft' },
  { action: 'Save Quotation', s: 'lead' },
];

const MOCK_CLIENTS = [
  {
    id: 'CLT-10001', companyName: 'PT Kopi Kenangan Indonesia',
    brands: [
      { id: 'BRD-001-1', name: 'Kenangan Coffee' },
      { id: 'BRD-001-2', name: 'Kenangan Gold' },
      { id: 'BRD-001-3', name: 'Kenangan Signature' },
    ],
    contacts: [
      { name: 'Sarah Johnson', email: 'sarah.j@kenangan.co.id',  role: 'Marketing Manager'    },
      { name: 'Budi Santoso',  email: 'budi.s@kenangan.co.id',   role: 'Finance Manager'       },
      { name: 'Rina Marlina',  email: 'rina.m@kenangan.co.id',   role: 'Campaign Coordinator'  },
    ],
  },
  {
    id: 'CLT-10002', companyName: 'PT Tokopedia Indonesia',
    brands: [
      { id: 'BRD-002-1', name: 'Tokopedia'     },
      { id: 'BRD-002-2', name: 'GoTo Financial' },
    ],
    contacts: [
      { name: 'Budi Santoso', email: 'budi.santoso@tokopedia.com', role: 'Partnership Manager' },
      { name: 'Clara Tan',    email: 'clara.tan@tokopedia.com',    role: 'Marketing Lead'      },
    ],
  },
  {
    id: 'CLT-10003', companyName: 'PT Gojek Indonesia',
    brands: [
      { id: 'BRD-003-1', name: 'Gojek'  },
      { id: 'BRD-003-2', name: 'GoFood' },
      { id: 'BRD-003-3', name: 'GoPay'  },
    ],
    contacts: [
      { name: 'Kevin Lauw',  email: 'kevin.l@gojek.com',  role: 'Partnership Director' },
      { name: 'Ratna Dewi',  email: 'ratna.d@gojek.com',  role: 'Brand Manager'        },
    ],
  },
  {
    id: 'CLT-10004', companyName: 'PT Unilever Indonesia',
    brands: [
      { id: 'BRD-004-1', name: 'Dove'     },
      { id: 'BRD-004-2', name: 'Lifebuoy' },
      { id: 'BRD-004-3', name: 'Sunsilk'  },
      { id: 'BRD-004-4', name: 'Rexona'   },
    ],
    contacts: [
      { name: 'Lina Kusuma',   email: 'lina.k@unilever.com',  role: 'Campaign Lead'  },
      { name: 'Maria Susanti', email: 'maria.s@unilever.com', role: 'Brand Manager'  },
    ],
  },
  {
    id: 'CLT-10005', companyName: 'PT Astra International',
    brands: [
      { id: 'BRD-005-1', name: 'Toyota'   },
      { id: 'BRD-005-2', name: 'Daihatsu' },
    ],
    contacts: [
      { name: 'Bambang Irawan', email: 'bambang.i@astra.co.id', role: 'Marketing Manager'  },
      { name: 'Robert Halim',   email: 'robert.h@astra.co.id',  role: 'Marketing Director' },
    ],
  },
  {
    id: 'CLT-10006', companyName: 'PT Bank Central Asia',
    brands: [
      { id: 'BRD-006-1', name: 'BCA'         },
      { id: 'BRD-006-2', name: 'BCA Digital' },
      { id: 'BRD-006-3', name: 'Blu by BCA'  },
    ],
    contacts: [
      { name: 'Anwar Prasetyo', email: 'anwar.p@bca.co.id', role: 'Digital Marketing Head' },
      { name: 'Bella Oktavia',  email: 'bella.o@bca.co.id', role: 'Campaign Manager'        },
    ],
  },
];

const emptyProduct = (): ProductLineItem => ({
  id: `p${Date.now()}`, product:'', category:'', quantity:1, unit:'spots',
  duration:1, durationUnit:'months', city:'Jakarta', ratePrice:0, finalPrice:0,
  campaignStart:'', campaignEnd:'', notes:'',
});

const emptyPaymentTerm = (): PaymentTerm => ({
  id: `pt${Date.now()}`, name:'', percentage:100, milestone:'After Quotation Signed', dueDays:7, amount:0,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function formattedIDR(v: number): string {
  if (!v) return '';
  return v.toLocaleString('id-ID');
}

function parseIDR(s: string): number {
  return parseInt(s.replace(/\./g, '').replace(/,/g, '').replace(/[^0-9]/g, '')) || 0;
}

function SalesAvatar({ initials, size=24 }: { initials:string; size?:number }) {
  const colors = ['#7C3AED','#2563EB','#16A34A','#EA580C','#DB2777','#0D9488'];
  const bg = colors[initials.charCodeAt(0)%colors.length];
  return <div style={{ width:size, height:size, borderRadius:'50%', backgroundColor:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'10px', fontWeight:700, flexShrink:0 }}>{initials}</div>;
}

// ── Input Atoms ────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)',
  backgroundColor:'var(--color-input-background)', color:'var(--color-foreground)',
  fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', outline:'none', boxSizing:'border-box',
};

/* ── Reusable styled select wrapper ─────────────────────────────────────────── */
function StyledSelect({ value, onChange, children, style }: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          ...inputStyle,
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingRight: '36px',
          cursor: 'pointer',
          ...style,
        }}
      >
        {children}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700,
  color:'var(--color-foreground)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em',
};

const sectionCard: React.CSSProperties = {
  backgroundColor:'var(--color-card)', borderRadius:'var(--radius-lg)', border:'1px solid var(--color-border)',
  marginBottom:20, overflow:'hidden',
};

const sectionHead: React.CSSProperties = {
  padding:'14px 20px', borderBottom:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)',
  display:'flex', alignItems:'center', justifyContent:'space-between',
};

// ── Tag Selector ───────────────────────────────────────────────────────────────

function TagSelector({ selected, onChange }: { selected:QuotationTag[]; onChange:(t:QuotationTag[])=>void }) {
  const toggle = (tag:QuotationTag) => {
    const exists = selected.find(t=>t.label===tag.label);
    onChange(exists ? selected.filter(t=>t.label!==tag.label) : [...selected, tag]);
  };
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {ALL_TAGS.map(tag=>{
        const active = !!selected.find(t=>t.label===tag.label);
        return (
          <button key={tag.label} onClick={()=>toggle(tag)} type="button"
            style={{ padding:'4px 10px', borderRadius:'999px', border: active?'none':'1px solid var(--color-border)', backgroundColor: active?tag.bg:'transparent', color: active?tag.color:'var(--color-muted-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight: active?700:400, cursor:'pointer', display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}>
            {active&&<Check size={10}/>} {tag.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Product Row ───────────────────────────────────────────────────���────────────

function ProductRow({ item, idx, onChange, onRemove, onDuplicate, grandTotal }:{
  item:ProductLineItem; idx:number;
  onChange:(id:string,field:string,val:any)=>void;
  onRemove:(id:string)=>void;
  onDuplicate:(id:string)=>void;
  grandTotal:number;
}) {
  const subtotal = item.quantity * item.finalPrice * item.duration;
  const discPct = item.finalPrice < item.ratePrice && item.ratePrice > 0
    ? Math.round((1-item.finalPrice/item.ratePrice)*100) : 0;

  const setField = (field:string, val:any) => onChange(item.id, field, val);

  const selectProduct = (name:string) => {
    const mp = MASTER_PRODUCTS.find(p=>p.name===name);
    if(mp) {
      onChange(item.id, 'product', name);
      onChange(item.id, 'category', mp.category);
      onChange(item.id, 'unit', mp.unit);
      onChange(item.id, 'ratePrice', mp.defaultRate);
      onChange(item.id, 'finalPrice', mp.defaultRate);
    } else {
      onChange(item.id, 'product', name);
    }
  };

  const rowBg = idx%2===0 ? 'var(--color-card)' : 'var(--color-secondary)';

  return (
    <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:10, backgroundColor:rowBg }}>
      {/* Row header */}
      <div style={{ padding:'10px 14px', backgroundColor:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Product {idx+1}</span>
        <div style={{ display:'flex', gap:6 }}>
          <button type="button" onClick={()=>onDuplicate(item.id)} style={{ padding:'4px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-card)', color:'var(--color-muted-foreground)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-family-geist)', fontSize:'12px' }}>
            <Copy size={11}/> Duplicate
          </button>
          <button type="button" onClick={()=>onRemove(item.id)} style={{ padding:'4px 8px', borderRadius:'var(--radius-sm)', border:'1px solid rgba(239,68,68,0.2)', backgroundColor:'rgba(239,68,68,0.05)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-family-geist)', fontSize:'12px' }}>
            <Trash2 size={11}/> Remove
          </button>
        </div>
      </div>

      {/* Row fields */}
      <div style={{ padding:'14px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        {/* Product */}
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={labelStyle}>Product <span style={{color:'#EF4444'}}>*</span></label>
          <StyledSelect value={item.product} onChange={e=>selectProduct(e.target.value)}>
            <option value="">Select a product...</option>
            {MASTER_PRODUCTS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
          </StyledSelect>
        </div>

        {/* Quantity + Unit */}
        <div>
          <label style={labelStyle}>Quantity <span style={{color:'#EF4444'}}>*</span></label>
          <div style={{ display:'flex', gap:6 }}>
            <input type="number" min="1" value={item.quantity} onChange={e=>setField('quantity',parseInt(e.target.value)||1)} style={{...inputStyle, width:80, flex:'none'}}/>
            <StyledSelect value={item.unit||'spots'} onChange={e=>setField('unit',e.target.value)} style={{flex:1}}>
              {UNIT_OPTIONS.map(u=><option key={u} value={u}>{u}</option>)}
            </StyledSelect>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label style={labelStyle}>Duration <span style={{color:'#EF4444'}}>*</span></label>
          <div style={{ display:'flex', gap:6 }}>
            <input type="number" min="1" value={item.duration} onChange={e=>setField('duration',parseInt(e.target.value)||1)} style={{...inputStyle, width:70, flex:'none'}}/>
            <StyledSelect value={item.durationUnit} onChange={e=>setField('durationUnit',e.target.value)} style={{flex:1}}>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </StyledSelect>
          </div>
        </div>

        {/* City */}
        <div>
          <label style={labelStyle}>City <span style={{color:'#EF4444'}}>*</span></label>
          <StyledSelect value={item.city} onChange={e=>setField('city',e.target.value)}>
            {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
          </StyledSelect>
        </div>

        {/* Rate Price */}
        <div>
          <label style={labelStyle}>Rate Price (IDR)</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)', pointerEvents:'none' }}>Rp</span>
            <input type="text" value={formattedIDR(item.ratePrice)}
              onChange={e=>setField('ratePrice',parseIDR(e.target.value))}
              style={{...inputStyle, paddingLeft:32}}/>
          </div>
        </div>

        {/* Final Price */}
        <div>
          <label style={labelStyle}>Final Price (IDR)</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)', pointerEvents:'none' }}>Rp</span>
            <input type="text" value={formattedIDR(item.finalPrice)}
              onChange={e=>setField('finalPrice',parseIDR(e.target.value))}
              style={{...inputStyle, paddingLeft:32}}/>
          </div>
          {discPct>0&&<div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'#F59E0B', marginTop:3 }}>{discPct}% discount applied</div>}
        </div>

        {/* Campaign Period */}
        <div>
          <label style={labelStyle}>Campaign Start <span style={{color:'#EF4444'}}>*</span></label>
          <input type="date" value={item.campaignStart} onChange={e=>setField('campaignStart',e.target.value)} style={{...inputStyle}}/>
        </div>
        <div>
          <label style={labelStyle}>Campaign End <span style={{color:'#EF4444'}}>*</span></label>
          <input type="date" value={item.campaignEnd} onChange={e=>setField('campaignEnd',e.target.value)} style={{...inputStyle}}/>
        </div>

        {/* Subtotal */}
        <div>
          <label style={labelStyle}>Subtotal</label>
          <div style={{ padding:'9px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'rgba(16,185,129,0.05)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981' }}>
            {formatIDR(subtotal)}
          </div>
        </div>

        {/* Notes */}
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={labelStyle}>Notes</label>
          <input type="text" value={item.notes} onChange={e=>setField('notes',e.target.value)}
            placeholder="Special instructions or remarks for this item..."
            style={{...inputStyle}}/>
        </div>
      </div>
    </div>
  );
}

// ── Payment Term Row ───────────────────────────────────────────────────────────

function PaymentTermRow({ term, idx, grandTotal, onChange, onRemove }:{
  term:PaymentTerm; idx:number; grandTotal:number;
  onChange:(id:string,field:string,val:any)=>void;
  onRemove:(id:string)=>void;
}) {
  const amount = Math.round(grandTotal * (term.percentage/100));
  const setField = (field:string, val:any) => onChange(term.id, field, val);
  return (
    <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:10 }}>
      <div style={{ padding:'9px 14px', backgroundColor:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Payment Term {idx+1}</span>
        <button type="button" onClick={()=>onRemove(term.id)} style={{ padding:'3px 8px', borderRadius:'var(--radius-sm)', border:'1px solid rgba(239,68,68,0.2)', backgroundColor:'rgba(239,68,68,0.05)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-family-geist)', fontSize:'12px' }}>
          <Trash2 size={11}/> Remove
        </button>
      </div>
      <div style={{ padding:'14px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:10 }}>
        <div style={{ gridColumn:'1 / 3' }}>
          <label style={labelStyle}>Description</label>
          <StyledSelect value={term.name} onChange={e=>setField('name',e.target.value)}>
            <option value="">Select a description...</option>
            {PAYMENT_DESCRIPTION_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}
          </StyledSelect>
        </div>
        <div>
          <label style={labelStyle}>Percentage <span style={{color:'#EF4444'}}>*</span></label>
          <div style={{ position:'relative' }}>
            <input type="number" min="0" max="100" value={term.percentage} onChange={e=>setField('percentage',Math.min(100,Math.max(0,parseInt(e.target.value)||0)))} style={{...inputStyle, paddingRight:24}}/>
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)' }}>%</span>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Due Days</label>
          <StyledSelect value={term.dueDays} onChange={e=>setField('dueDays',parseInt(e.target.value))}>
            {DUE_DAYS_OPTIONS.map(d=><option key={d} value={d}>{d} days</option>)}
          </StyledSelect>
        </div>
        <div>
          <label style={labelStyle}>Amount</label>
          <div style={{ padding:'9px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'rgba(16,185,129,0.05)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981' }}>
            {formatIDR(amount)}
          </div>
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={labelStyle}>Milestone <span style={{color:'#EF4444'}}>*</span></label>
          <StyledSelect value={term.milestone} onChange={e=>setField('milestone',e.target.value)}>
            {MILESTONE_OPTIONS.map(m=><option key={m} value={m}>{m}</option>)}
          </StyledSelect>
        </div>
      </div>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────────────────

export function CreateEditQuotationModal({ quo, onSave, onClose }: Props) {
  const isEdit = !!quo;

  // Basic Info
  const [clientId,       setClientId]       = useState(quo?.clientId       || '');
  const [brandId,        setBrandId]        = useState(quo?.brandId        || '');
  const [contactPerson,  setContactPerson]  = useState(quo?.contactPerson  || '');
  const [contactEmail,   setContactEmail]   = useState(quo?.contactEmail   || '');
  const [salesPersonId,  setSalesPersonId]  = useState(quo?.salesPerson.id || SALES_PERSONS_LIST[0].id);
  const [quoteName,      setQuoteName]      = useState(quo?.quoteName      || '');
  const [status,         setStatus]         = useState<QuotationStatus>(quo?.status || 'draft');
  const [validUntil,     setValidUntil]     = useState(quo?.validUntil     || '');
  const [tags,           setTags]           = useState<QuotationTag[]>(quo?.tags || []);

  // Products
  const [products, setProducts] = useState<ProductLineItem[]>(quo?.products?.length ? quo.products : [emptyProduct()]);

  // Pricing
  const [discountInput,  setDiscountInput]  = useState(quo ? formattedIDR(quo.discount) : '');

  // Payment Terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(quo?.paymentTerms?.length ? quo.paymentTerms : [emptyPaymentTerm()]);

  // Terms text
  const [addNotes,   setAddNotes]   = useState(quo?.additionalNotes    || '');
  const [cancelPol,  setCancelPol]  = useState(quo?.cancellationPolicy || '');
  const [termsText,  setTermsText]  = useState(quo?.termsAndConditions || '');

  // UI state
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedClient = MOCK_CLIENTS.find(c=>c.id===clientId);
  const selectedBrand  = selectedClient?.brands.find(b=>b.id===brandId);
  const selectedSales  = SALES_PERSONS_LIST.find(s=>s.id===salesPersonId) || SALES_PERSONS_LIST[0];

  // Calculated values
  const subtotal = products.reduce((s,p)=>s + p.quantity*p.finalPrice*p.duration, 0);
  const discount = parseIDR(discountInput);
  const totalAfterDiscount = Math.max(0, subtotal - discount);
  const vat = Math.round(totalAfterDiscount * VAT_RATE);
  const grandTotal = totalAfterDiscount + vat;

  const ptTotal = paymentTerms.reduce((s,t)=>s+t.percentage,0);
  const ptValid = ptTotal===100 || paymentTerms.length===0;

  // Product handlers
  const updateProduct = useCallback((id:string, field:string, val:any) => {
    setProducts(p=>p.map(pr=>pr.id===id?{...pr,[field]:val}:pr));
  },[]);
  const removeProduct = (id:string) => setProducts(p=>p.filter(pr=>pr.id!==id));
  const duplicateProduct = (id:string) => {
    const orig = products.find(p=>p.id===id);
    if(orig) setProducts(p=>[...p,{...orig,id:`p${Date.now()}`}]);
  };
  const addProduct = () => setProducts(p=>[...p,emptyProduct()]);

  // Payment term handlers
  const updateTerm = useCallback((id:string, field:string, val:any) => {
    setPaymentTerms(p=>p.map(t=>t.id===id?{...t,[field]:val}:t));
  },[]);
  const removeTerm = (id:string) => setPaymentTerms(p=>p.filter(t=>t.id!==id));
  const addTerm = () => setPaymentTerms(p=>[...p,emptyPaymentTerm()]);

  // Client change — resets brand + contact
  const handleClientChange = (id:string) => {
    setClientId(id);
    setBrandId('');
    setContactPerson('');
    setContactEmail('');
  };

  // Brand change — optionally sets first contact
  const handleBrandChange = (id:string) => {
    setBrandId(id);
  };

  const validate = () => {
    const errs: string[] = [];
    if(!clientId)    errs.push('Client is required');
    if(!brandId)     errs.push('Brand is required');
    if(!quoteName)   errs.push('Quotation name is required');
    if(!validUntil)  errs.push('Valid until date is required');
    if(products.some(p=>!p.product)) errs.push('All products must be selected');
    if(!ptValid) errs.push(`Payment terms total is ${ptTotal}% — must equal 100%`);
    return errs;
  };

  const handleSave = (saveStatus: QuotationStatus = 'lead') => {
    const errs = validate();
    if(errs.length) { setErrors(errs); return; }
    setSaving(true);
    const client = MOCK_CLIENTS.find(c=>c.id===clientId);
    const vDate = new Date(validUntil || new Date());
    // Preserve terminal statuses on edit — only draft/lead can transition via save actions
    const finalStatus: QuotationStatus =
      isEdit && (quo.status === 'won' || quo.status === 'lost' || quo.status === 'expired')
        ? quo.status
        : saveStatus;
    const newQuo: Quotation = {
      id:   quo?.id   || `QUO-2025-${String(Math.floor(Math.random()*90000)+10000)}`,
      quoNo:quo?.quoNo|| `QUO-2025-${String(Math.floor(Math.random()*90000)+10000)}`,
      clientName: client?.companyName || '',
      clientBrand: selectedBrand?.name || '',
      clientId,
      brandId,
      contactPerson, contactEmail,
      quoteName,
      salesPerson: selectedSales,
      status: finalStatus,
      tags,
      subtotal, discount, totalAfterDiscount, vat, grandTotal,
      validUntil: vDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      validUntilDate: vDate,
      createdDate: quo?.createdDate || new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      createdDateObj: quo?.createdDateObj || new Date(),
      products,
      paymentTerms: paymentTerms.map(pt=>({...pt,amount:Math.round(grandTotal*(pt.percentage/100))})),
      additionalNotes: addNotes,
      cancellationPolicy: cancelPol,
      termsAndConditions: termsText,
    };
    setTimeout(()=>{ onSave(newQuo); setSaving(false); },400);
  };

  const handleSaveDraft = () => handleSave('draft');
  const handleSavePrint = () => handleSave('lead');

  const sectionHeadTitle = (title:string, badge?:React.ReactNode) => (
    <div style={sectionHead}>
      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'var(--color-foreground)' }}>{title}</span>
      {badge}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div key="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{ position:'fixed', inset:0, zIndex:9990, backgroundColor:'var(--color-background)', display:'flex', flexDirection:'column' }}>

        {/* ── Sticky Top Bar ── */}
        <div style={{ flexShrink:0, padding:'14px 32px', borderBottom:'1px solid var(--color-border)', backgroundColor:'var(--color-card)', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:1 }}>
          {/* Breadcrumb + Title */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, border:'none', background:'none', cursor:'pointer', color:'var(--color-muted-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', padding:0 }}>
              <ChevronLeft size={14}/> Quotations
            </button>
            <span style={{ color:'var(--color-muted-foreground)' }}>/</span>
            <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, color:'var(--color-foreground)' }}>
              {isEdit ? `Edit ${quo.quoNo}` : 'Create New Quotation'}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {saving&&<span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>Saving...</span>}
            <button onClick={onClose} style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSaveDraft} style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid #7C3AED', backgroundColor:'transparent', color:'#7C3AED', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Save size={13}/> Save as Draft
            </button>
            <button onClick={handleSavePrint} style={{ padding:'8px 16px', borderRadius:'var(--radius)', border:'none', backgroundColor:'#7C3AED', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Printer size={13}/> Save Quotation
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', backgroundColor:'var(--color-secondary)' }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>

            {/* Error banner */}
            {errors.length>0&&(
              <div style={{ padding:'12px 16px', borderRadius:'var(--radius)', border:'1px solid rgba(239,68,68,0.3)', backgroundColor:'rgba(239,68,68,0.06)', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
                <AlertTriangle size={16} style={{color:'#EF4444',flexShrink:0,marginTop:1}}/>
                <div>
                  <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#EF4444', marginBottom:4 }}>{errors.length} error{errors.length>1?'s':''} found. Please fix before saving.</div>
                  {errors.map(e=><div key={e} style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'#EF4444' }}>• {e}</div>)}
                </div>
              </div>
            )}

            {/* ── Section 1: Basic Information ── */}
            <div style={sectionCard}>
              {sectionHeadTitle('Basic Information')}
              <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                {/* Quotation Number */}
                <div>
                  <label style={labelStyle}>Quotation Number</label>
                  <div style={{ padding:'9px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', fontFamily:'monospace', fontSize:'var(--text-14)', fontWeight:700, color:'var(--color-muted-foreground)' }}>
                    {isEdit ? quo.quoNo : 'Auto-generated on save'}
                  </div>
                </div>

                {/* Status — read-only, managed by system/user actions */}
                <div>
                  <label style={labelStyle}>Status</label>

                  {!isEdit ? (
                    /* New quotation: preview what each save action produces */
                    <div style={{ borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', overflow:'hidden' }}>
                      <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:6 }}>
                        <Info size={12} style={{ color:'var(--color-muted-foreground)', flexShrink:0 }}/>
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>Assigned automatically by your save action</span>
                      </div>
                      {STATUS_PREVIEW_ROWS.map((row, i) => {
                        const cfg = STATUS_CONFIG[row.s];
                        return (
                          <div key={row.s} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:i===0?'1px solid var(--color-border)':'none' }}>
                            <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>{row.action}</span>
                            <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'999px', backgroundColor:cfg.bg, border:cfg.border||'none', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                          </div>
                        );
                      })}
                    </div>

                  ) : (status === 'won' || status === 'lost' || status === 'expired') ? (
                    /* Locked terminal status */
                    <div style={{ borderRadius:'var(--radius)', border:`1px solid ${STATUS_CONFIG[status].color}40`, backgroundColor:STATUS_CONFIG[status].bg, padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:'999px', backgroundColor:STATUS_CONFIG[status].bg, border:STATUS_CONFIG[status].border||'none', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:STATUS_CONFIG[status].color }}>{STATUS_CONFIG[status].label}</span>
                        <Lock size={13} style={{ color:'var(--color-muted-foreground)' }}/>
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:5 }}>
                        <Info size={12} style={{ color:'var(--color-muted-foreground)', flexShrink:0, marginTop:1 }}/>
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)', lineHeight:1.5 }}>Status is locked and can only be changed through designated system actions.</span>
                      </div>
                    </div>

                  ) : (
                    /* Draft / Lead — transitions via save action */
                    <div style={{ borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid var(--color-border)' }}>
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>Current Status</span>
                        <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'999px', backgroundColor:STATUS_CONFIG[status].bg, border:STATUS_CONFIG[status].border||'none', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:STATUS_CONFIG[status].color }}>{STATUS_CONFIG[status].label}</span>
                      </div>
                      <div style={{ padding:'8px 12px', display:'flex', alignItems:'flex-start', gap:5 }}>
                        <Info size={12} style={{ color:'var(--color-muted-foreground)', flexShrink:0, marginTop:1 }}/>
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)', lineHeight:1.5 }}>Use "Save as Draft" to keep as Draft, or "Save Quotation" to publish as Lead.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={labelStyle}>Company <span style={{color:'#EF4444'}}>*</span></label>
                  <StyledSelect value={clientId} onChange={e=>handleClientChange(e.target.value)} style={{borderColor:errors.some(e=>e.includes('Client'))?'#EF4444':'var(--color-border)'}}>
                    <option value="">Select a company...</option>
                    {MOCK_CLIENTS.map(c=><option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </StyledSelect>
                  {selectedClient&&(
                    <div style={{ marginTop:8, padding:'10px 12px', borderRadius:'var(--radius)', border:'1px solid rgba(124,58,237,0.2)', backgroundColor:'rgba(124,58,237,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, color:'var(--color-foreground)' }}>{selectedClient.companyName}</div>
                        <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>{selectedClient.brands.length} brand{selectedClient.brands.length !== 1 ? 's' : ''} · {selectedClient.id}</div>
                      </div>
                      <button type="button" onClick={()=>{ setClientId(''); setBrandId(''); setContactPerson(''); setContactEmail(''); }} style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'#7C3AED', border:'none', background:'none', cursor:'pointer' }}>Change</button>
                    </div>
                  )}
                </div>

                {/* Brand — cascades from Company */}
                {selectedClient && (
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={labelStyle}>Brand <span style={{color:'#EF4444'}}>*</span></label>
                    <StyledSelect value={brandId} onChange={e=>handleBrandChange(e.target.value)} style={{borderColor:errors.some(e=>e.includes('Brand'))?'#EF4444':'var(--color-border)'}}>
                      <option value="">Select a brand...</option>
                      {selectedClient.brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                    </StyledSelect>
                    {selectedBrand && (
                      <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#7C3AED' }} />
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>{selectedBrand.name} · under {selectedClient.companyName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Person */}
                {selectedClient&&(
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={labelStyle}>Contact Person <span style={{color:'#EF4444'}}>*</span></label>
                    <StyledSelect value={contactPerson}
                      onChange={e=>{
                        setContactPerson(e.target.value);
                        const c=selectedClient.contacts.find(cx=>cx.name===e.target.value);
                        if(c) setContactEmail(c.email);
                      }}>
                      <option value="">Select a contact...</option>
                      {selectedClient.contacts.map(c=><option key={c.name} value={c.name}>{c.name} ({c.role}) — {c.email}</option>)}
                    </StyledSelect>
                  </div>
                )}

                {/* Sales Person */}
                <div>
                  <label style={labelStyle}>Sales Person <span style={{color:'#EF4444'}}>*</span></label>
                  <StyledSelect value={salesPersonId} onChange={e=>setSalesPersonId(e.target.value)}>
                    {SALES_PERSONS_LIST.map(s=>(
                      <option key={s.id} value={s.id}>{s.name} ({s.initials})</option>
                    ))}
                  </StyledSelect>
                  {selectedSales&&(
                    <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                      <SalesAvatar initials={selectedSales.initials} size={22}/>
                      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>{selectedSales.name}</span>
                    </div>
                  )}
                </div>

                {/* Valid Until */}
                <div>
                  <label style={labelStyle}>Valid Until <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)}
                    style={{...inputStyle, borderColor:errors.some(e=>e.includes('Valid'))?'#EF4444':'var(--color-border)'}}/>
                  <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)', marginTop:3 }}>Quotation will auto-expire after this date</div>
                </div>

                {/* Quotation Name */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={labelStyle}>Quotation Name <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="text" value={quoteName} onChange={e=>setQuoteName(e.target.value)}
                    placeholder="e.g., Q1 2025 Jakarta Campaign - Back Window Advertising"
                    style={{...inputStyle, borderColor:errors.some(e=>e.includes('name'))?'#EF4444':'var(--color-border)'}}/>
                  <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)', marginTop:3 }}>Internal name for easy identification</div>
                </div>

                {/* Tags */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={labelStyle}>Tags</label>
                  <TagSelector selected={tags} onChange={setTags}/>
                </div>
              </div>
            </div>

            {/* ── Section 2: Products ── */}
            <div style={sectionCard}>
              {sectionHeadTitle('Products & Pricing',
                <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)', fontWeight:400 }}>{products.length} product{products.length!==1?'s':''}</span>
              )}
              <div style={{ padding:'16px 20px' }}>
                {products.map((p,i)=>(
                  <ProductRow key={p.id} item={p} idx={i}
                    onChange={updateProduct}
                    onRemove={removeProduct}
                    onDuplicate={duplicateProduct}
                    grandTotal={grandTotal}
                  />
                ))}
                {products.length<50&&(
                  <button type="button" onClick={addProduct}
                    style={{ width:'100%', padding:'10px', borderRadius:'var(--radius)', border:'1px dashed var(--color-border)', backgroundColor:'transparent', color:'#7C3AED', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Plus size={14}/> Add Another Product
                  </button>
                )}
              </div>
            </div>

            {/* ── Section 3: Pricing Summary + Payment Terms ─ */}
            <div style={sectionCard}>
              {sectionHeadTitle('Financial Summary')}
              <div style={{ padding:'0 0' }}>

                {/* Pricing table */}
                <div style={{ padding:'16px 20px 0', borderBottom:'1px solid var(--color-border)' }}>
                  {[
                    { label:'Subtotal',             valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-foreground)'}}>{formatIDR(subtotal)}</span>, editable:false },
                    { label:'Discount',             valueNode:
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)', flexShrink:0 }}>Rp</span>
                        <input type="text" value={discountInput} onChange={e=>setDiscountInput(e.target.value)}
                          placeholder="0"
                          style={{ width:160, padding:'6px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-input-background)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', outline:'none' }}/>
                      </div>, editable:true },
                    { label:'Total After Discount', valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-foreground)'}}>{formatIDR(totalAfterDiscount)}</span>, editable:false },
                    { label:'VAT (11%)',             valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-muted-foreground)'}}>{formatIDR(vat)}</span>, editable:false },
                  ].map(row=>(
                    <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--color-border)' }}>
                      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{row.label}</span>
                      {row.valueNode}
                    </div>
                  ))}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0 16px' }}>
                    <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-16)', fontWeight:700, color:'var(--color-foreground)' }}>Grand Total</span>
                    <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-20)', fontWeight:700, color:'#10B981' }}>{formatIDR(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Terms */}
                <div style={{ padding:'16px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:'var(--color-foreground)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Payment Terms</span>
                    {!ptValid&&(
                      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:ptTotal>100?'#F59E0B':'#EF4444', display:'flex', alignItems:'center', gap:4 }}>
                        <AlertTriangle size={12}/> Total: {ptTotal}% (must equal 100%)
                      </span>
                    )}
                    {ptValid&&paymentTerms.length>0&&(
                      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'#10B981', display:'flex', alignItems:'center', gap:4 }}>
                        <Check size={12}/> {ptTotal}% — valid
                      </span>
                    )}
                  </div>
                  {paymentTerms.map((t,i)=>(
                    <PaymentTermRow key={t.id} term={t} idx={i} grandTotal={grandTotal} onChange={updateTerm} onRemove={removeTerm}/>
                  ))}
                  {/* Progress bar */}
                  {paymentTerms.length>0&&(
                    <div style={{ marginBottom:12 }}>
                      <div style={{ height:4, borderRadius:999, backgroundColor:'var(--color-border)', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:999, width:`${Math.min(100,ptTotal)}%`, backgroundColor:ptTotal===100?'#10B981':ptTotal>100?'#EF4444':'#F59E0B', transition:'width 0.3s' }}/>
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={addTerm}
                    style={{ width:'100%', padding:'9px', borderRadius:'var(--radius)', border:'1px dashed var(--color-border)', backgroundColor:'transparent', color:'#7C3AED', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Plus size={13}/> Add Payment Term
                  </button>
                </div>
              </div>
            </div>

            {/* ── Section 4: Terms & Additional Info ── */}
            <div style={sectionCard}>
              {sectionHeadTitle('Terms & Additional Information')}
              <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:16 }}>
                {[
                  { label:'Additional Notes', value:addNotes, setter:setAddNotes, placeholder:'Add any special notes, scope of work, deliverables, or important information for the client...' },
                  { label:'Cancellation Policy', value:cancelPol, setter:setCancelPol, placeholder:'Define cancellation terms, penalties, refund policy...' },
                  { label:'Terms and Conditions', value:termsText, setter:setTermsText, placeholder:'Standard terms and conditions, legal clauses, liability, warranties...' },
                ].map(f=>(
                  <div key={f.label}>
                    <label style={labelStyle}>{f.label}</label>
                    <textarea value={f.value} onChange={e=>f.setter(e.target.value)} rows={4} placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-input-background)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', lineHeight:1.6, resize:'vertical', outline:'none', boxSizing:'border-box' }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom spacer */}
            <div style={{ height:20 }}/>
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div style={{ flexShrink:0, padding:'14px 32px', borderTop:'1px solid var(--color-border)', backgroundColor:'var(--color-card)', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:1 }}>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSaveDraft} style={{ padding:'9px 16px', borderRadius:'var(--radius)', border:'1px solid #7C3AED', backgroundColor:'transparent', color:'#7C3AED', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Save size={13}/> Save as Draft
            </button>
          </div>
          <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>
            Grand Total: <strong style={{color:'#10B981'}}>{formatIDR(grandTotal)}</strong>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ padding:'9px 16px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <FileText size={13}/> Preview PDF
            </button>
            <button onClick={handleSavePrint}
              style={{ padding:'9px 18px', borderRadius:'var(--radius)', border:'none', backgroundColor:'#7C3AED', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Printer size={14}/> Save Quotation
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}