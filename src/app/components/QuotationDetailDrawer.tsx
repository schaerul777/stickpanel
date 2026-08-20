import { useState, useRef, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, Copy, Check, Send, Edit, Download, ChevronLeft,
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle,
  Clock, FileText, Package, Users,
} from 'lucide-react';
import type { Quotation, QuotationStatus } from '../pages/quotation-data';
import { STATUS_CONFIG, formatIDR, getExpiryInfo } from '../pages/quotation-data';

interface Props {
  open: boolean;
  quo: Quotation | null;
  onClose: () => void;
  onEdit: (q: Quotation) => void;
  onSend: (q: Quotation) => void;
  onConvert: (q: Quotation) => void;
  onMarkLost: (q: Quotation) => void;
  onDuplicate: (q: Quotation) => void;
}

const TABS = [
  { key:'overview',  label:'Overview'           },
  { key:'products',  label:'Products & Pricing'  },
  { key:'terms',     label:'Terms & Conditions'  },
  { key:'activity',  label:'Activity Timeline'   },
];

const MOCK_ACTIVITY = [
  { action:'Quotation created',       actor:'Ahmad Rahman', time:'Feb 20, 2025 · 3:00 PM', detail:'Created with status: Lead' },
  { action:'Quotation edited',        actor:'Ahmad Rahman', time:'Feb 20, 2025 · 4:15 PM', detail:'Updated discount to Rp 2,000,000' },
  { action:'Quotation sent to client',actor:'Ahmad Rahman', time:'Feb 21, 2025 · 2:30 PM', detail:'Sent to sarah.j@kenangan.co.id' },
];

function SalesAvatar({ initials, size=32 }: { initials:string; size?:number }) {
  const colors = ['#7C3AED','#2563EB','#16A34A','#EA580C','#DB2777','#0D9488'];
  const bg = colors[initials.charCodeAt(0)%colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', backgroundColor:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'var(--font-family-geist)', fontSize:size>30?'13px':'10px', fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function InfoRow({ label, value }: { label:string; value:React.ReactNode }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:8, alignItems:'start', padding:'9px 0', borderBottom:'1px solid var(--color-border)' }}>
      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:600, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.05em', paddingTop:1 }}>{label}</span>
      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children:React.ReactNode }) {
  return <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'20px 0 8px' }}>{children}</div>;
}

function QStatusBadge({ status }: { status:QuotationStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:'999px', backgroundColor:s.bg, border:s.border||'none' }}>
      {status!=='draft'&&<span style={{ width:7, height:7, borderRadius:'50%', backgroundColor:s.color, flexShrink:0 }}/>}
      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:s.color }}>{s.label}</span>
    </span>
  );
}

function QTagBadge({ tag }: { tag:{label:string;color:string;bg:string} }) {
  return <span style={{ display:'inline-flex', padding:'2px 7px', borderRadius:'999px', backgroundColor:tag.bg, fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:600, color:tag.color }}>{tag.label}</span>;
}

// ── Tab: Overview ──────────────────────────────────────────────────────────────

function TabOverview({ quo }: { quo:Quotation }) {
  const expiry = getExpiryInfo(quo.validUntilDate);
  return (
    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
      {/* Client Card */}
      <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', backgroundColor:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:6 }}>
          <Users size={12} style={{color:'var(--color-muted-foreground)'}}/>
          <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Client Information</span>
        </div>
        <div style={{ padding:'14px' }}>
          <InfoRow label="Company"    value={<strong style={{fontFamily:'var(--font-family-geist)'}}>{quo.clientName}</strong>}/>
          <InfoRow label="Brand"      value={quo.clientBrand}/>
          <InfoRow label="Contact"    value={<span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)',color:'var(--color-foreground)'}}>{quo.contactPerson} — <a href={`mailto:${quo.contactEmail}`} style={{color:'#2563EB',textDecoration:'none'}}>{quo.contactEmail}</a></span>}/>
        </div>
      </div>

      {/* Quotation Details Card */}
      <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', backgroundColor:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:6 }}>
          <FileText size={12} style={{color:'var(--color-muted-foreground)'}}/>
          <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Quotation Details</span>
        </div>
        <div style={{ padding:'14px' }}>
          <InfoRow label="Name"       value={quo.quoteName}/>
          <InfoRow label="Status"     value={<QStatusBadge status={quo.status}/>}/>
          <InfoRow label="Sales Person" value={
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <SalesAvatar initials={quo.salesPerson.initials} size={26}/>
              <span style={{fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)'}}>{quo.salesPerson.name}</span>
            </div>
          }/>
          <InfoRow label="Valid Until" value={<span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:expiry.color, display:'flex', alignItems:'center', gap:5 }}>{expiry.urgent&&<AlertTriangle size={12}/>}{expiry.text}</span>}/>
          <InfoRow label="Created"    value={quo.createdDate}/>
          {quo.lostReason&&<InfoRow label="Lost Reason" value={<span style={{color:'#EF4444',fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)'}}>{quo.lostReason}</span>}/>}
          <InfoRow label="Tags" value={
            quo.tags.length>0
              ? <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{quo.tags.map(t=><QTagBadge key={t.label} tag={t}/>)}</div>
              : <span style={{color:'var(--color-muted-foreground)',fontFamily:'var(--font-family-geist)',fontSize:'var(--text-14)'}}>—</span>
          }/>
        </div>
      </div>

      {/* Attachments Card */}
      <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', backgroundColor:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:6 }}>
          <Package size={12} style={{color:'var(--color-muted-foreground)'}}/>
          <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Attachments</span>
        </div>
        <div style={{ padding:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FileText size={14} style={{color:'var(--color-muted-foreground)'}}/>
            <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{quo.quoNo}.pdf (1.2 MB)</span>
            <button style={{ marginLeft:'auto', padding:'4px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'12px', cursor:'pointer' }}>Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Products & Pricing ────────────────────────────────────────────────────

function TabProducts({ quo }: { quo:Quotation }) {
  return (
    <div style={{ padding:'20px 24px' }}>
      <SectionLabel>Product Line Items</SectionLabel>
      <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:20 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr>
                {['Product','Qty','Duration','City','Rate','Final Price','Period','Subtotal'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left', borderBottom:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quo.products.map((p,i)=>{
                const subtotal = p.quantity * p.finalPrice * p.duration;
                const discPct = p.finalPrice<p.ratePrice?Math.round((1-p.finalPrice/p.ratePrice)*100):0;
                return (
                  <tr key={p.id} style={{ backgroundColor: i%2===0?'transparent':'rgba(0,0,0,0.015)' }}>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)' }}>
                      <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, color:'var(--color-foreground)' }}>{p.product}</div>
                      <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)' }}>{p.category}</div>
                      {p.notes&&<div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)', fontStyle:'italic', marginTop:2 }}>{p.notes}</div>}
                    </td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)', whiteSpace:'nowrap' }}>{p.quantity} {p.unit}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)', whiteSpace:'nowrap' }}>{p.duration} {p.durationUnit}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{p.city}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)', whiteSpace:'nowrap' }}>{formatIDR(p.ratePrice)}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', whiteSpace:'nowrap' }}>
                      <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{formatIDR(p.finalPrice)}</div>
                      {discPct>0&&<div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'#F59E0B' }}>-{discPct}%</div>}
                    </td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)', whiteSpace:'nowrap' }}>{p.campaignStart} – {p.campaignEnd}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981', whiteSpace:'nowrap' }}>{formatIDR(subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SectionLabel>Pricing Breakdown</SectionLabel>
      <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:20 }}>
        {[
          { label:'Subtotal',            value:formatIDR(quo.subtotal),             bold:false, color:'var(--color-foreground)' },
          { label:'Discount',            value:`− ${formatIDR(quo.discount)}`,      bold:false, color:'#F59E0B' },
          { label:'Total After Discount',value:formatIDR(quo.totalAfterDiscount),   bold:false, color:'var(--color-foreground)' },
          { label:'VAT (11%)',           value:formatIDR(quo.vat),                  bold:false, color:'var(--color-muted-foreground)' },
          { label:'Grand Total',         value:formatIDR(quo.grandTotal),           bold:true,  color:'#10B981' },
        ].map((row,i,arr)=>(
          <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom: i<arr.length-1?'1px solid var(--color-border)':'none', backgroundColor: row.bold?'rgba(16,185,129,0.05)':i%2===0?'transparent':'var(--color-secondary)' }}>
            <span style={{ fontFamily:'var(--font-family-geist)', fontSize:row.bold?'var(--text-16)':'var(--text-14)', fontWeight:row.bold?700:400, color:row.bold?'#10B981':'var(--color-foreground)' }}>{row.label}</span>
            <span style={{ fontFamily:'var(--font-family-geist)', fontSize:row.bold?'var(--text-16)':'var(--text-14)', fontWeight:row.bold?700:400, color:row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {quo.paymentTerms.length>0&&<>
        <SectionLabel>Payment Terms</SectionLabel>
        <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Term','Percentage','Milestone','Due Days','Amount'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', fontFamily:'var(--font-family-geist)', fontSize:'11px', fontWeight:700, color:'var(--color-muted-foreground)', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left', borderBottom:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quo.paymentTerms.map((pt,i)=>(
                <tr key={pt.id} style={{ backgroundColor:i%2===0?'transparent':'rgba(0,0,0,0.015)' }}>
                  <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, color:'var(--color-foreground)' }}>{pt.name||`Term ${i+1}`}</td>
                  <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{pt.percentage}%</td>
                  <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{pt.milestone}</td>
                  <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)' }}>{pt.dueDays} days</td>
                  <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981' }}>{formatIDR(pt.amount)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor:'var(--color-secondary)' }}>
                <td colSpan={4} style={{ padding:'10px 12px', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'var(--color-foreground)' }}>Total</td>
                <td style={{ padding:'10px 12px', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:700, color:'#10B981' }}>{formatIDR(quo.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>}
    </div>
  );
}

// ── Tab: Terms ─────────────────────────────────────────────────────────────────

function TabTerms({ quo }: { quo:Quotation }) {
  const sections = [
    { title:'Additional Notes',    html:quo.additionalNotes,    bg:'var(--color-secondary)', border:'var(--color-border)' },
    { title:'Cancellation Policy', html:quo.cancellationPolicy, bg:'rgba(239,68,68,0.04)',   border:'rgba(239,68,68,0.15)' },
    { title:'Terms & Conditions',  html:quo.termsAndConditions, bg:'var(--color-secondary)', border:'var(--color-border)' },
  ];
  return (
    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
      {sections.map(s=>(
        <div key={s.title} style={{ border:`1px solid ${s.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', backgroundColor:'var(--color-secondary)', borderBottom:`1px solid ${s.border}` }}>
            <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:'var(--color-foreground)' }}>{s.title}</span>
          </div>
          <div style={{ padding:'14px 16px', backgroundColor:s.bg }}>
            {s.html
              ? <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-foreground)', lineHeight:1.7 }} dangerouslySetInnerHTML={{__html:s.html}}/>
              : <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)', fontStyle:'italic' }}>No content provided.</span>
            }
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Activity ──────────────────────────────────────────────────────────────

function TabActivity() {
  const [expanded, setExpanded] = useState<number|null>(null);
  const icons = [CheckCircle, Edit, Send] as any[];
  return (
    <div style={{ padding:'20px 24px' }}>
      {MOCK_ACTIVITY.map((a,i)=>{
        const Icon = icons[i]||Clock;
        return (
          <div key={i} style={{ display:'flex', gap:12, paddingBottom:16, position:'relative' }}>
            {i<MOCK_ACTIVITY.length-1&&<div style={{ position:'absolute', left:16, top:34, bottom:0, width:1, backgroundColor:'var(--color-border)' }}/>}
            <div style={{ width:32, height:32, borderRadius:'50%', backgroundColor:'var(--color-secondary)', border:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={13} style={{color:'var(--color-muted-foreground)'}}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:2 }}>
                <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, color:'var(--color-foreground)' }}>{a.action}</span>
                <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)', whiteSpace:'nowrap' }}>{a.time}</span>
              </div>
              <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>by {a.actor}</div>
              <button onClick={()=>setExpanded(expanded===i?null:i)} style={{ marginTop:4, padding:0, border:'none', background:'none', color:'#2563EB', fontFamily:'var(--font-family-geist)', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                {expanded===i?<><ChevronDown size={11}/> Hide</>:<><ChevronRight size={11}/> Details</>}
              </button>
              {expanded===i&&<div style={{ marginTop:6, padding:'8px 10px', backgroundColor:'var(--color-secondary)', borderRadius:'var(--radius-sm)', fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-foreground)' }}>{a.detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Drawer ────────────────────────────────────────────────────────────────

export function QuotationDetailDrawer({ open, quo, onClose, onEdit, onSend, onConvert, onMarkLost, onDuplicate }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const copyQuo = () => {
    if (!quo) return;
    copyToClipboard(quo.quoNo);
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  };

  if (!quo && !open) return null;

  const renderTab = () => {
    if (!quo) return null;
    switch(activeTab) {
      case 'overview': return <TabOverview quo={quo}/>;
      case 'products': return <TabProducts quo={quo}/>;
      case 'terms':    return <TabTerms quo={quo}/>;
      case 'activity': return <TabActivity/>;
      default:         return null;
    }
  };

  const expiry = quo ? getExpiryInfo(quo.validUntilDate) : { text:'', color:'', urgent:false };
  const sc = quo ? STATUS_CONFIG[quo.status] : null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && quo && (
        <>
          <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0, transition:{duration:0.22, ease:'easeIn'}}} transition={{duration:0.22, ease:'easeOut'}}
            onClick={onClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', zIndex:9998 }}/>
          <motion.div key="drawer" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%', transition:{type:'tween', duration:0.26, ease:[0.4,0,1,1]}}} transition={{type:'spring', stiffness:340, damping:34, mass:0.85}}
            style={{ position:'fixed', top:0, right:0, height:'100vh', width:720, maxWidth:'95vw', zIndex:9999, backgroundColor:'var(--color-card)', borderLeft:'1px solid var(--color-border)', display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.12)' }}>

            {/* Header */}
            <div style={{ padding:'20px 24px 0', borderBottom:'1px solid var(--color-border)', flexShrink:0 }}>
              {/* Title row */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontFamily:'monospace', fontSize:'18px', fontWeight:700, color:'var(--color-foreground)' }}>{quo.quoNo}</span>
                    <button onClick={copyQuo} style={{ padding:4, border:'none', background:'none', cursor:'pointer', color:'var(--color-muted-foreground)' }}>
                      {copied?<Check size={13} style={{color:'#10B981'}}/>:<Copy size={13}/>}
                    </button>
                    {sc&&<span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:'999px', backgroundColor:sc.bg, border:sc.border||'none' }}>
                      {quo.status!=='draft'&&<span style={{ width:6, height:6, borderRadius:'50%', backgroundColor:sc.color }}/>}
                      <span style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:sc.color }}>{sc.label}</span>
                    </span>}
                  </div>
                  <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', color:'var(--color-muted-foreground)', marginBottom:2 }}>{quo.quoteName}</div>
                  <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', color:'var(--color-muted-foreground)' }}>Created on {quo.createdDate} by {quo.salesPerson.name}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={()=>onEdit(quo)} style={{ padding:'7px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'13px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <Edit size={13}/> Edit
                  </button>
                  <button onClick={()=>onSend(quo)} style={{ padding:'7px 12px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'13px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <Send size={13}/> Send
                  </button>
                  <button onClick={onClose} style={{ width:32, height:32, borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-muted-foreground)' }}>
                    <X size={15}/>
                  </button>
                </div>
              </div>

              {/* Summary stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  { label:'Grand Total',  value:formatIDR(quo.grandTotal),                   color:'#10B981', bg:'rgba(16,185,129,0.07)' },
                  { label:'Products',     value:`${quo.products.length} item${quo.products.length!==1?'s':''}`, color:'#7C3AED', bg:'rgba(124,58,237,0.07)' },
                  { label:'Valid Until',  value:expiry.text,                                  color:expiry.color, bg:'rgba(107,114,128,0.07)' },
                  { label:'Payment Terms',value:`${quo.paymentTerms.length} term${quo.paymentTerms.length!==1?'s':''}`, color:'#2563EB', bg:'rgba(37,99,235,0.07)' },
                ].map(s=>(
                  <div key={s.label} style={{ padding:'10px 12px', borderRadius:'var(--radius)', backgroundColor:s.bg }}>
                    <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'12px', fontWeight:700, color:s.color, marginBottom:2, lineHeight:1.3, wordBreak:'break-word' }}>{s.value}</div>
                    <div style={{ fontFamily:'var(--font-family-geist)', fontSize:'11px', color:'var(--color-muted-foreground)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'none', overflowX:'auto' }}>
                {TABS.map(tab=>{
                  const isActive = activeTab===tab.key;
                  return (
                    <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                      style={{ padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontFamily:'var(--font-family-geist)', fontSize:'13px', fontWeight:isActive?600:400, color:isActive?'#7C3AED':'var(--color-muted-foreground)', borderBottom:isActive?'2px solid #7C3AED':'2px solid transparent', whiteSpace:'nowrap', transition:'color 0.15s', marginBottom:'-1px' }}>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
              {renderTab()}
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--color-border)', flexShrink:0, backgroundColor:'var(--color-card)', display:'flex', gap:8, justifyContent:'flex-end', flexWrap:'wrap' }}>
              <button onClick={()=>onDuplicate(quo)} style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Copy size={13}/> Duplicate
              </button>
              <button style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid var(--color-border)', backgroundColor:'var(--color-secondary)', color:'var(--color-foreground)', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Download size={13}/> Download PDF
              </button>
              {quo.status==='lead'&&(
                <button onClick={()=>onConvert(quo)} style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'none', backgroundColor:'#10B981', color:'white', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <CheckCircle size={13}/> Convert to Sales Order
                </button>
              )}
              {(quo.status==='lead'||quo.status==='draft')&&(
                <button onClick={()=>onMarkLost(quo)} style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'none', backgroundColor:'rgba(239,68,68,0.1)', color:'#EF4444', fontFamily:'var(--font-family-geist)', fontSize:'var(--text-14)', fontWeight:600, cursor:'pointer' }}>
                  Mark as Lost
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}