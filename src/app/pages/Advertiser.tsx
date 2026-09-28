import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';
import { AddAdvertiserModal } from '../components/AddAdvertiserModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DspName = 'LYNX Dummy DSP #A' | 'LYNX Dummy DSP #B';

interface AdvertiserItem {
  id: string;
  name: string;
  domain: string;
  dsp: DspName;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_ADVERTISERS: AdvertiserItem[] = [
  { id: 'adv-1', name: 'ExxonMobil Lubricants', domain: 'exxonmobil.co.id', dsp: 'LYNX Dummy DSP #A' },
  { id: 'adv-2', name: 'Unilever Indonesia',     domain: 'unilever.co.id',  dsp: 'LYNX Dummy DSP #A' },
  { id: 'adv-3', name: 'Nestlé Indonesia',       domain: 'nestle.co.id',    dsp: 'LYNX Dummy DSP #A' },
  { id: 'adv-4', name: 'Wardah Beauty',          domain: 'wardahbeauty.com',dsp: 'LYNX Dummy DSP #A' },
  { id: 'adv-5', name: 'inDrive Indonesia',      domain: 'indrive.com',     dsp: 'LYNX Dummy DSP #B' },
  { id: 'adv-6', name: 'Tokopedia',              domain: 'tokopedia.com',   dsp: 'LYNX Dummy DSP #B' },
  { id: 'adv-7', name: 'Sinar Mas Land',         domain: 'sinarmasland.com',dsp: 'LYNX Dummy DSP #B' },
];

type TabValue = 'All' | DspName;

// ─── DSP tag pill ───────────────────────────────────────────────────────────────

function DspTag({ dsp }: { dsp: DspName }) {
  const isA = dsp === 'LYNX Dummy DSP #A';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: isA ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)',
      border: `1px solid ${isA ? 'rgba(124,58,237,0.3)' : 'rgba(37,99,235,0.3)'}`,
      color: isA ? '#7C3AED' : '#2563EB',
      fontFamily: 'var(--font-family-geist)',
      whiteSpace: 'nowrap',
    }}>
      {dsp}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Advertiser() {
  const [items, setItems] = useState<AdvertiserItem[]>(INITIAL_ADVERTISERS);
  const [activeTab, setActiveTab] = useState<TabValue>('All');
  const [search, setSearch] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toasts, showToast, dismiss } = useToast();

  const tabCounts = useMemo(() => ({
    All: items.length,
    'LYNX Dummy DSP #A': items.filter(i => i.dsp === 'LYNX Dummy DSP #A').length,
    'LYNX Dummy DSP #B': items.filter(i => i.dsp === 'LYNX Dummy DSP #B').length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(it => {
      if (activeTab !== 'All' && it.dsp !== activeTab) return false;
      if (q && !it.name.toLowerCase().includes(q) && !it.domain.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, activeTab, search]);

  const handleCreate = (data: { name: string; domain: string; dsp: DspName }) => {
    const newItem: AdvertiserItem = { id: `adv-${Date.now()}`, ...data };
    setItems(prev => [newItem, ...prev]);
    setModalOpen(false);
    showToast('success', 'Advertiser Created', `${data.name} has been added.`);
  };

  const handleRemove = (item: AdvertiserItem) => {
    setItems(prev => prev.filter(it => it.id !== item.id));
    showToast('success', 'Advertiser Removed', `${item.name} has been removed.`);
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600,
    color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap', backgroundColor: 'var(--muted)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--font-family-geist)',
    color: 'var(--foreground)', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', minWidth: 0,
  };
  const gridCols = '1fr 1fr 220px 120px';

  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', maxWidth: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
          DSP / Advertiser
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>
              Advertisers
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px', lineHeight: 1.5, fontWeight: 400 }}>
              Reusable advertiser and buyer library across deals.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={14} /> New advertiser
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['All', 'LYNX Dummy DSP #A', 'LYNX Dummy DSP #B'] as TabValue[]).map(tab => {
            const label = tab === 'All' ? 'All' : tab === 'LYNX Dummy DSP #A' ? 'DSP #A' : 'DSP #B';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  position: 'relative', padding: '12px 16px', border: 'none', backgroundColor: 'transparent',
                  fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 500,
                  color: activeTab === tab ? '#7C3AED' : 'var(--muted-foreground)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                }}
              >
                <span>{label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '18px', padding: '0 5px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: activeTab === tab ? 'rgba(124,58,237,0.12)' : 'var(--muted)', color: activeTab === tab ? '#7C3AED' : 'var(--muted-foreground)' }}>
                  {tabCounts[tab]}
                </span>
                {activeTab === tab && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: '#7C3AED' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search + CTA row ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or domain..."
            style={{ height: '36px', padding: '0 12px 0 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Building2 size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>No advertisers found</div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Try adjusting your search or tab selection.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div role="table" style={{ minWidth: '700px' }}>
              {/* Header row */}
              <div role="row" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
                <div role="columnheader" style={thStyle}>Advertiser Name</div>
                <div role="columnheader" style={thStyle}>Domain</div>
                <div role="columnheader" style={thStyle}>DSP</div>
                <div role="columnheader" style={{ ...thStyle, justifyContent: 'center' }}>Action</div>
              </div>

              {/* Body rows */}
              {filtered.map(item => {
                const isHovered = hoveredRowId === item.id;
                return (
                  <div
                    key={item.id}
                    role="row"
                    style={{ display: 'grid', gridTemplateColumns: gridCols, backgroundColor: isHovered ? 'var(--muted)' : 'transparent', transition: 'background-color 0.15s' }}
                    onMouseEnter={() => setHoveredRowId(item.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <div role="cell" style={tdStyle}>
                      <span style={{ fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    <div role="cell" style={tdStyle}>
                      <span style={{ color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.domain || '—'}</span>
                    </div>
                    <div role="cell" style={tdStyle}>
                      <DspTag dsp={item.dsp} />
                    </div>
                    <div role="cell" style={{ ...tdStyle, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <button
                          onClick={() => showToast('info', 'Coming Soon', 'The Edit Advertiser form is not yet available in this prototype.')}
                          title="Edit"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', flexShrink: 0, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleRemove(item)}
                          title="Remove"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', flexShrink: 0, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220,38,38,0.3)', backgroundColor: 'var(--card)', color: '#DC2626', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
          Showing {filtered.length} of {items.length} advertisers.
        </div>
      )}

      <AddAdvertiserModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
