import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, Edit, ExternalLink, Copy, Mail, Phone, MessageCircle,
  CheckCircle, Circle, Download, Plus, FileText, Building2,
  Users, Clock, ChevronDown, ChevronRight,
} from 'lucide-react';
import type { Client, ContactPerson, Brand } from '../pages/Clients';
import { INDUSTRY_META, countDocs } from '../pages/Clients';

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onAction: (action: string, clientId: string) => void;
  onManageContacts: (client: Client) => void;
  onUploadDocuments: (client: Client) => void;
}

const DOC_META: Record<string, { label: string; abbr: string }> = {
  siup:     { label: 'SIUP (Surat Izin Usaha Perdagangan)', abbr: 'SIUP'     },
  tdp:      { label: 'TDP (Tanda Daftar Perusahaan)',       abbr: 'TDP'      },
  domicili: { label: 'Surat Domisili Perusahaan',           abbr: 'Domisili' },
  npwp:     { label: 'NPWP (Nomor Pokok Wajib Pajak)',      abbr: 'NPWP'     },
};

const MOCK_CAMPAIGNS = [
  { name: 'Kenangan Ramadan Q1',  type: 'Brand Awareness', start: 'Mar 1',  end: 'Apr 15', budget: 'IDR 45,000,000', status: 'active',    drivers: 234 },
  { name: 'Summer Campaign 2025', type: 'Product Launch',  start: 'Jan 15', end: 'Feb 28', budget: 'IDR 32,000,000', status: 'completed', drivers: 187 },
  { name: 'Year-End Promotion',   type: 'Promotional',     start: 'Dec 1',  end: 'Dec 31', budget: 'IDR 28,500,000', status: 'completed', drivers: 312 },
];

const MOCK_ACTIVITY = [
  { action: 'Document SIUP uploaded', actor: 'Ahmad Rahman', time: '2 hours ago',   detail: 'SIUP_PT_Kopi_Kenangan.pdf (2.3 MB)' },
  { action: 'Client profile updated', actor: 'Ahmad Rahman', time: 'Yesterday',     detail: 'Updated brand name and website URL' },
  { action: 'Contact person added',   actor: 'Dewi Kusuma',  time: '3 days ago',    detail: 'Added Rina Marlina as Finance Manager' },
  { action: 'Campaign created',       actor: 'Ahmad Rahman', time: 'Feb 10, 2025', detail: 'Kenangan Ramadan Q1 campaign started' },
  { action: 'Client activated',       actor: 'Admin',        time: 'Jan 15, 2025', detail: 'Client status changed from Inactive to Active' },
  { action: 'Client created',         actor: 'Ahmad Rahman', time: 'Jan 15, 2025', detail: 'New client registered' },
];

const STATUS_DOT: Record<string, string> = { active: '#16A34A', inactive: '#6B7280', suspended: '#D97706' };
const STATUS_LABEL: Record<string, string> = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended' };
const STATUS_BG: Record<string, string>    = { active: 'rgba(22,163,74,0.1)', inactive: 'rgba(107,114,128,0.1)', suspended: 'rgba(245,158,11,0.1)' };

const CAMP_STATUS: Record<string, { color: string; bg: string }> = {
  active:    { color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   },
  completed: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  scheduled: { color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  cancelled: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
};

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const colors = ['#7C3AED','#2563EB','#16A34A','#EA580C','#DB2777','#0D9488'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size > 30 ? '14px' : '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
      onClick={() => { copyToClipboard(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-foreground)' }}>{text}</span>
      <Copy size={12} style={{ color: copied ? '#16A34A' : 'var(--color-muted-foreground)' }} />
      {copied && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: '#16A34A' }}>Copied</span>}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', alignItems: 'start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 8px' }}>
      {children}
    </div>
  );
}

function ContactCard({ contact }: { contact: ContactPerson }) {
  const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'var(--color-card)' }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar initials={initials} size={34} />
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{contact.name}</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{contact.position || 'No title'}</div>
          </div>
        </div>
        {contact.isPrimary && (
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Primary</span>
        )}
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Mail size={13} style={{ color: 'var(--color-muted-foreground)' }} />
            <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#2563EB', textDecoration: 'none' }}>{contact.email}</a>
          </div>
          <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ width: '26px', height: '26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
            <Mail size={12} />
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Phone size={13} style={{ color: 'var(--color-muted-foreground)' }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)' }}>{contact.mobile}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <a href={`tel:${contact.mobile}`} onClick={e => e.stopPropagation()} style={{ width: '26px', height: '26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
              <Phone size={12} />
            </a>
            <button onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${contact.mobile.replace(/\D/g,'')}`); }} style={{ width: '26px', height: '26px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37,211,102,0.3)', backgroundColor: 'rgba(37,211,102,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <MessageCircle size={12} style={{ color: '#25D366' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Contents ───────���────────────────────────────���─────────────────────────

function TabCompanyInfo({ client }: { client: Client }) {
  const m = INDUSTRY_META[client.industry];
  return (
    <div style={{ padding: '20px' }}>
      <SectionLabel>Basic Details</SectionLabel>
      <InfoRow label="Company Name"  value={<strong style={{ fontFamily: 'var(--font-family-geist)' }}>{client.companyName}</strong>} />
      <InfoRow label="Brands" value={
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {client.brands.map(b => (
            <span key={b.id} style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>
              {b.name}
            </span>
          ))}
        </div>
      } />
      <InfoRow label="Website"       value={client.website ? <a href={`https://${client.website}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)' }}>{client.website} <ExternalLink size={12} /></a> : '—'} />
      <InfoRow label="Industry"      value={<span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: m.color, backgroundColor: m.bg, padding: '3px 8px', borderRadius: 'var(--radius-sm)', letterSpacing: '0.02em' }}>{client.industry}</span>} />
      <InfoRow label="NPWP Number"   value={client.npwp ? <CopyableText text={client.npwp} /> : <span style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>Not provided</span>} />
      <InfoRow label="Client ID"     value={<CopyableText text={client.id} />} />
      <SectionLabel>Business Details</SectionLabel>
      <InfoRow label="Created Date"  value={client.createdAt} />
      <InfoRow label="Created By"    value={client.createdBy} />
      <InfoRow label="Last Updated"  value={client.lastUpdated} />
      <InfoRow label="Account Manager" value={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontFamily: 'var(--font-family-geist)', fontWeight: 700 }}>{client.salesPerson.initials}</div>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{client.salesPerson.name}</span>
        </div>
      } />

      {/* Brand Performance */}
      <SectionLabel>Brands ({client.brands.length})</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {client.brands.map(b => (
          <div key={b.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7C3AED', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{b.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: b.activeCampaigns > 0 ? '#16A34A' : 'var(--color-muted-foreground)', fontWeight: 500 }}>
                {b.activeCampaigns > 0 ? `${b.activeCampaigns} active` : 'No campaigns'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabContacts({ client, onManageContacts }: { client: Client; onManageContacts: (c: Client) => void }) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{client.contacts.length} contact{client.contacts.length !== 1 ? 's' : ''}</span>
        <button onClick={() => onManageContacts(client)} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={13} /> Manage Contacts
        </button>
      </div>
      {client.contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Users size={32} style={{ color: 'var(--color-border)', marginBottom: '8px' }} />
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>No contacts added yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {client.contacts.map(c => <ContactCard key={c.id} contact={c} />)}
        </div>
      )}
    </div>
  );
}

function TabDocuments({ client, onUploadDocuments }: { client: Client; onUploadDocuments: (c: Client) => void }) {
  const { uploaded, total } = countDocs(client);
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{uploaded}/{total} Documents</div>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
            {uploaded === total ? 'All documents complete' : `${total - uploaded} document${total - uploaded > 1 ? 's' : ''} missing`}
          </div>
        </div>
        <button onClick={() => onUploadDocuments(client)} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Download size={13} /> Download All
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {client.documents.map(doc => {
          const meta = DOC_META[doc.type];
          const isNpwp = doc.type === 'npwp';
          return (
            <div key={doc.type} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} style={{ color: doc.uploaded ? '#16A34A' : 'var(--color-muted-foreground)' }} />
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>{meta.abbr}</span>
                </div>
                {doc.uploaded
                  ? <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: '#16A34A', backgroundColor: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={11} /> Uploaded</span>
                  : <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: '#DC2626', backgroundColor: 'rgba(220,38,38,0.08)', padding: '2px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}><Circle size={11} /> Missing</span>}
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginBottom: '8px' }}>{meta.label}</div>
                {doc.uploaded ? (
                  isNpwp && client.npwp ? (
                    <CopyableText text={client.npwp} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 500 }}>{doc.filename}</div>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{doc.size} · Uploaded {doc.uploadedAt} by {doc.uploadedBy}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => onUploadDocuments(client)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer' }}>View</button>
                        <button onClick={() => onUploadDocuments(client)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer' }}>Replace</button>
                      </div>
                    </div>
                  )
                ) : (
                  <button onClick={() => onUploadDocuments(client)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-secondary)', color: '#2563EB', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={13} /> Upload {meta.abbr}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabCampaigns() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total',     value: '3', color: '#7C3AED' },
          { label: 'Active',    value: '1', color: '#16A34A' },
          { label: 'Completed', value: '2', color: '#6B7280' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: 'var(--color-muted-foreground)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MOCK_CAMPAIGNS.map(c => {
          const cs = CAMP_STATUS[c.status] ?? CAMP_STATUS.completed;
          return (
            <div key={c.name} style={{ padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-card)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{c.name}</div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{c.type} · {c.start} – {c.end}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: cs.color, backgroundColor: cs.bg, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{c.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Budget: {c.budget}</span>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{c.drivers} drivers</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabActivity() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {MOCK_ACTIVITY.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
            {i < MOCK_ACTIVITY.length - 1 && <div style={{ position: 'absolute', left: '16px', top: '34px', bottom: '0', width: '1px', backgroundColor: 'var(--color-border)' }} />}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={13} style={{ color: 'var(--color-muted-foreground)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{a.action}</span>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{a.time}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>by {a.actor}</div>
              <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ marginTop: '4px', padding: 0, border: 'none', background: 'none', color: '#2563EB', fontFamily: 'var(--font-family-geist)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {expanded === i ? <><ChevronDown size={12} /> Hide details</> : <><ChevronRight size={12} /> Details</>}
              </button>
              {expanded === i && (
                <div style={{ marginTop: '6px', padding: '8px 10px', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)' }}>{a.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'info',      label: 'Company Info' },
  { key: 'contacts',  label: 'Contacts'     },
  { key: 'documents', label: 'Documents'    },
  { key: 'campaigns', label: 'Campaigns'    },
  { key: 'activity',  label: 'Activity Log' },
];

// ── Main Drawer Component ─────────────────────────────────────────────────────

export function ClientDetailDrawer({ open, client, onClose, onEdit, onAction, onManageContacts, onUploadDocuments }: Props) {
  const [activeTab, setActiveTab] = useState('info');

  const renderTab = () => {
    if (!client) return null;
    switch (activeTab) {
      case 'info':      return <TabCompanyInfo client={client} />;
      case 'contacts':  return <TabContacts client={client} onManageContacts={onManageContacts} />;
      case 'documents': return <TabDocuments client={client} onUploadDocuments={onUploadDocuments} />;
      case 'campaigns': return <TabCampaigns />;
      case 'activity':  return <TabActivity />;
    }
  };

  if (!client && !open) return null;

  const { uploaded, total } = client ? countDocs(client) : { uploaded: 0, total: 4 };
  const iMeta = client ? INDUSTRY_META[client.industry] : null;
  const statusColor = client ? STATUS_DOT[client.status] : '#6B7280';
  const statusBg    = client ? STATUS_BG[client.status]  : 'transparent';
  const statusLabel = client ? STATUS_LABEL[client.status] : '';

  const btnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, border: 'none', width: '100%' };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && client && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }} transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9998 }} />
          <motion.div key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%', transition: { type: 'tween', duration: 0.26, ease: [0.4, 0, 1, 1] } }} transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.85 }}
            style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '680px', maxWidth: '95vw', zIndex: 9999, backgroundColor: 'var(--color-card)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                  {/* Logo placeholder — icon only, no emoji */}
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius)', backgroundColor: iMeta?.bg, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={26} style={{ color: iMeta?.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <h2 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>{client.companyName}</h2>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: statusColor, backgroundColor: statusBg, padding: '2px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }} />
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', marginBottom: '6px' }}>
                      {client.brands.slice(0, 2).map(b => b.name).join(', ')}{client.brands.length > 2 ? ` +${client.brands.length - 2} more` : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-muted-foreground)', backgroundColor: 'var(--color-secondary)', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>{client.id}</span>
                      {iMeta && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: iMeta.color, backgroundColor: iMeta.bg, padding: '2px 8px', borderRadius: 'var(--radius-sm)', letterSpacing: '0.02em' }}>{client.industry}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => onEdit(client)} style={{ padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Edit size={13} /> Edit
                  </button>
                  <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px' }}>
                {[
                  { label: 'Active Campaigns', value: String(client.activeCampaigns), color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
                  { label: 'Total Spend',      value: `IDR ${(client.totalSpend/1000000).toFixed(0)}M`, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
                  { label: 'Documents',        value: `${uploaded}/${total}`, color: uploaded === total ? '#16A34A' : '#D97706', bg: uploaded === total ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', backgroundColor: s.bg }}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Nav */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', flexShrink: 0, padding: '0 24px' }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{ padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#7C3AED' : 'var(--color-muted-foreground)', borderBottom: isActive ? '2px solid #7C3AED' : '2px solid transparent', whiteSpace: 'nowrap', transition: 'color 0.15s', marginBottom: '-1px' }}>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {renderTab()}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0, backgroundColor: 'var(--color-card)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button onClick={onClose}             style={{ ...btnBase, backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)' }}>Close</button>
                <button onClick={() => onEdit(client)} style={{ ...btnBase, backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)' }}><Edit size={14} /> Edit Client</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button style={{ ...btnBase, backgroundColor: '#7C3AED', color: 'white' }}><Plus size={14} /> Create Campaign</button>
                {client.status === 'active'
                  ? <button onClick={() => { onAction('deactivate', client.id); onClose(); }} style={{ ...btnBase, backgroundColor: 'rgba(245,158,11,0.1)', color: '#D97706' }}>Deactivate</button>
                  : <button onClick={() => { onAction('activate',   client.id); onClose(); }} style={{ ...btnBase, backgroundColor: 'rgba(22,163,74,0.1)',  color: '#16A34A' }}>Activate</button>}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}