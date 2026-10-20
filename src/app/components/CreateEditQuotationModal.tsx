import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, Plus, Trash2, Copy, ChevronLeft, ChevronDown, Check,
  AlertTriangle, Save, FileText, Info, Lock, Upload, Image,
} from 'lucide-react';
import type { Quotation, ProductLineItem, PaymentTerm, QuotationTag, QuotationStatus, QuotationAttachment } from '../pages/quotation-data';
import {
  MASTER_PRODUCTS, SALES_PERSONS_LIST, CITIES, MILESTONE_OPTIONS,
  STATUS_CONFIG, formatIDR,
} from '../pages/quotation-data';
import { getClientsForCompany, getContactsForClient, useClientProfileData } from '../core/clientProfileStore';
import { useClientProfileUI } from '../core/clientProfileUI';
import { useMasterData } from '../core/masterStore';

interface Props {
  quo: Quotation | null;
  onSave: (data: Quotation) => void;
  onClose: () => void;
}

export interface InitialQuotationData {
  clientId: string;
  clientName: string;
  quoteName: string;
  salesPerson: { id: string; name: string; initials: string };
  includeTax: boolean;
}

// Defined inline — no import dependency at module scope to avoid TDZ issues
const TAG_COLOR = '#7C3AED';
const TAG_BG    = 'rgba(124,58,237,0.1)';

const ALL_TAGS: QuotationTag[] = [
  { label: 'Urgent',     color: TAG_COLOR, bg: TAG_BG },
  { label: 'High Value', color: TAG_COLOR, bg: TAG_BG },
  { label: 'Renewal',    color: TAG_COLOR, bg: TAG_BG },
  { label: 'New Client', color: TAG_COLOR, bg: TAG_BG },
  { label: 'Corporate',  color: TAG_COLOR, bg: TAG_BG },
  { label: 'SME',        color: TAG_COLOR, bg: TAG_BG },
];

const DUE_DAYS_OPTIONS = [0, 3, 7, 14, 21, 30, 45, 60, 90];
const VAT_RATE = 0.11;

const UNIT_OPTIONS = ['spots', 'items', 'units'];

const emptyProduct = (): ProductLineItem => ({
  id: `p${Date.now()}`, product:'', category:'', quantity:1, unit:'spots',
  duration:1, durationUnit:'months', city:'Jakarta', ratePrice:0, finalPrice:0,
  startDate:'', notes:'', description: '', discount: 0,
});

const emptyPaymentTerm = (): PaymentTerm => ({
  id: `pt${Date.now()}`, name:'', percent:100, masQuotationTermMoment_id:'After Quotation Signed', masQuotationTermDue_id:'7', amount:0,
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
  const [newTag, setNewTag] = useState('');
  const [customTags, setCustomTags] = useState<QuotationTag[]>([]);

  // Merge preset + custom tags, deduped by label
  const allAvailable = useMemo(() => {
    const merged = [...ALL_TAGS];
    for (const ct of customTags) {
      if (!merged.some(t => t.label.toLowerCase() === ct.label.toLowerCase())) merged.push(ct);
    }
    // Also include any selected tags not in the presets (e.g. from a previously saved quotation)
    for (const st of selected) {
      if (!merged.some(t => t.label.toLowerCase() === st.label.toLowerCase())) merged.push(st);
    }
    return merged;
  }, [customTags, selected]);

  const toggle = (tag:QuotationTag) => {
    const exists = selected.find(t=>t.label===tag.label);
    onChange(exists ? selected.filter(t=>t.label!==tag.label) : [...selected, tag]);
  };

  const handleAddTag = () => {
    const label = newTag.trim();
    if (!label) return;
    if (allAvailable.some(t => t.label.toLowerCase() === label.toLowerCase())) {
      // Tag already exists — just select it
      const existing = allAvailable.find(t => t.label.toLowerCase() === label.toLowerCase())!;
      if (!selected.some(t => t.label === existing.label)) {
        onChange([...selected, existing]);
      }
    } else {
      // Create new tag
      const newTagObj: QuotationTag = { label, color: TAG_COLOR, bg: TAG_BG };
      setCustomTags(prev => [...prev, newTagObj]);
      onChange([...selected, newTagObj]);
    }
    setNewTag('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {allAvailable.map(tag => {
          const active = !!selected.find(t => t.label === tag.label);
          return (
            <button key={tag.label} onClick={() => toggle(tag)} type="button"
              style={{ padding:'4px 10px', borderRadius:'999px', border: active ? 'none' : '1px solid var(--color-border)', backgroundColor: active ? tag.bg : 'transparent', color: active ? tag.color : 'var(--color-muted-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight: active ? 700 : 400, cursor:'pointer', display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}>
              {active && <Check size={10} />} {tag.label}
            </button>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <input
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a new tag and press Enter..."
          style={{ flex:1, padding:'6px 10px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-input-background)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'12px', outline:'none', boxSizing:'border-box' }}
        />
        {newTag.trim() && (
          <button type="button" onClick={handleAddTag}
            style={{ padding:'5px 10px', borderRadius:'var(--radius)', border:'none', backgroundColor:'#7C3AED', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
            <Plus size={11} /> Add
          </button>
        )}
      </div>
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

        {/* Start Date */}
        <div>
          <label style={labelStyle}>Start Date <span style={{color:'#EF4444'}}>*</span></label>
          <input type="date" value={item.startDate} onChange={e=>setField('startDate',e.target.value)} style={{...inputStyle}}/>
        </div>

        {/* Subtotal */}
        <div>
          <label style={labelStyle}>Subtotal</label>
          <div style={{ padding:'9px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'rgba(16,185,129,0.05)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981' }}>
            {formatIDR(subtotal)}
          </div>
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
  const amount = Math.round(grandTotal * (term.percent/100));
  const setField = (field:string, val:any) => onChange(term.id, field, val);
  const hideDue = term.masQuotationTermMoment_id === 'Before Installation';
  return (
    <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:10 }}>
      <div style={{ padding:'9px 14px', backgroundColor:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Payment Term {idx+1}</span>
        <button type="button" onClick={()=>onRemove(term.id)} style={{ padding:'3px 8px', borderRadius:'var(--radius-sm)', border:'1px solid rgba(239,68,68,0.2)', backgroundColor:'rgba(239,68,68,0.05)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-family-geist)', fontSize:'12px' }}>
          <Trash2 size={11}/> Remove
        </button>
      </div>
      <div style={{ padding:'14px', display:'grid', gridTemplateColumns: hideDue ? '1fr 1fr' : '1fr 1fr 1fr', gap:10 }}>
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={labelStyle}>Milestone <span style={{color:'#EF4444'}}>*</span></label>
          <StyledSelect value={term.masQuotationTermMoment_id} onChange={e=>setField('masQuotationTermMoment_id',e.target.value)}>
            {MILESTONE_OPTIONS.map(m=><option key={m} value={m}>{m}</option>)}
          </StyledSelect>
        </div>
        <div>
          <label style={labelStyle}>Percentage <span style={{color:'#EF4444'}}>*</span></label>
          <div style={{ position:'relative' }}>
            <input type="number" min="0" max="100" value={term.percent} onChange={e=>setField('percent',Math.min(100,Math.max(0,parseInt(e.target.value)||0)))} style={{...inputStyle, paddingRight:24}}/>
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)' }}>%</span>
          </div>
        </div>
        {!hideDue && (
          <div>
            <label style={labelStyle}>Due Days</label>
            <StyledSelect value={term.masQuotationTermDue_id} onChange={e=>setField('masQuotationTermDue_id',e.target.value)}>
              {DUE_DAYS_OPTIONS.map(d=><option key={d} value={d}>{d} days</option>)}
            </StyledSelect>
          </div>
        )}
        <div>
          <label style={labelStyle}>Amount</label>
          <div style={{ padding:'9px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'rgba(16,185,129,0.05)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981' }}>
            {formatIDR(amount)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Initial Quotation Modal (Step 1) ─────────────────────────────────────────

export function InitialQuotationModal({ onCreateInitial, onClose }: {
  onCreateInitial: (data: InitialQuotationData) => void;
  onClose: () => void;
}) {
  const { activeCompanyId } = useClientProfileUI();
  useClientProfileData();
  const clientsForCompany = getClientsForCompany(activeCompanyId);

  const [clientId, setClientId] = useState('');
  const [quoteName, setQuoteName] = useState('');
  const [salesPersonId, setSalesPersonId] = useState(SALES_PERSONS_LIST[0].id);
  const [includeTax, setIncludeTax] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const selectedSales = SALES_PERSONS_LIST.find(s => s.id === salesPersonId) || SALES_PERSONS_LIST[0];

  const handleCreate = () => {
    const errs: string[] = [];
    if (!clientId) errs.push('Client is required');
    if (!quoteName.trim()) errs.push('Quotation name is required');
    if (errs.length) { setErrors(errs); return; }

    const client = clientsForCompany.find(c => c.id === clientId);
    onCreateInitial({
      clientId,
      clientName: client?.name || '',
      quoteName: quoteName.trim(),
      salesPerson: selectedSales,
      includeTax,
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', width: 480, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Create Quotation</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errors.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
              <div>
                {errors.map(e => <div key={e} style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#EF4444' }}>{e}</div>)}
              </div>
            </div>
          )}

          {/* Client */}
          <div>
            <label style={labelStyle}>Client <span style={{ color: '#EF4444' }}>*</span></label>
            <StyledSelect value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select a client...</option>
              {clientsForCompany.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </StyledSelect>
          </div>

          {/* Quotation Name */}
          <div>
            <label style={labelStyle}>Quotation Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" value={quoteName} onChange={e => setQuoteName(e.target.value)}
              placeholder="e.g., Q1 2025 Jakarta Campaign"
              style={inputStyle} />
          </div>

          {/* Sales Person */}
          <div>
            <label style={labelStyle}>Sales Person <span style={{ color: '#EF4444' }}>*</span></label>
            <StyledSelect value={salesPersonId} onChange={e => setSalesPersonId(e.target.value)}>
              {SALES_PERSONS_LIST.map(s => <option key={s.id} value={s.id}>{s.name} ({s.initials})</option>)}
            </StyledSelect>
          </div>

          {/* Include Tax toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <div>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Include Tax (VAT 11%)</label>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: 2 }}>
                {includeTax ? 'VAT will be added to the total' : 'VAT excluded from total'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeTax(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                backgroundColor: includeTax ? '#7C3AED' : 'var(--color-border)',
                position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white',
                position: 'absolute', top: 3,
                left: includeTax ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleCreate} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────────────────

export function CreateEditQuotationModal({ quo, onSave, onClose }: Props) {
  const isEdit = !!quo;
  const { activeCompanyId } = useClientProfileUI();
  useClientProfileData();
  const masterData = useMasterData();
  const clientsForCompany = getClientsForCompany(activeCompanyId);

  // Basic Info
  const [clientId,       setClientId]       = useState(quo?.clientId       || '');
  const [brandId,        setBrandId]        = useState(quo?.brandId        || '');
  const [contactPerson,  setContactPerson]  = useState(quo?.contactPerson  || '');
  const [contactEmail,   setContactEmail]   = useState(quo?.contactEmail   || '');
  const [salesPersonId,  setSalesPersonId]  = useState(quo?.salesPerson.id || SALES_PERSONS_LIST[0].id);
  const [quoteName,      setQuoteName]      = useState(quo?.quoteName      || '');
  const [status,         setStatus]         = useState<QuotationStatus>(quo?.status || 'lead');
  const [validUntil,     setValidUntil]     = useState(quo?.validUntil     || '');
  const [tags,           setTags]           = useState<QuotationTag[]>(quo?.tags || []);

  // Products
  const [products, setProducts] = useState<ProductLineItem[]>(quo?.products?.length ? quo.products : [emptyProduct()]);

  // Payment Terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(quo?.paymentTerms?.length ? quo.paymentTerms : [emptyPaymentTerm()]);

  // Attachments
  const [attachments, setAttachments] = useState<QuotationAttachment[]>(quo?.attachments || []);

  // Include Tax
  const [includeTax, setIncludeTax] = useState(quo?.includeTax ?? true);

  // Terms text
  const [addNotes,   setAddNotes]   = useState(quo?.additionalNotes    || '');
  const [cancelPol,  setCancelPol]  = useState(quo?.cancellationPolicy || '');
  const [termsText,  setTermsText]  = useState(quo?.termsAndConditions || '');

  // UI state
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedClient = clientsForCompany.find(c => c.id === clientId);
  const selectedBrand  = masterData.brands.find(b => b.id === brandId);
  const clientContacts = clientId ? getContactsForClient(clientId) : [];
  const selectedSales  = SALES_PERSONS_LIST.find(s=>s.id===salesPersonId) || SALES_PERSONS_LIST[0];

  // Calculated values
  const subtotalRate = products.reduce((s,p)=>s + p.quantity*p.ratePrice*p.duration, 0);
  const subtotal = products.reduce((s,p)=>s + p.quantity*p.finalPrice*p.duration, 0);
  const discount = subtotalRate - subtotal;
  const totalAfterDiscount = subtotal;
  const vat = includeTax ? Math.round(totalAfterDiscount * VAT_RATE) : 0;
  const grandTotal = totalAfterDiscount + vat;

  const ptTotal = paymentTerms.reduce((s,t)=>s+t.percent,0);
  const ptValid = ptTotal===100 || paymentTerms.length===0;

  // Product handlers
  const updateProduct = useCallback((id:string, field:string, val:any) => {
    setProducts(p=>p.map(pr=>pr.id===id?{...pr,[field]:val}:pr));
  },[]);
  const removeProduct = (id:string) => setProducts(p => p.filter(pr => pr.id !== id));
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

  const handleSave = () => {
    const errs = validate();
    if(errs.length) { setErrors(errs); return; }
    setSaving(true);
    const client = clientsForCompany.find(c => c.id === clientId);
    const vDate = new Date(validUntil || new Date());
    // Preserve terminal statuses on edit — signed/salesOrder can only be changed via system actions
    const ptTotal = paymentTerms.reduce((s,t)=>s+t.percent,0);
    const autoStatus: QuotationStatus =
      products.length > 0 && products.every(p => p.product) && ptTotal === 100 ? 'filled' : 'lead';
    const finalStatus: QuotationStatus =
      isEdit && (quo.status === 'signed' || quo.status === 'salesOrder')
        ? quo.status
        : autoStatus;
    const newQuo: Quotation = {
      id:   quo?.id   || `QUO-2025-${String(Math.floor(Math.random()*90000)+10000)}`,
      quotationNumber:quo?.quotationNumber|| `QUO-2025-${String(Math.floor(Math.random()*90000)+10000)}`,
      quotationNumberRev: quo?.quotationNumberRev || '',
      masCompany_id: activeCompanyId,
      setClientProfile_id: clientId,
      setClientContact_id: quo?.setClientContact_id || '',
      setClientBilling_id: quo?.setClientBilling_id || '',
      masBrand_id: quo?.masBrand_id || '',
      clientName: client?.name || '',
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
      image: quo?.image || null,
      appToDate: quo?.appToDate || null,
      cancelledAt: quo?.cancelledAt || null,
      products,
      paymentTerms: paymentTerms.map(pt=>({...pt,amount:Math.round(grandTotal*(pt.percent/100))})),
      attachments,
      additionalNotes: addNotes,
      cancellationPolicy: cancelPol,
      termsAndConditions: termsText,
      includeTax,
    };
    setTimeout(()=>{ onSave(newQuo); setSaving(false); },400);
  };


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
              {isEdit ? `Edit ${quo.quotationNumber}` : 'Create New Quotation'}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {saving&&<span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>Saving...</span>}
            <button onClick={onClose} style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding:'8px 16px', borderRadius:'var(--radius)', border:'none', backgroundColor:'#7C3AED', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Save size={13}/> Save Quotation
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
                    {isEdit ? quo.quotationNumber : 'Auto-generated on save'}
                  </div>
                </div>

                {/* Status — read-only, managed by system/user actions */}
                <div>
                  <label style={labelStyle}>Status</label>

                  {(isEdit && (status === 'signed' || status === 'salesOrder')) ? (
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
                    /* Auto-determined Lead / Filled */
                    <div style={{ borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', overflow:'hidden' }}>
                      {isEdit && (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid var(--color-border)' }}>
                          <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>Current Status</span>
                          <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'999px', backgroundColor:STATUS_CONFIG[status].bg, border:STATUS_CONFIG[status].border||'none', fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:STATUS_CONFIG[status].color }}>{STATUS_CONFIG[status].label}</span>
                        </div>
                      )}
                      <div style={{ padding:'8px 12px', display:'flex', alignItems:'flex-start', gap:5 }}>
                        <Info size={12} style={{ color:'var(--color-muted-foreground)', flexShrink:0, marginTop:1 }}/>
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)', lineHeight:1.5 }}>Status is set automatically: <strong>Filled</strong> when all products are selected and payment terms total 100%, otherwise <strong>Lead</strong>.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={labelStyle}>Client <span style={{color:'#EF4444'}}>*</span></label>
                  <StyledSelect value={clientId} onChange={e=>handleClientChange(e.target.value)} style={{borderColor:errors.some(e=>e.includes('Client'))?'#EF4444':'var(--color-border)'}}>
                    <option value="">Select a client...</option>
                    {clientsForCompany.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </StyledSelect>
                </div>

                {/* Brand — cascades from Client */}
                {selectedClient && (
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={labelStyle}>Brand <span style={{color:'#EF4444'}}>*</span></label>
                    <StyledSelect value={brandId} onChange={e=>handleBrandChange(e.target.value)} style={{borderColor:errors.some(e=>e.includes('Brand'))?'#EF4444':'var(--color-border)'}}>
                      <option value="">Select a brand...</option>
                      {masterData.brands.filter(b => !b.deletedAt).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                    </StyledSelect>
                    {selectedBrand && (
                      <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#7C3AED' }} />
                        <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>{selectedBrand.name}</span>
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
                        const c=clientContacts.find(cx=>cx.name===e.target.value);
                        if(c) setContactEmail(c.email);
                      }}>
                      <option value="">Select a contact...</option>
                      {clientContacts.map(c=><option key={c.id} value={c.name}>{c.name} ({c.position}) — {c.email}</option>)}
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

                {/* Include Tax toggle */}
                <div style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0' }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom:0 }}>Include Tax (VAT 11%)</label>
                    <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)', marginTop:2 }}>
                      {includeTax ? 'VAT will be added to the total' : 'VAT excluded from total'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeTax(v => !v)}
                    style={{
                      width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
                      backgroundColor: includeTax ? '#7C3AED' : 'var(--color-border)',
                      position:'relative', transition:'background-color 0.2s', flexShrink:0,
                    }}
                  >
                    <div style={{
                      width:18, height:18, borderRadius:'50%', backgroundColor:'white',
                      position:'absolute', top:3,
                      left: includeTax ? 23 : 3,
                      transition:'left 0.2s',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.15)',
                    }} />
                  </button>
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
                    { label:'Subtotal',             valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-foreground)'}}>{formatIDR(subtotalRate)}</span>, editable:false },
                    { label:'Discount',             valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:discount>0?'#F59E0B':'var(--color-muted-foreground)'}}>{discount>0?`− ${formatIDR(discount)}`:'Rp 0'}</span>, editable:false },
                    { label:'Total After Discount', valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-foreground)'}}>{formatIDR(totalAfterDiscount)}</span>, editable:false },
                    { label: includeTax ? 'VAT (11%)' : 'VAT (excluded)', valueNode:<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-muted-foreground)'}}>{formatIDR(vat)}</span>, editable:false },
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

            {/* ── Section 5: Attachments ── */}
            <div style={sectionCard}>
              {sectionHeadTitle('Attachments', <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)' }}>JPG, PNG, PDF only</span>)}
              <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>
                {/* Drop zone / upload button */}
                <label style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'24px 16px', borderRadius:'var(--radius)', border:'2px dashed var(--color-border)',
                  backgroundColor:'var(--color-secondary)', cursor:'pointer', transition:'border-color 0.15s',
                }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#7C3AED'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    const files = Array.from(e.dataTransfer.files).filter(f =>
                      ['image/jpeg','image/png','application/pdf'].includes(f.type)
                    );
                    const newAttachments: QuotationAttachment[] = files.map(f => ({
                      id: `att-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                      name: f.name, size: f.size, type: f.type,
                    }));
                    setAttachments(prev => [...prev, ...newAttachments]);
                  }}
                >
                  <Upload size={20} style={{ color:'var(--color-muted-foreground)' }} />
                  <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)' }}>
                    Drag & drop files here, or <span style={{ color:'#7C3AED', fontWeight:600 }}>browse</span>
                  </span>
                  <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)' }}>
                    Accepted: JPG, PNG, PDF
                  </span>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" multiple
                    style={{ display:'none' }}
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      const newAttachments: QuotationAttachment[] = files.map(f => ({
                        id: `att-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                        name: f.name, size: f.size, type: f.type,
                      }));
                      setAttachments(prev => [...prev, ...newAttachments]);
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* Attachment list */}
                {attachments.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {attachments.map(att => {
                      const isImage = att.type.startsWith('image/');
                      const sizeStr = att.size < 1024*1024
                        ? `${(att.size/1024).toFixed(1)} KB`
                        : `${(att.size/(1024*1024)).toFixed(1)} MB`;
                      return (
                        <div key={att.id} style={{
                          display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                          borderRadius:'var(--radius)', border:'1px solid var(--color-border)',
                          backgroundColor:'var(--color-card)',
                        }}>
                          <div style={{
                            width:32, height:32, borderRadius:'var(--radius-sm)',
                            backgroundColor: isImage ? 'rgba(37,99,235,0.1)' : 'rgba(239,68,68,0.1)',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                          }}>
                            {isImage
                              ? <Image size={14} style={{ color:'#2563EB' }} />
                              : <FileText size={14} style={{ color:'#EF4444' }} />
                            }
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, color:'var(--color-foreground)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{att.name}</div>
                            <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)' }}>{sizeStr}</div>
                          </div>
                          <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                            style={{ width:28, height:28, borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border)', backgroundColor:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-muted-foreground)', flexShrink:0 }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted-foreground)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
          </div>
          <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>
            Grand Total: <strong style={{color:'#10B981'}}>{formatIDR(grandTotal)}</strong>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ padding:'9px 16px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <FileText size={13}/> Preview PDF
            </button>
            <button onClick={handleSave}
              style={{ padding:'9px 18px', borderRadius:'var(--radius)', border:'none', backgroundColor:'#7C3AED', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Save size={14}/> Save Quotation
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}