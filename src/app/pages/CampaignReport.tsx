import React, { useState, useMemo, useRef, useEffect, Suspense, lazy, startTransition } from 'react';
import ReactDOM from 'react-dom';
import {
  Download, Search, Filter, ChevronDown, ChevronUp, ChevronRight,
  ChevronLeft, Eye, X, TrendingDown, TrendingUp, Minus,
  Monitor, Square, BarChart2, AlertTriangle, Check, Loader2,
  User, Calendar, Building, SlidersHorizontal, ShieldAlert,
  CheckCircle2, Lock, Send,
} from 'lucide-react';

const ReactApexChart = lazy(() => import('react-apexcharts'));

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagType = 'Drop' | 'Spike' | 'Missing' | 'N/A';
type SeverityType = 'Normal' | 'Mild' | 'Critical' | null;
type StatusType = 'Healthy' | 'Need Review' | 'Investigating' | 'Resolved' | 'Published';
type InventoryType = 'Digital' | 'Conventional';

interface CampaignRow {
  id: string;
  campaignName: string;
  mediaPlanName: string;
  flag: FlagType;
  severity: SeverityType;
  reviewer: string | null;
  status: StatusType;
  currentImpression: number;
  suggestedImpression: number;
  publishedImpression: number | null;
}

type ScreenConnectionType = 'ScreenApp' | 'HTML' | 'API INTEGRATION' | 'N/A';

interface InventoryRow {
  id: string;
  inventoryName: string;
  organization: string;
  date: string;
  dateObj: Date;
  type: InventoryType;
  screenConnection: ScreenConnectionType;
  children: CampaignRow[];
}

// ─── Reviewers ────────────────────────────────────────────────────────────────

const REVIEWERS = [
  'Ahmad Rahman',
  'Dewi Kusuma',
  'Rina Safitri',
  'Budi Santoso',
  'Sari Indah',
  'Reza Pratama',
];

const DATA_OPS_TEAM = ['Reza Pratama', 'Sari Indah', 'Agus Wahyudi', 'Nina Marlina'];

const REASONS = [
  'Data source anomaly',
  'Inventory technical issue',
  'Seasonal / expected spike',
  'Client-side campaign change',
  'Insufficient data',
  'Other',
];

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_DATA: InventoryRow[] = [
  // ── Today: Aug 6, 2026 ──────────────────────────────────────────────────────
  {
    id: 'inv-11',
    inventoryName: 'Videotron Ancol Beach',
    organization: 'Infini',
    date: 'Aug 6, 2026',
    dateObj: new Date('2026-08-06'),
    type: 'Digital',
    screenConnection: 'ScreenApp',
    children: [
      { id: 'c-11a', campaignName: 'Summer Refresh',   mediaPlanName: 'Media Plan T', flag: 'Spike',   severity: 'Critical', reviewer: null,           status: 'Need Review',   currentImpression: 8500,  suggestedImpression: 12000, publishedImpression: null  },
      { id: 'c-11b', campaignName: 'Sports Brand Q3',  mediaPlanName: 'Media Plan U', flag: 'Drop',    severity: 'Mild',     reviewer: null,           status: 'Need Review',   currentImpression: 3200,  suggestedImpression: 5800,  publishedImpression: null  },
    ],
  },
  {
    id: 'inv-12',
    inventoryName: 'Static Panel Kemayoran',
    organization: 'Prisma',
    date: 'Aug 6, 2026',
    dateObj: new Date('2026-08-06'),
    type: 'Conventional',
    screenConnection: 'N/A',
    children: [
      { id: 'c-12a', campaignName: 'Education Campaign', mediaPlanName: 'Media Plan V', flag: 'N/A',     severity: 'Normal',   reviewer: null,           status: 'Healthy',       currentImpression: 15400, suggestedImpression: 18000, publishedImpression: null  },
      { id: 'c-12b', campaignName: 'Lifestyle Brand',    mediaPlanName: 'Media Plan W', flag: 'Spike',   severity: 'Mild',     reviewer: 'Dewi Kusuma',  status: 'Published',     currentImpression: 22000, suggestedImpression: 24500, publishedImpression: 24500 },
    ],
  },
  {
    id: 'inv-13',
    inventoryName: 'LED Screen Kuningan Tower',
    organization: 'Infini',
    date: 'Aug 6, 2026',
    dateObj: new Date('2026-08-06'),
    type: 'Digital',
    screenConnection: 'HTML',
    children: [
      { id: 'c-13a', campaignName: 'Pharma Launch',   mediaPlanName: 'Media Plan X', flag: 'Drop',    severity: 'Critical', reviewer: null,            status: 'Need Review',   currentImpression: 1200,  suggestedImpression: 4000,  publishedImpression: null  },
      { id: 'c-13b', campaignName: 'E-Commerce Sale', mediaPlanName: 'Media Plan Y', flag: 'Missing', severity: 'Mild',     reviewer: null,            status: 'Need Review',   currentImpression: 6700,  suggestedImpression: 9100,  publishedImpression: null  },
    ],
  },
  {
    id: 'inv-14',
    inventoryName: 'Billboard MH Thamrin',
    organization: 'Prisma',
    date: 'Aug 6, 2026',
    dateObj: new Date('2026-08-06'),
    type: 'Conventional',
    screenConnection: 'N/A',
    children: [
      { id: 'c-14a', campaignName: 'Bank Promo Aug', mediaPlanName: 'Media Plan Z', flag: 'N/A',   severity: 'Normal', reviewer: null,         status: 'Healthy',   currentImpression: 31200, suggestedImpression: 33000, publishedImpression: null },
    ],
  },
  // ── Historical ───────────────────────────────────────────────────────────────
  {
    id: 'inv-1',
    inventoryName: 'LED Videotron Kuningan',
    organization: 'Infini',
    date: 'Jul 1, 2026',
    dateObj: new Date('2026-07-01'),
    type: 'Digital',
    screenConnection: 'API INTEGRATION',
    children: [
      { id: 'c-1a', campaignName: 'Q3 Beverage Launch', mediaPlanName: 'Media Plan A', flag: 'Spike',   severity: 'Critical', reviewer: null,          status: 'Need Review',   currentImpression: 8200,  suggestedImpression: 12400, publishedImpression: null  },
      { id: 'c-1b', campaignName: 'Retail Promo July',  mediaPlanName: 'Media Plan B', flag: 'Drop',    severity: 'Mild',     reviewer: null,          status: 'Need Review',   currentImpression: 6500,  suggestedImpression: 9800,  publishedImpression: null  },
    ],
  },
  {
    id: 'inv-2',
    inventoryName: 'Static Billboard Sudirman',
    organization: 'Prisma',
    date: 'Jul 1, 2026',
    dateObj: new Date('2026-07-01'),
    type: 'Conventional',
    screenConnection: 'N/A',
    children: [
      { id: 'c-2a', campaignName: 'Brand Awareness Q3', mediaPlanName: 'Media Plan C', flag: 'Missing', severity: 'Critical', reviewer: 'Ahmad Rahman', status: 'Resolved', currentImpression: 14200, suggestedImpression: 16800, publishedImpression: null },
    ],
  },
  {
    id: 'inv-3',
    inventoryName: 'Digital Signage Senayan',
    organization: 'Infini',
    date: 'Jun 30, 2026',
    dateObj: new Date('2026-06-30'),
    type: 'Digital',
    screenConnection: 'ScreenApp',
    children: [
      { id: 'c-3a', campaignName: 'FMCG Summer',       mediaPlanName: 'Media Plan D', flag: 'Spike',   severity: 'Mild',   reviewer: 'Rina Safitri', status: 'Published',   currentImpression: 18500, suggestedImpression: 19200, publishedImpression: 19200 },
      { id: 'c-3b', campaignName: 'Auto Lifestyle Q3', mediaPlanName: 'Media Plan E', flag: 'N/A', severity: 'Normal', reviewer: null,           status: 'Healthy', currentImpression: 22300, suggestedImpression: 23000, publishedImpression: null },
      { id: 'c-3c', campaignName: 'Tech Brand',        mediaPlanName: 'Media Plan F', flag: 'N/A', severity: 'Normal', reviewer: null,           status: 'Healthy', currentImpression: 4100,  suggestedImpression: 7600,  publishedImpression: null  },
    ],
  },
  {
    id: 'inv-4',
    inventoryName: 'LED Billboard Gatot Subroto',
    organization: 'Prisma',
    date: 'Jul 2, 2026',
    dateObj: new Date('2026-07-02'),
    type: 'Digital',
    screenConnection: 'HTML',
    children: [
      { id: 'c-4a', campaignName: 'Consumer Goods', mediaPlanName: 'Media Plan G', flag: 'Drop',  severity: 'Critical', reviewer: null,           status: 'Need Review', currentImpression: 2800,  suggestedImpression: 5400,  publishedImpression: null },
      { id: 'c-4b', campaignName: 'Finance Brand',  mediaPlanName: 'Media Plan H', flag: 'Spike', severity: 'Mild',     reviewer: null,           status: 'Need Review', currentImpression: 11200, suggestedImpression: 13500, publishedImpression: null },
    ],
  },
  {
    id: 'inv-5',
    inventoryName: 'Static Billboard Thamrin',
    organization: 'Infini',
    date: 'Jul 2, 2026',
    dateObj: new Date('2026-07-02'),
    type: 'Conventional',
    screenConnection: 'N/A',
    children: [
      { id: 'c-5a', campaignName: 'Insurance Q3', mediaPlanName: 'Media Plan I', flag: 'Missing', severity: 'Mild', reviewer: null, status: 'Need Review', currentImpression: 6800, suggestedImpression: 9200, publishedImpression: null },
    ],
  },
  {
    id: 'inv-6',
    inventoryName: 'Videotron Bundaran HI',
    organization: 'Infini',
    date: 'Jul 3, 2026',
    dateObj: new Date('2026-07-03'),
    type: 'Digital',
    screenConnection: 'API INTEGRATION',
    children: [
      { id: 'c-6a', campaignName: 'F&B Launch',   mediaPlanName: 'Media Plan J', flag: 'Spike',   severity: 'Critical', reviewer: 'Rina Safitri', status: 'Investigating', currentImpression: 3400,  suggestedImpression: 6700,  publishedImpression: null  },
      { id: 'c-6b', campaignName: 'Travel Brand', mediaPlanName: 'Media Plan K', flag: 'N/A',    severity: 'Normal',   reviewer: null,           status: 'Healthy',       currentImpression: 17800, suggestedImpression: 18400, publishedImpression: null },
      { id: 'c-6c', campaignName: 'Retail Chain', mediaPlanName: 'Media Plan L', flag: 'Missing', severity: 'Mild',     reviewer: null,           status: 'Need Review',   currentImpression: 5200,  suggestedImpression: 8100,  publishedImpression: null  },
    ],
  },
  {
    id: 'inv-7',
    inventoryName: 'Static Billboard Sudirman North',
    organization: 'Prisma',
    date: 'Jul 3, 2026',
    dateObj: new Date('2026-07-03'),
    type: 'Conventional',
    screenConnection: 'N/A',
    children: [
      { id: 'c-7a', campaignName: 'Banking App', mediaPlanName: 'Media Plan M', flag: 'N/A',   severity: 'Normal', reviewer: null,          status: 'Healthy',  currentImpression: 21600, suggestedImpression: 24000, publishedImpression: null },
    ],
  },
  {
    id: 'inv-8',
    inventoryName: 'Digital Panel Kuningan City',
    organization: 'Infini',
    date: 'Jul 4, 2026',
    dateObj: new Date('2026-07-04'),
    type: 'Digital',
    screenConnection: 'ScreenApp',
    children: [
      { id: 'c-8a', campaignName: 'Luxury Auto',     mediaPlanName: 'Media Plan N', flag: 'Drop',    severity: 'Critical', reviewer: null,           status: 'Need Review',   currentImpression: 1900,  suggestedImpression: 4200,  publishedImpression: null },
      { id: 'c-8b', campaignName: 'Cosmetics Brand', mediaPlanName: 'Media Plan O', flag: 'Missing', severity: 'Mild',     reviewer: null,           status: 'Need Review',   currentImpression: 7300,  suggestedImpression: 11600, publishedImpression: null },
    ],
  },
  {
    id: 'inv-9',
    inventoryName: 'Baliho Semanggi',
    organization: 'Prisma',
    date: 'Jul 4, 2026',
    dateObj: new Date('2026-07-04'),
    type: 'Conventional',
    screenConnection: 'N/A',
    children: [
      { id: 'c-9a', campaignName: 'National Bank',      mediaPlanName: 'Media Plan P', flag: 'N/A',   severity: 'Normal',   reviewer: null,           status: 'Healthy',     currentImpression: 15600, suggestedImpression: 16200, publishedImpression: null },
      { id: 'c-9b', campaignName: 'Property Developer', mediaPlanName: 'Media Plan Q', flag: 'Drop',  severity: 'Critical', reviewer: null,           status: 'Need Review', currentImpression: 3600,  suggestedImpression: 5900,  publishedImpression: null  },
    ],
  },
  {
    id: 'inv-10',
    inventoryName: 'LED Screen Sudirman Plaza',
    organization: 'Infini',
    date: 'Jul 5, 2026',
    dateObj: new Date('2026-07-05'),
    type: 'Digital',
    screenConnection: 'HTML',
    children: [
      { id: 'c-10a', campaignName: 'Snack Brand',      mediaPlanName: 'Media Plan R', flag: 'Missing', severity: 'Critical', reviewer: 'Dewi Kusuma', status: 'Investigating', currentImpression: 4800,  suggestedImpression: 8300,  publishedImpression: null },
      { id: 'c-10b', campaignName: 'Telecom Provider', mediaPlanName: 'Media Plan S', flag: 'Spike',   severity: 'Mild',     reviewer: null,           status: 'Need Review',   currentImpression: 19400, suggestedImpression: 21000, publishedImpression: null },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: SeverityType }) {
  if (!severity) return <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>—</span>;

  const styles: Record<string, { bg: string; color: string }> = {
    Normal:   { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
    Mild:     { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
    Critical: { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' },
  };
  const s = styles[severity];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: s.bg, color: s.color,
      fontFamily: 'var(--font-family-geist)',
    }}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: StatusType }) {
  const styles: Record<StatusType, { bg: string; color: string; border: string }> = {
    'Healthy':      { bg: 'rgba(34,197,94,0.12)',   color: '#16a34a',  border: 'rgba(34,197,94,0.3)'   },
    'Need Review':  { bg: 'rgba(234,179,8,0.12)',   color: '#a16207',  border: 'rgba(234,179,8,0.3)'   },
    'Investigating':{ bg: 'rgba(59,130,246,0.12)',  color: '#2563eb',  border: 'rgba(59,130,246,0.3)'  },
    'Resolved':     { bg: 'rgba(107,114,128,0.12)', color: '#6b7280',  border: 'rgba(107,114,128,0.3)' },
    'Published':    { bg: '#7C3AED',                color: '#ffffff',  border: '#7C3AED'               },
  };
  const s = styles[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-family-geist)',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function FlagChip({ flag }: { flag: FlagType }) {
  if (flag === 'N/A') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 8px', borderRadius: '999px',
        fontSize: '12px', fontWeight: 500,
        backgroundColor: 'transparent', color: 'var(--muted-foreground)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-family-geist)',
      }}>
        N/A
      </span>
    );
  }
  const cfg: Record<'Drop' | 'Spike' | 'Missing', { icon: React.ReactNode; label: string }> = {
    Drop:    { icon: <TrendingDown size={11} />, label: 'Drop'    },
    Spike:   { icon: <TrendingUp   size={11} />, label: 'Spike'   },
    Missing: { icon: <Minus        size={11} />, label: 'Missing' },
  };
  const { icon, label } = cfg[flag];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)',
      border: '1px solid var(--border)',
      fontFamily: 'var(--font-family-geist)',
    }}>
      {icon}{label}
    </span>
  );
}

function TypeTag({ type }: { type: InventoryType }) {
  const isDigital = type === 'Digital';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: 'var(--radius-sm)',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: 'transparent',
      color: 'var(--muted-foreground)',
      border: '1px solid var(--border)',
      fontFamily: 'var(--font-family-geist)',
    }}>
      {isDigital ? <Monitor size={11} /> : <Square size={11} />}
      {type}
    </span>
  );
}

function PublishedCountBadge({ children }: { children: CampaignRow[] }) {
  const published = children.filter(c => c.status === 'Published').length;
  const total = children.length;
  const allDone = published === total;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 500,
      backgroundColor: allDone ? 'rgba(34,197,94,0.12)' : 'var(--muted)',
      color: allDone ? '#16a34a' : 'var(--muted-foreground)',
      fontFamily: 'var(--font-family-geist)',
      whiteSpace: 'nowrap',
    }}>
      {published} of {total} Campaign{total !== 1 ? 's' : ''} Published
    </span>
  );
}

function ReviewerPill({
  reviewer, onAssign,
}: { reviewer: string | null; onAssign: (r: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px', borderRadius: '999px',
          fontSize: '12px', fontWeight: 500,
          backgroundColor: reviewer ? 'var(--muted)' : 'transparent',
          color: reviewer ? 'var(--foreground)' : 'var(--muted-foreground)',
          border: reviewer ? '1px solid var(--border)' : '1px dashed var(--border)',
          cursor: 'pointer',
          fontFamily: 'var(--font-family-geist)',
          transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          backgroundColor: reviewer ? '#7C3AED' : 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {reviewer
            ? <span style={{ fontSize: '9px', color: 'white', fontWeight: 600 }}>
                {reviewer.split(' ').map(w => w[0]).join('')}
              </span>
            : <User size={9} style={{ color: 'var(--muted-foreground)' }} />
          }
        </div>
        <span>{reviewer ?? 'Unassigned'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          zIndex: 200,
          backgroundColor: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)',
          minWidth: '160px', overflow: 'hidden',
        }}>
          {[null, ...REVIEWERS].map(r => (
            <button
              key={r ?? '__unassigned__'}
              onClick={() => { onAssign(r); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', border: 'none',
                backgroundColor: reviewer === r ? 'var(--accent)' : 'transparent',
                color: 'var(--foreground)', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'var(--font-family-geist)',
                transition: 'background-color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = reviewer === r ? 'var(--accent)' : 'transparent'; }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: r ? '#7C3AED' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {r
                  ? <span style={{ fontSize: '9px', color: 'white', fontWeight: 600 }}>
                      {r.split(' ').map(w => w[0]).join('')}
                    </span>
                  : <User size={10} style={{ color: 'var(--muted-foreground)' }} />
                }
              </div>
              {r ?? 'Unassigned'}
              {reviewer === r && <Check size={12} style={{ marginLeft: 'auto', color: '#7C3AED' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusInlineEditor({
  status, onChange,
}: { status: StatusType; onChange: (s: StatusType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ALL_STATUSES: StatusType[] = ['Healthy', 'Need Review', 'Investigating', 'Resolved', 'Published'];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
      >
        <StatusBadge status={status} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          zIndex: 200,
          backgroundColor: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)',
          minWidth: '150px', overflow: 'hidden',
        }}>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', border: 'none',
                backgroundColor: status === s ? 'var(--accent)' : 'transparent',
                cursor: 'pointer', transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = status === s ? 'var(--accent)' : 'transparent'; }}
            >
              <StatusBadge status={s} />
              {status === s && <Check size={12} style={{ color: '#7C3AED' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

// ─── Trend Chart — ApexCharts zoomable timeseries ────────────────────────────
interface TrendPoint { date: string; current_imp: number; suggested_imp: number; published_imp: number | null; }

function TrendChart({ data }: { data: TrendPoint[] }) {
  const series = [
    {
      name: 'Current Imp',
      data: data.map(d => d.current_imp),
      color: '#6366f1',
    },
    {
      name: 'Suggested Imp',
      data: data.map(d => d.suggested_imp),
      color: '#f97316',
    },
    {
      name: 'Published Imp',
      data: data.map(d => d.published_imp ?? null),
      color: '#0ea5e9',
    },
  ];

  const options: Record<string, any> = {
    chart: {
      type: 'line',
      height: 220,
      zoom: { enabled: true, type: 'x' },
      toolbar: {
        show: true,
        tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
      },
      fontFamily: 'var(--font-family-geist)',
      background: 'transparent',
      animations: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#6366f1', '#f97316', '#0ea5e9'],
    xaxis: {
      categories: data.map(d => d.date),
      tickAmount: 6,
      labels: { style: { fontSize: '10px', colors: 'var(--muted-foreground)' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '10px', colors: 'var(--muted-foreground)' },
        formatter: (v: number) => `${Math.round(v / 1000)}k`,
      },
    },
    grid: {
      borderColor: 'var(--border)',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: { fontSize: '12px', fontFamily: 'var(--font-family-geist)' },
      y: { formatter: (v: number | null) => (v != null ? v.toLocaleString() : '—') },
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '12px',
      fontFamily: 'var(--font-family-geist)',
      markers: { size: 6 },
    },
    markers: { size: 0 },
    theme: { mode: 'light' },
  };

  return (
    <div style={{ margin: '0 -4px' }}>
      <Suspense fallback={
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '13px', fontFamily: 'var(--font-family-geist)' }}>
          Loading chart…
        </div>
      }>
        <ReactApexChart options={options} series={series} type="line" height={220} />
      </Suspense>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 12px', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px', fontFamily: 'var(--font-family-geist)' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)' }}>
        {value}
      </div>
    </div>
  );
}

interface DrawerProps {
  child: CampaignRow;
  parent: InventoryRow;
  onClose: () => void;
  onUpdate: (invId: string, childId: string, patch: Partial<CampaignRow>) => void;
}

function DetailDrawer({ child, parent, onClose, onUpdate }: DrawerProps) {
  const [visible, setVisible]         = useState(false);
  const [localStatus, setLocalStatus] = useState<StatusType>(child.status);

  // action-area fields
  const [pubImp, setPubImp]             = useState(String(child.publishedImpression ?? child.suggestedImpression));
  const [assignee, setAssignee]         = useState('');
  const [reason, setReason]             = useState('');
  const [notes, setNotes]               = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [escalatedTo, setEscalatedTo]   = useState<string | null>(null);
  const [escalatedAt, setEscalatedAt]   = useState<string | null>(null);
  const [resolvedAt, setResolvedAt]     = useState<string | null>(child.status === 'Resolved' ? parent.date : null);
  const [resolvedBy, setResolvedBy]     = useState(child.status === 'Resolved' ? (child.reviewer ?? 'Ops Team') : '');
  const [publishedAt, setPublishedAt]   = useState<string | null>(child.status === 'Published' ? parent.date : null);
  const [publishedBy, setPublishedBy]   = useState(child.status === 'Published' ? (child.reviewer ?? 'Ops Team') : '');

  // dataset table skeleton (1.6s simulated load)
  const [tableReady, setTableReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTableReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };

  // ── Derived numerics ──────────────────────────────────────────────────────
  const seed       = child.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const slotCount  = parent.type === 'Conventional' ? 1 : [4, 6, 8][seed % 3];
  const baseConf: Record<string, number> = { Normal: 93, Mild: 82, Critical: 56 };
  const confidence = (child.severity ? baseConf[child.severity] : 88) + (seed % 7) - 3;

  const fmtN          = (n: number) => n.toLocaleString();
  const currentReach  = Math.round(child.currentImpression   / 2.8);
  const suggestedReach= Math.round(child.suggestedImpression / 2.8);
  const pubImpNum     = parseInt(pubImp.replace(/[^\d]/g, '')) || child.suggestedImpression;
  const publishedReach= Math.round(pubImpNum / 2.8);
  const publishedFreq = (pubImpNum / Math.max(publishedReach, 1)).toFixed(1);
  const currentFreq   = (child.currentImpression   / Math.max(currentReach, 1)).toFixed(1);
  const suggestedFreq = (child.suggestedImpression / Math.max(suggestedReach, 1)).toFixed(1);
  const isPublished   = localStatus === 'Published';

  // ── 30-day chart data (deterministic) ────────────────────────────────────
  const chartData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(parent.dateObj);
    d.setDate(d.getDate() - (29 - i));
    const s  = (seed * (i + 1)) % 100;
    const curr = Math.round(child.currentImpression   * (0.82 + (s % 30) / 100));
    const sugg = Math.round(child.suggestedImpression * (0.90 + (s % 20) / 100));
    const pub  = isPublished && i >= 23 && child.publishedImpression != null
      ? Math.round(child.publishedImpression * (0.95 + (s % 8) / 100))
      : null;
    return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), current_imp: curr, suggested_imp: sugg, published_imp: pub };
  }), [child.id, child.currentImpression, child.suggestedImpression, child.publishedImpression, parent.dateObj, isPublished]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleEscalate = () => {
    if (!assignee) return;
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setEscalatedTo(assignee); setEscalatedAt(now);
    setLocalStatus('Investigating');
    onUpdate(parent.id, child.id, { status: 'Investigating' });
  };
  const handleResolve = () => {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setResolvedAt(now);
    setResolvedBy(child.reviewer ?? 'Ops Team');
    setLocalStatus('Resolved');
    onUpdate(parent.id, child.id, { status: 'Resolved' });
  };
  const handlePublish = () => {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setPublishedAt(now); setPublishedBy(child.reviewer ?? 'Ops Team');
    setLocalStatus('Published');
    onUpdate(parent.id, child.id, { status: 'Published', publishedImpression: pubImpNum });
  };

  // ── Shared micro-styles ───────────────────────────────────────────────────
  const SL: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', fontFamily: 'var(--font-family-geist)' };
  const DIV: React.CSSProperties = { borderTop: '1px solid var(--border)', margin: '20px 0' };
  const INP: React.CSSProperties = { width: '100%', height: '36px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  const LBL: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-family-geist)' };
  const ROField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <span style={LBL}>{label}</span>
      <div style={{ ...INP, display: 'flex', alignItems: 'center', backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderColor: 'transparent', paddingLeft: '10px', fontSize: '13px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-family-geist)', height: '36px', boxSizing: 'border-box' }}>
        {value}
      </div>
    </div>
  );
  const SelectField = ({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => (
    <div>
      <span style={LBL}>{label}</span>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...INP, appearance: 'none', paddingRight: '32px' }}>
          <option value="">{placeholder ?? 'Select…'}</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
      </div>
    </div>
  );

  const tiles = [
    { label: 'Inventory',         value: parent.inventoryName      },
    { label: 'Organization',      value: parent.organization       },
    { label: 'Date',              value: parent.date               },
    { label: 'Type',              value: parent.type               },
    { label: 'Slots',             value: String(slotCount)         },
    { label: 'Screen Connection', value: parent.screenConnection   },
  ];

  return ReactDOM.createPortal(
    <>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.4)', opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px', zIndex: 1101, backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transform: visible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', boxShadow: '-4px 0 32px rgba(0,0,0,0.12)' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: 'var(--font-family-geist)' }}>Campaign Detail</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', fontFamily: 'var(--font-family-geist)' }}>{child.campaignName}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '2px', fontFamily: 'var(--font-family-geist)' }}>{child.mediaPlanName}</div>
          </div>
          <button onClick={handleClose} style={{ padding: '6px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)' }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Info tiles 3 + 3 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              {tiles.slice(0, 3).map(t => <InfoTile key={t.label} label={t.label} value={t.value} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {tiles.slice(3).map(t => <InfoTile key={t.label} label={t.label} value={t.value} />)}
            </div>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <FlagChip flag={child.flag} />
            <SeverityBadge severity={child.severity} />
            <StatusBadge status={localStatus} />
          </div>

          <div style={DIV} />

          {/* ── Inventory Trend chart ── */}
          <div style={{ marginBottom: '4px' }}>
            <div style={SL}>Inventory Trend — Last 30 Days</div>
            <TrendChart data={chartData} />
          </div>

          <div style={DIV} />

          {/* ── Dataset table ── */}
          <div style={{ marginBottom: '16px' }}>
            <div style={SL}>Dataset</div>
            <style>{`@keyframes skPulse{0%,100%{opacity:.7}50%{opacity:.3}}`}</style>
            {!tableReady ? (
              <div>
                <div style={{ height: '34px', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)', marginBottom: '6px', animation: 'skPulse 1.4s ease-in-out infinite' }} />
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    {[0.9, 0.7, 0.7, 0.5].map((op, j) => (
                      <div key={j} style={{ height: '30px', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)', opacity: op, animation: 'skPulse 1.4s ease-in-out infinite' }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-family-geist)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    {['Metric', 'Current Imp', 'Suggested Imp', 'Published Imp'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'Impression', curr: fmtN(child.currentImpression),  sugg: fmtN(child.suggestedImpression), pub: isPublished ? fmtN(pubImpNum)      : '—' },
                    { metric: 'Reach',      curr: fmtN(currentReach),             sugg: fmtN(suggestedReach),            pub: isPublished ? fmtN(publishedReach) : '—' },
                    { metric: 'Frequency',  curr: currentFreq,                    sugg: suggestedFreq,                   pub: isPublished ? publishedFreq         : '—' },
                  ].map((row, ri) => (
                    <tr key={row.metric} style={{ backgroundColor: ri % 2 === 1 ? 'var(--muted)' : 'transparent' }}>
                      <td style={{ padding: '9px 10px', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{row.metric}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>{row.curr}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', color: '#b45309', fontWeight: 600 }}>{row.sugg}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', color: isPublished ? '#15803d' : 'var(--muted-foreground)', fontWeight: isPublished ? 600 : 400 }}>{row.pub}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Confidence level ── */}
          <div style={SL}>Confidence Level</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 14px', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontFamily: 'var(--font-family-geist)' }}>
              <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--foreground)' }}>{confidence}%</span>
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', display: 'block', marginTop: '1px' }}>Baseline: Same weekday last week</span>
            </div>
            <div style={{ flex: 1, height: '6px', borderRadius: '999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence}%`, borderRadius: '999px', backgroundColor: confidence >= 85 ? '#16a34a' : confidence >= 70 ? '#d97706' : '#dc2626' }} />
            </div>
          </div>

          <div style={DIV} />

          {/* ── Action area — per status + severity ── */}

          {/* ⓪ Healthy — no action needed */}
          {localStatus === 'Healthy' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)' }}>
              <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#16a34a', fontFamily: 'var(--font-family-geist)', fontWeight: 500 }}>
                This inventory is within normal range — no action required.
              </span>
            </div>
          )}

          {/* ① Need Review — Mild → Confirm & Publish (locked to suggested value) */}
          {localStatus === 'Need Review' && child.severity === 'Mild' && (
            <div>
              <div style={SL}>Confirm & Publish</div>
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 'var(--radius)', marginBottom: '14px', fontSize: '12px', color: '#a16207', fontFamily: 'var(--font-family-geist)' }}>
                Mild anomaly — values are within acceptable range. Confirm to publish with the system-suggested impression.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <ROField label="Published Imp (suggested)"   value={fmtN(child.suggestedImpression)} />
                <ROField label="Published Reach"             value={fmtN(suggestedReach)}             />
                <ROField label="Published Freq"              value={suggestedFreq}                    />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <SelectField
                  label="Assignee"
                  value={assignee}
                  onChange={setAssignee}
                  options={REVIEWERS}
                  placeholder="Select assignee…"
                />
              </div>
              <button
                onClick={() => {
                  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  setPublishedAt(now);
                  setPublishedBy(assignee || child.reviewer || 'Ops Team');
                  setLocalStatus('Published');
                  onUpdate(parent.id, child.id, { status: 'Published', publishedImpression: child.suggestedImpression, reviewer: assignee || child.reviewer });
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 18px', height: '38px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#16a34a', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                <CheckCircle2 size={15} /> Confirm &amp; Publish
              </button>
            </div>
          )}

          {/* ② Need Review — Critical → Escalate */}
          {localStatus === 'Need Review' && child.severity === 'Critical' && (
            <div>
              <div style={SL}>Escalate to Data Ops</div>
              <div style={{ padding: '10px 12px', backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius)', marginBottom: '14px', fontSize: '12px', color: '#dc2626', fontFamily: 'var(--font-family-geist)' }}>
                <ShieldAlert size={13} style={{ display: 'inline', marginRight: '6px' }} />
                Critical severity — this item must be reviewed by Data Ops before publishing.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <ROField label="Current Imp (ref)"   value={fmtN(child.currentImpression)}   />
                <ROField label="Suggested Imp (ref)"  value={fmtN(child.suggestedImpression)}  />
                <ROField label="Published Imp (ref)"  value="—" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <span style={LBL}>Assign to Data Ops <span style={{ color: '#dc2626' }}>*</span></span>
                  <div style={{ position: 'relative' }}>
                    <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ ...INP, appearance: 'none', paddingRight: '32px', borderColor: !assignee ? '#dc2626' : 'var(--border)' }}>
                      <option value="">Select person…</option>
                      {DATA_OPS_TEAM.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
                  </div>
                </div>
                <SelectField label="Reason (optional)" value={reason} onChange={setReason} options={REASONS} placeholder="Select reason…" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={LBL}>Notes (optional)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...INP, height: '60px', resize: 'vertical', paddingTop: '8px' }} />
              </div>
              <button onClick={handleEscalate} disabled={!assignee} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 18px', height: '38px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: !assignee ? 'var(--muted)' : '#d97706', color: !assignee ? 'var(--muted-foreground)' : 'white', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: !assignee ? 'not-allowed' : 'pointer' }}>
                <Send size={14} /> Escalate to Data Ops
              </button>
            </div>
          )}

          {/* ③ Investigating → Mark as Resolved */}
          {localStatus === 'Investigating' && (
            <div>
              <div style={SL}>Under Investigation</div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', fontFamily: 'var(--font-family-geist)' }}>Escalation Context</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', fontFamily: 'var(--font-family-geist)' }}>
                  <div><span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Escalated To</span><div style={{ fontWeight: 500 }}>{escalatedTo ?? child.reviewer ?? 'Data Ops'}</div></div>
                  <div><span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Escalated On</span><div style={{ fontWeight: 500 }}>{escalatedAt ?? parent.date}</div></div>
                  <div><span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Current Imp</span><div style={{ fontWeight: 500 }}>{fmtN(child.currentImpression)}</div></div>
                  <div><span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Suggested Imp</span><div style={{ fontWeight: 500 }}>{fmtN(child.suggestedImpression)}</div></div>
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={LBL}>Resolution notes (optional)</span>
                <textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} rows={2} placeholder="Describe what Data Ops fixed…" style={{ ...INP, height: '60px', resize: 'vertical', paddingTop: '8px' }} />
              </div>
              <button onClick={handleResolve} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 18px', height: '38px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                <Check size={15} /> Mark as Resolved
              </button>
            </div>
          )}

          {/* ④ Resolved — case summary (read-only) */}
          {localStatus === 'Resolved' && (
            <div>
              <div style={SL}>Case Resolved</div>

              {/* Escalation Context */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', fontFamily: 'var(--font-family-geist)' }}>
                  Escalation Context
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: 'var(--font-family-geist)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', lineHeight: '16.5px' }}>Escalated To</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: '19.5px' }}>{escalatedTo ?? child.reviewer ?? 'Data Ops'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', lineHeight: '16.5px' }}>Escalated On</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: '19.5px' }}>{escalatedAt ?? parent.date}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', lineHeight: '16.5px' }}>Previous Imp</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: '19.5px' }}>{fmtN(child.currentImpression)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', lineHeight: '16.5px' }}>Suggested Imp</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: '19.5px' }}>{fmtN(child.suggestedImpression)}</div>
                  </div>
                </div>
              </div>

              {/* Resolution notes */}
              <div style={{ paddingBottom: '14px' }}>
                <span style={LBL}>Resolution notes (optional)</span>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Ada perbaikan data di pipeline etc …"
                  style={{ ...INP, height: '60px', resize: 'vertical', paddingTop: '8px' }}
                />
              </div>

              <div style={DIV} />

              {/* Resolved — read-only label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Lock size={14} style={{ color: '#7C3AED' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED', fontFamily: 'var(--font-family-geist)' }}>
                  Resolved — read-only
                </span>
              </div>

              {/* Resolve metadata box */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: 'var(--font-family-geist)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', lineHeight: '16.5px' }}>Resolve On</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: '19.5px' }}>{resolvedAt ?? parent.date}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', lineHeight: '16.5px' }}>Resolved By</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: '19.5px' }}>{resolvedBy || child.reviewer || 'Ops Team'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ⑤ Published — read-only confirmation */}
          {localStatus === 'Published' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Lock size={14} style={{ color: '#7C3AED' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED', fontFamily: 'var(--font-family-geist)' }}>Published — read-only</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', fontFamily: 'var(--font-family-geist)' }}>
                  <div><span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Published On</span><div style={{ fontWeight: 500 }}>{publishedAt ?? parent.date}</div></div>
                  <div><span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Published By</span><div style={{ fontWeight: 500 }}>{publishedBy}</div></div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <ROField label="Published Imp"   value={fmtN(pubImpNum)}       />
                <ROField label="Published Reach"  value={fmtN(publishedReach)}  />
                <ROField label="Published Freq"   value={publishedFreq}         />
              </div>
              {reason && <ROField label="Reason" value={reason} />}
              {notes  && <div style={{ marginTop: '10px' }}><ROField label="Notes" value={notes} /></div>}
            </div>
          )}

        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortField = 'inventoryName' | 'date' | 'publishedCount';
type SortDir = 'asc' | 'desc';

function sortInventories(rows: InventoryRow[], field: SortField, dir: SortDir): InventoryRow[] {
  return [...rows].sort((a, b) => {
    let av: string | number = 0;
    let bv: string | number = 0;
    if (field === 'inventoryName') { av = a.inventoryName; bv = b.inventoryName; }
    else if (field === 'date')     { av = a.dateObj.getTime(); bv = b.dateObj.getTime(); }
    else if (field === 'publishedCount') {
      av = a.children.filter(c => c.status === 'Published').length;
      bv = b.children.filter(c => c.status === 'Published').length;
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronDown size={13} style={{ opacity: 0.35 }} />;
  return sortDir === 'asc' ? <ChevronUp size={13} style={{ color: '#7C3AED' }} /> : <ChevronDown size={13} style={{ color: '#7C3AED' }} />;
}

// ─── CalendarPicker ───────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();

  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear]   = useState(selected?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth()     ?? today.getMonth());

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ day: number; month: 'prev' | 'cur' | 'next' }> = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, month: 'prev' });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, month: 'cur' });
  while (cells.length < 42)
    cells.push({ day: cells.length - daysInMonth - firstDay + 1, month: 'next' });

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${viewYear}-${mm}-${dd}`;
    onChange(value === iso ? '' : iso);
    setOpen(false);
  };

  const isSelected = (day: number) =>
    selected?.getFullYear() === viewYear &&
    selected?.getMonth()    === viewMonth &&
    selected?.getDate()     === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth()    === viewMonth &&
    today.getDate()     === day;

  const displayValue = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', height: '36px', padding: '0 10px',
          border: `1px solid ${open ? '#7C3AED' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--input-background)',
          color: displayValue ? 'var(--foreground)' : 'var(--muted-foreground)',
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)', cursor: 'pointer',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      >
        <Calendar size={13} style={{ flexShrink: 0, color: 'var(--muted-foreground)' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{displayValue || 'Select date'}</span>
        {displayValue && (
          <span
            onClick={e => { e.stopPropagation(); onChange(''); }}
            style={{ display: 'inline-flex', cursor: 'pointer', color: 'var(--muted-foreground)', lineHeight: 1 }}
          >
            <X size={12} />
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
          backgroundColor: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '16px', width: '272px',
        }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[{ icon: ChevronLeft, fn: prevMonth }, { icon: ChevronRight, fn: nextMonth }].map(({ icon: Icon, fn }) => (
                <button key={fn.toString()} onClick={fn} style={{
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)',
                }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', padding: '4px 0', fontFamily: 'var(--font-family-geist)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((cell, i) => {
              const isCur  = cell.month === 'cur';
              const isSel  = isCur && isSelected(cell.day);
              const isTod  = isCur && isToday(cell.day);
              return (
                <button
                  key={i}
                  onClick={() => isCur && selectDay(cell.day)}
                  disabled={!isCur}
                  style={{
                    width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)', border: isTod && !isSel ? '1px solid rgba(124,58,237,0.4)' : 'none',
                    backgroundColor: isSel ? '#7C3AED' : 'transparent',
                    color: isSel ? 'white' : isCur ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontSize: '13px', fontFamily: 'var(--font-family-geist)',
                    cursor: isCur ? 'pointer' : 'default',
                    opacity: !isCur ? 0.3 : 1,
                    transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={e => { if (isCur && !isSel) e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
                  onMouseLeave={e => { if (isCur && !isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────

function MultiSelect({
  options, value, onChange, placeholder,
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  };

  const label = value.length === 0
    ? placeholder
    : value.length === 1
      ? value[0]
      : `${value.length} selected`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          width: '100%', height: '36px', padding: '0 10px',
          border: `1px solid ${open ? '#7C3AED' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--input-background)',
          color: value.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)', cursor: 'pointer',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        {value.length > 0 && (
          <span
            onClick={e => { e.stopPropagation(); onChange([]); }}
            style={{ display: 'inline-flex', cursor: 'pointer', color: 'var(--muted-foreground)', lineHeight: 1, flexShrink: 0 }}
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
          backgroundColor: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '100%', overflow: 'hidden',
        }}>
          {options.map(opt => {
            const checked = value.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', border: 'none',
                  backgroundColor: checked ? 'rgba(124,58,237,0.06)' : 'transparent',
                  color: 'var(--foreground)', cursor: 'pointer',
                  fontFamily: 'var(--font-family-geist)', fontSize: '13px',
                  transition: 'background-color 0.12s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{
                  width: '15px', height: '15px', borderRadius: '3px', flexShrink: 0,
                  border: checked ? '1px solid #7C3AED' : '1px solid var(--border)',
                  backgroundColor: checked ? '#7C3AED' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <Check size={10} style={{ color: 'white' }} />}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50];

export function CampaignReport() {
  const [data, setData] = useState<InventoryRow[]>(INITIAL_DATA);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [drawerItem, setDrawerItem] = useState<{ child: CampaignRow; parent: InventoryRow } | null>(null);

  // Filters — default date to today so the page opens showing only today's data
  const todayISO = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(todayISO);
  const [filterSeverity, setFilterSeverity] = useState<string[]>([]);
  const [filterOrg, setFilterOrg] = useState<string[]>([]);
  const [filterReviewer, setFilterReviewer] = useState<string[]>([]);

  // ── Inline edits ─────────────────────────────────────────────────────────────
  const updateChild = (invId: string, childId: string, patch: Partial<CampaignRow>) => {
    setData(prev => prev.map(inv =>
      inv.id !== invId ? inv : {
        ...inv,
        children: inv.children.map(c => c.id !== childId ? c : { ...c, ...patch }),
      }
    ));
  };

  // ── Filtering logic ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.map(inv => {
      let children = inv.children;

      // Status tab filter
      if (activeTab !== 'all') {
        const tabStatus = activeTab as StatusType;
        children = children.filter(c => c.status === tabStatus);
      }

      // Search
      if (q) {
        children = children.filter(c =>
          inv.inventoryName.toLowerCase().includes(q) ||
          c.campaignName.toLowerCase().includes(q) ||
          c.mediaPlanName.toLowerCase().includes(q)
        );
      }

      // Filters panel
      if (filterDate) {
        const d = new Date(filterDate + 'T00:00:00');
        if (d.toDateString() !== inv.dateObj.toDateString()) return null;
      }
      if (filterOrg.length > 0 && !filterOrg.includes(inv.organization)) return null;
      if (filterSeverity.length > 0) {
        children = children.filter(c =>
          filterSeverity.includes(c.severity ?? 'None')
        );
      }
      if (filterReviewer.length > 0) {
        children = children.filter(c =>
          filterReviewer.includes('Unassigned') && !c.reviewer
            ? true
            : c.reviewer !== null && filterReviewer.includes(c.reviewer)
        );
      }

      if (children.length === 0) return null;
      return { ...inv, children };
    }).filter(Boolean) as InventoryRow[];
  }, [data, activeTab, search, filterDate, filterSeverity, filterOrg, filterReviewer]);

  // Auto-expand rows that were narrowed by filters
  useEffect(() => {
    const hasActiveFilter = filterDate || filterSeverity.length > 0 || filterOrg.length > 0 || filterReviewer.length > 0 || search || activeTab !== 'all';
    if (hasActiveFilter) {
      setExpandedRows(new Set(filtered.map(r => r.id)));
    }
  }, [filtered, filterDate, filterSeverity, filterOrg, filterReviewer, search, activeTab]);

  const sorted = useMemo(() => sortInventories(filtered, sortField, sortDir), [filtered, sortField, sortDir]);

  // Tab counts — number of inventory rows that would appear under each tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, 'Healthy': 0, 'Need Review': 0, 'Investigating': 0, 'Resolved': 0, 'Published': 0 };
    data.forEach(inv => {
      counts['all']++;
      const seen = new Set<string>();
      inv.children.forEach(c => {
        if (!seen.has(c.status)) {
          seen.add(c.status);
          counts[c.status] = (counts[c.status] ?? 0) + 1;
        }
      });
    });
    return counts;
  }, [data]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setFilterDate(''); setFilterSeverity([]); setFilterOrg([]); setFilterReviewer([]);
    setSearch(''); setActiveTab('all');
  };

  const activeFilterCount = [
    filterDate,
    ...filterSeverity, ...filterOrg, ...filterReviewer,
  ].filter(Boolean).length;
  const orgs = useMemo(() => [...new Set(data.map(r => r.organization))], [data]);

  const tabs = [
    { label: 'All',          value: 'all',           count: tabCounts['all']           },
    { label: 'Healthy',      value: 'Healthy',        count: tabCounts['Healthy']       },
    { label: 'Need Review',  value: 'Need Review',    count: tabCounts['Need Review']   },
    { label: 'Investigating',value: 'Investigating',  count: tabCounts['Investigating'] },
    { label: 'Resolved',     value: 'Resolved',       count: tabCounts['Resolved']      },
    { label: 'Published',    value: 'Published',      count: tabCounts['Published']     },
  ];

  // Shared input style
  const inputStyle: React.CSSProperties = {
    height: '36px',
    padding: '0 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--input-background)',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-family-geist)',
    fontSize: 'var(--text-14)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontFamily: 'var(--font-family-geist)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--muted)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    fontSize: '13px',
    fontFamily: 'var(--font-family-geist)',
    color: 'var(--foreground)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', maxWidth: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
          QC / Campaign Report
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>
              Campaign Report
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px', lineHeight: 1.5, fontWeight: 400 }}>
              Review flagged data anomalies by inventory before publishing campaign reports to clients.
            </p>
          </div>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 500, cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              style={{
                position: 'relative',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 500,
                color: activeTab === tab.value ? '#7C3AED' : 'var(--muted-foreground)',
                cursor: 'pointer',
                transition: 'color 0.15s',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeTab !== tab.value) e.currentTarget.style.color = 'var(--foreground)'; }}
              onMouseLeave={e => { if (activeTab !== tab.value) e.currentTarget.style.color = 'var(--muted-foreground)'; }}
            >
              <span>{tab.label}</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '20px', height: '18px', padding: '0 5px',
                borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                backgroundColor: activeTab === tab.value ? 'rgba(124,58,237,0.12)' : 'var(--muted)',
                color: activeTab === tab.value ? '#7C3AED' : 'var(--muted-foreground)',
              }}>
                {tab.count}
              </span>
              {activeTab === tab.value && (
                <div style={{
                  position: 'absolute', bottom: '-1px', left: 0, right: 0,
                  height: '2px', backgroundColor: '#7C3AED',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + Filters row ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '16px' : '0' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--muted-foreground)', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by inventory name, campaign name, media plan name..."
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '0 14px', height: '36px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: showFilters ? 'var(--muted)' : 'transparent',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
              transition: 'background-color 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#7C3AED', color: 'white',
                fontSize: '11px', fontWeight: 600,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div style={{
            padding: '16px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {/* Date */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'var(--font-family-geist)' }}>
                  DATE
                </div>
                <CalendarPicker value={filterDate} onChange={v => { setFilterDate(v); setPage(1); }} />
              </div>
              {/* Severity */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'var(--font-family-geist)' }}>
                  SEVERITY
                </div>
                <MultiSelect
                  options={['Normal', 'Mild', 'Critical', 'None']}
                  value={filterSeverity}
                  onChange={v => { setFilterSeverity(v); setPage(1); }}
                  placeholder="All severities"
                />
              </div>
              {/* Organization */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'var(--font-family-geist)' }}>
                  ORGANIZATION
                </div>
                <MultiSelect
                  options={orgs}
                  value={filterOrg}
                  onChange={v => { setFilterOrg(v); setPage(1); }}
                  placeholder="All organizations"
                />
              </div>
              {/* Reviewer */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'var(--font-family-geist)' }}>
                  REVIEWER
                </div>
                <MultiSelect
                  options={['Unassigned', ...REVIEWERS]}
                  value={filterReviewer}
                  onChange={v => { setFilterReviewer(v); setPage(1); }}
                  placeholder="All reviewers"
                />
              </div>
            </div>

            {/* Active chips + clear */}
            {activeFilterCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {filterDate && <FilterChip label={`Date: ${filterDate}`} onRemove={() => { setFilterDate(''); setPage(1); }} />}
                {filterSeverity.map(s => <FilterChip key={s} label={`Severity: ${s}`} onRemove={() => { setFilterSeverity(filterSeverity.filter(x => x !== s)); setPage(1); }} />)}
                {filterOrg.map(o => <FilterChip key={o} label={`Org: ${o}`} onRemove={() => { setFilterOrg(filterOrg.filter(x => x !== o)); setPage(1); }} />)}
                {filterReviewer.map(r => <FilterChip key={r} label={`Reviewer: ${r}`} onRemove={() => { setFilterReviewer(filterReviewer.filter(x => x !== r)); setPage(1); }} />)}
                <button
                  onClick={clearFilters}
                  style={{ fontSize: '12px', color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', padding: '0 4px' }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px', fontFamily: 'var(--font-family-geist)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Showing {sorted.length} of {data.length} inventories.</span>
        {filterDate && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 500,
            color: '#7C3AED',
            backgroundColor: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '999px', padding: '1px 8px',
          }}>
            <Calendar size={11} />
            {new Date(filterDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {filterDate === todayISO && <span style={{ fontWeight: 400, opacity: 0.8 }}> · current date</span>}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <BarChart2 size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px', fontFamily: 'var(--font-family-geist)' }}>
              No results
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>
              Try adjusting your filters or search query.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '36px' }} />
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('inventoryName')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Inventory Name <SortIcon field="inventoryName" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th style={thStyle}>Organization</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('date')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Date <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Screen Connection</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('publishedCount')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Total Campaign <SortIcon field="publishedCount" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th style={{ ...thStyle, width: '120px' }} />
                  <th style={{ ...thStyle, width: '120px' }} />
                  <th style={{ ...thStyle, width: '120px' }} />
                  <th style={{ ...thStyle, width: '60px' }} />
                </tr>
              </thead>
              <tbody>
                {paginated.map(inv => {
                  const isExpanded = expandedRows.has(inv.id);
                  return (
                    <React.Fragment key={inv.id}>
                      {/* Parent row */}
                      <tr
                        key={inv.id}
                        onClick={() => toggleRow(inv.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#efefef' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f3f3'; }}
                        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ ...tdStyle, width: '36px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '20px', height: '20px', borderRadius: 'var(--radius-sm)',
                            color: 'var(--muted-foreground)',
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}>
                            <ChevronRight size={14} />
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{inv.inventoryName}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{inv.organization}</span>
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          {String(inv.dateObj.getDate()).padStart(2,'0')}-{String(inv.dateObj.getMonth()+1).padStart(2,'0')}-{inv.dateObj.getFullYear()}
                        </td>
                        <td style={tdStyle}><TypeTag type={inv.type} /></td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: inv.screenConnection === 'N/A' ? 'var(--muted-foreground)' : 'var(--foreground)',
                            fontFamily: 'var(--font-family-geist)',
                          }}>
                            {inv.screenConnection}
                          </span>
                        </td>
                        <td style={tdStyle}><PublishedCountBadge children={inv.children} /></td>
                        <td style={{ ...tdStyle, width: '120px' }} />
                        <td style={{ ...tdStyle, width: '120px' }} />
                        <td style={{ ...tdStyle, width: '120px' }} />
                        <td style={{ ...tdStyle, width: '60px' }} />
                      </tr>

                      {/* Children rows */}
                      {isExpanded && (
                        <>
                          {/* Child header */}
                          <tr>
                            <td style={{ backgroundColor: '#e2e2e2', borderBottom: '1px solid var(--border)', borderLeft: '3px solid #7C3AED' }} />
                            <th style={{ ...thStyle, paddingLeft: '40px', backgroundColor: '#e2e2e2', fontSize: '11px' }}>Campaign / Media Plan</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px' }}>Flag</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px' }}>Severity</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px' }}>Status</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px' }} />
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px', width: '120px', color: 'var(--muted-foreground)' }}>Current Imp.</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px', width: '120px', color: '#b45309' }}>Suggested Imp.</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px', width: '120px', color: '#15803d' }}>Published Imp.</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px' }}>Reviewer</th>
                            <th style={{ ...thStyle, backgroundColor: '#e2e2e2', fontSize: '11px', width: '60px' }}>Action</th>
                          </tr>
                          {inv.children.map(child => {
                            const isPublished = child.status === 'Published';
                            const fmtN = (n: number) => n.toLocaleString();
                            return (
                            <tr
                              key={child.id}
                              style={{ backgroundColor: '#f9f9f9' }}
                            >
                              <td style={{ ...tdStyle, borderLeft: '3px solid #7C3AED' }} />
                              <td style={{ ...tdStyle, paddingLeft: '40px' }}>
                                <div style={{ fontWeight: 500 }}>{child.campaignName}</div>
                                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{child.mediaPlanName}</div>
                              </td>
                              <td style={tdStyle}><FlagChip flag={child.flag} /></td>
                              <td style={tdStyle}><SeverityBadge severity={child.severity} /></td>
                              <td style={{ ...tdStyle, minWidth: '140px' }}>
                                {child.status === 'Healthy' ? (
                                  <StatusBadge status={child.status} />
                                ) : (
                                  <StatusInlineEditor
                                    status={child.status}
                                    onChange={s => updateChild(inv.id, child.id, { status: s })}
                                  />
                                )}
                              </td>
                              <td style={tdStyle} />
                              {/* Current Impression */}
                              <td style={{ ...tdStyle, width: '120px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                                  {fmtN(child.currentImpression)}
                                </span>
                              </td>
                              {/* Suggested Impression */}
                              <td style={{ ...tdStyle, width: '120px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                                  {fmtN(child.suggestedImpression)}
                                </span>
                              </td>
                              {/* Published Impression — only for Published rows */}
                              <td style={{ ...tdStyle, width: '120px' }}>
                                {isPublished && child.publishedImpression != null ? (
                                  <span style={{
                                    fontSize: '13px', fontWeight: 700, color: '#15803d',
                                    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  }}>
                                    <Check size={12} strokeWidth={3} />
                                    {fmtN(child.publishedImpression)}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>—</span>
                                )}
                              </td>
                              <td style={{ ...tdStyle, minWidth: '150px' }}>
                                <ReviewerPill
                                  reviewer={child.reviewer}
                                  onAssign={r => updateChild(inv.id, child.id, { reviewer: r })}
                                />
                              </td>
                              <td style={tdStyle}>
                                <button
                                  onClick={e => { e.stopPropagation(); startTransition(() => setDrawerItem({ child, parent: inv })); }}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)', backgroundColor: 'transparent',
                                    color: 'var(--muted-foreground)', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                                  title="View detail"
                                >
                                  <Eye size={13} />
                                </button>
                              </td>
                            </tr>
                            );
                          })}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer / Pagination ── */}
      {sorted.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>
            Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Page size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>Rows per page:</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{
                    height: '32px', padding: '0 28px 0 8px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--input-background)', color: 'var(--foreground)',
                    fontFamily: 'var(--font-family-geist)', fontSize: '13px',
                    appearance: 'none', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
              </div>
            </div>

            {/* Prev/Next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PaginationButton disabled={page === 1}         onClick={() => setPage(p => p - 1)}><ChevronLeft  size={14} /></PaginationButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PaginationButton key={p} active={p === page} onClick={() => setPage(p)}>{p}</PaginationButton>
              ))}
              <PaginationButton disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></PaginationButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer ── */}
      {drawerItem && (
        <DetailDrawer
          child={drawerItem.child}
          parent={drawerItem.parent}
          onClose={() => setDrawerItem(null)}
          onUpdate={updateChild}
        />
      )}
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '999px',
      backgroundColor: 'rgba(124,58,237,0.1)', color: '#7C3AED',
      fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-family-geist)',
      border: '1px solid rgba(124,58,237,0.25)',
    }}>
      {label}
      <button onClick={onRemove} style={{ display: 'inline-flex', border: 'none', background: 'none', color: '#7C3AED', cursor: 'pointer', padding: '0', lineHeight: 1 }}>
        <X size={11} />
      </button>
    </span>
  );
}

function PaginationButton({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: 'var(--radius)',
        border: active ? '1px solid #7C3AED' : '1px solid var(--border)',
        backgroundColor: active ? '#7C3AED' : disabled ? 'transparent' : 'var(--card)',
        color: active ? 'white' : disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
        fontSize: '13px', fontFamily: 'var(--font-family-geist)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
