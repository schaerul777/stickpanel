import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, TriangleAlert,
  Zap, Info,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import type { Driver } from './DriversTable';

// ── Helpers ───────────────────────────────────────────────────────────────────

function seededVal(seed: number, index: number, min: number, max: number): number {
  const x = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453123;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min + 1));
}

const CAMPAIGN_NAMES = [
  'Gojek Ramadan Q1', 'Tokopedia Summer', 'Shopee 9.9 Campaign', 'Grab Eid Campaign',
  'GoPay Loyalty Q1', 'Lazada 12.12 Mega', 'OVO Cashback Run', 'Dana Promo Nov',
  'Blibli Harbolnas', 'Bukalapak Deals', 'ShopeePay Festival', 'Grab Year End',
  'Tokopedia Flash Sale', 'Shopee Year-End', 'GoFood Special',
];

const MONTHS      = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const MONTHS_FULL = ['Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025'];

const ABANDON_REASONS = [
  'Schedule conflict', 'Vehicle breakdown', 'Personal emergency',
  'No longer interested', 'No show', 'Technical issue',
];
const CAMP_STATUSES = [
  'Completed', 'Completed', 'Completed', 'Completed',
  'In Progress',
  'Abandoned - Driver Request', 'Abandoned - No Show',
  'Abandoned - Technical Issue', 'Abandoned - Other',
];
const REP_STATUSES = [
  'Submitted On Time', 'Submitted On Time', 'Submitted On Time',
  'Submitted Late', 'Missing - Overdue', 'Not Yet Due',
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SemiGauge({ value, size = 140, color: colorProp }: {
  value: number; size?: number; color?: string;
}) {
  const sw = 14;
  const r  = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ     = 2 * Math.PI * r;
  const semiCirc = Math.PI * r;
  const filled   = Math.max(0, Math.min((value / 100) * semiCirc, semiCirc - 0.5));
  const defColor = value >= 90 ? '#10B981' : value >= 70 ? '#F59E0B' : value >= 50 ? '#F97316' : '#EF4444';
  const color    = colorProp ?? defColor;
  const svgH     = Math.ceil(cy + sw / 2 + 2);

  return (
    <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`} style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--color-border)" strokeWidth={sw}
        strokeDasharray={`${semiCirc} ${semiCirc}`}
        transform={`rotate(180 ${cx} ${cy})`}
        strokeLinecap="round"
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={sw}
        strokeDasharray={`${filled} ${circ - filled}`}
        transform={`rotate(180 ${cx} ${cy})`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.9s ease' }}
      />
    </svg>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', cursor: 'help',
          padding: '1px', display: 'flex', alignItems: 'center',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <Info size={13} />
      </button>
      {visible && (
        <div style={{
          position: 'absolute', left: '20px', top: '-6px', zIndex: 200,
          backgroundColor: '#1E293B', color: '#F8FAFC',
          padding: '8px 12px', borderRadius: '8px',
          fontFamily: 'var(--font-family-geist)', fontSize: '12px',
          width: '230px', lineHeight: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
      <span style={{
        fontFamily: 'var(--font-family-geist)',
        fontSize: 'var(--text-14)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-foreground)',
      }}>
        {title}
      </span>
      <InfoTooltip text={tooltip} />
    </div>
  );
}

function MiniStatCard({
  icon, label, count, sub, color,
}: {
  icon: React.ReactNode; label: string; count: string; sub?: string; color: string;
}) {
  return (
    <div style={{
      flex: 1, padding: '12px', borderRadius: 'var(--radius)',
      border: `1px solid ${color}30`,
      backgroundColor: `${color}0f`,
      textAlign: 'center',
    }}>
      <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
        {icon}
      </div>
      <div style={{
        fontFamily: 'var(--font-family-geist)', fontSize: '20px',
        fontWeight: 'var(--font-weight-bold)', color, lineHeight: 1,
      }}>
        {count}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'var(--font-family-geist)', fontSize: '11px',
          color, opacity: 0.75, marginTop: '2px',
        }}>
          {sub}
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-family-geist)', fontSize: '11px',
        color: 'var(--color-muted-foreground)', marginTop: '3px',
      }}>
        {label}
      </div>
    </div>
  );
}

function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
        {cols.map(h => (
          <th key={h} style={{
            padding: '8px 12px', textAlign: 'left',
            fontFamily: 'var(--font-family-geist)', fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-muted-foreground)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
          }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DriverPerformanceTab({ driver }: { driver: Driver }) {
  const s = parseInt(driver.id.replace('DRV-', ''));

  // ── Campaign data ─────────────────────────────────────────────────────────
  const totalC  = seededVal(s, 300, 20, 50);
  const compPct = seededVal(s, 301, 52, 100);
  const doneC   = Math.round(totalC * compPct / 100);
  const inProgC = seededVal(s, 302, 0, Math.min(3, Math.max(0, totalC - doneC)));
  const abndC   = Math.max(0, totalC - doneC - inProgC);
  const campRate = +(doneC / totalC * 100).toFixed(1);

  // ── Report data ───────────────────────────────────────────────────────────
  const totalR  = seededVal(s, 310, 25, 65);
  const repPct  = seededVal(s, 311, 55, 100);
  const onTimeR = Math.round(totalR * repPct / 100);
  const lateR   = seededVal(s, 312, 0, Math.min(10, Math.max(0, totalR - onTimeR)));
  const missR   = Math.max(0, totalR - onTimeR - lateR);
  const repRate  = +(onTimeR / totalR * 100).toFixed(1);
  const avgDelay = (seededVal(s, 313, 10, 72) / 10).toFixed(1);
  const streak   = seededVal(s, 314, 1, 28);

  // ── Overall grade ─────────────────────────────────────────────────────────
  const overall = +(campRate * 0.5 + repRate * 0.5).toFixed(1);
  const grade = overall >= 95 ? { label: 'A+', color: '#059669', bg: 'rgba(5,150,105,0.1)',   border: 'rgba(5,150,105,0.25)'   }
              : overall >= 90 ? { label: 'A',  color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  }
              : overall >= 85 ? { label: 'B+', color: '#65A30D', bg: 'rgba(101,163,13,0.1)',  border: 'rgba(101,163,13,0.25)'  }
              : overall >= 80 ? { label: 'B',  color: '#D97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.25)'   }
              : overall >= 70 ? { label: 'C',  color: '#F97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)'  }
              : overall >= 60 ? { label: 'D',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   }
              :                 { label: 'F',  color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)'   };

  const campColor = campRate >= 90 ? '#10B981' : campRate >= 70 ? '#F59E0B' : campRate >= 50 ? '#F97316' : '#EF4444';
  const campLabel = campRate >= 90 ? 'Excellent' : campRate >= 70 ? 'Good' : campRate >= 50 ? 'Needs Improvement' : 'Poor';
  const repColor  = repRate  >= 95 ? '#10B981' : repRate  >= 80 ? '#F59E0B' : repRate  >= 60 ? '#F97316' : '#EF4444';
  const repLabel  = repRate  >= 95 ? 'Excellent' : repRate  >= 80 ? 'Good' : repRate  >= 60 ? 'Fair' : 'Poor';

  // ── Trend data ────────────────────────────────────────────────────────────
  const campTrend = MONTHS.map((month, i) => ({
    month, rate: seededVal(s, 320 + i, 55, 100),
  }));
  const repTrend = MONTHS.map((month, i) => {
    const tot = seededVal(s, 330 + i, 8, 15);
    const ot  = seededVal(s, 340 + i, Math.floor(tot * 0.5), tot);
    const lt  = seededVal(s, 350 + i, 0, Math.min(4, tot - ot));
    return { month, onTime: ot, late: lt, missing: Math.max(0, tot - ot - lt) };
  });

  const bestIdx  = campTrend.reduce((b, c, i) => c.rate > campTrend[b].rate ? i : b, 0);
  const worstIdx = campTrend.reduce((w, c, i) => c.rate < campTrend[w].rate ? i : w, 0);

  // ── Recent campaigns (10) ─────────────────────────────────────────────────
  const recentCamps = Array.from({ length: 10 }, (_, i) => {
    const st  = CAMP_STATUSES[seededVal(s, 360 + i, 0, CAMP_STATUSES.length - 1)];
    const isA = st.startsWith('Abandoned');
    return {
      id: i,
      name: CAMPAIGN_NAMES[seededVal(s, 370 + i, 0, CAMPAIGN_NAMES.length - 1)],
      joinDate: new Date(2024, seededVal(s, 380 + i, 0, 11), seededVal(s, 390 + i, 1, 28))
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: st,
      abandonReason: isA ? ABANDON_REASONS[seededVal(s, 400 + i, 0, ABANDON_REASONS.length - 1)] : null,
    };
  });

  // ── Recent reports (10) ───────────────────────────────────────────────────
  const recentReports = Array.from({ length: 10 }, (_, i) => {
    const st      = REP_STATUSES[seededVal(s, 410 + i, 0, REP_STATUSES.length - 1)];
    const daysOff = st === 'Submitted Late'   ? seededVal(s, 420 + i, 1, 7)
                  : st === 'Missing - Overdue' ? seededVal(s, 430 + i, 2, 14)
                  : st === 'Not Yet Due'        ? seededVal(s, 440 + i, 1, 5)
                  : 0;
    const hasSubmit = st === 'Submitted On Time' || st === 'Submitted Late';
    return {
      id: i,
      campaign: CAMPAIGN_NAMES[seededVal(s, 450 + i, 0, CAMPAIGN_NAMES.length - 1)],
      dueDate: new Date(2024, seededVal(s, 460 + i, 0, 11), seededVal(s, 470 + i, 1, 28))
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      submitDate: hasSubmit
        ? new Date(2024, seededVal(s, 480 + i, 0, 11), seededVal(s, 490 + i, 1, 28))
            .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      status: st,
      daysOff,
    };
  });

  // ── Alert conditions ──────────────────────────────────────────────────────
  const hasLateAlert  = lateR >= 3 || missR >= 2;
  const hasDropAlert  = campRate < 70;

  // ── Badge helpers ─────────────────────────────────────────────────────────
  const campBadge = (status: string) => {
    const m: Record<string, { bg: string; color: string; label: string }> = {
      'Completed':                   { bg: 'rgba(16,185,129,0.12)',  color: '#059669', label: '✓ Completed' },
      'In Progress':                 { bg: 'rgba(59,130,246,0.12)',  color: '#2563EB', label: '⏱ In Progress' },
      'Abandoned - Driver Request':  { bg: 'rgba(245,158,11,0.12)', color: '#D97706', label: 'Driver Request' },
      'Abandoned - No Show':         { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626', label: 'No Show' },
      'Abandoned - Technical Issue': { bg: 'rgba(107,114,128,0.12)', color: '#4B5563', label: 'Technical Issue' },
      'Abandoned - Other':           { bg: 'rgba(107,114,128,0.12)', color: '#4B5563', label: 'Abandoned – Other' },
    };
    return m[status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563', label: status };
  };

  const repBadge = (status: string) => {
    const m: Record<string, { bg: string; color: string }> = {
      'Submitted On Time': { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
      'Submitted Late':    { bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
      'Missing - Overdue': { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
      'Not Yet Due':       { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' },
    };
    return m[status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
  };

  const timingText = (st: string, d: number) => {
    if (st === 'Submitted On Time') return { text: 'On time',        color: '#10B981' };
    if (st === 'Submitted Late')    return { text: `+${d}d late`,    color: '#F59E0B' };
    if (st === 'Missing - Overdue') return { text: `${d}d overdue`,  color: '#EF4444' };
    if (st === 'Not Yet Due')       return { text: `${d}d left`,     color: 'var(--color-muted-foreground)' };
    return { text: '—', color: 'var(--color-muted-foreground)' };
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    padding: '18px 20px', borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-secondary)',
  };
  const subCardStyle: React.CSSProperties = {
    padding: '14px 16px', borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-geist)', fontSize: '11px',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-muted-foreground)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '8px',
  };
  const chartTooltipStyle = {
    fontFamily: 'var(--font-family-geist)', fontSize: 12,
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)', borderRadius: '6px',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ══ 1. OVERALL PERFORMANCE SCORE ══════════════════════════════════════ */}
      <div style={{
        padding: '20px', borderRadius: 'var(--radius)',
        border: `1px solid ${grade.border}`, backgroundColor: grade.bg,
        display: 'flex', alignItems: 'center', gap: '20px',
      }}>
        {/* Grade block */}
        <div style={{
          width: '72px', height: '72px', borderRadius: 'var(--radius)',
          backgroundColor: grade.color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '30px',
            fontWeight: 800, color: 'white', lineHeight: 1,
          }}>
            {grade.label}
          </span>
        </div>
        {/* Score details */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: grade.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Overall Performance Score
          </div>
          <div style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '30px',
            fontWeight: 800, color: 'var(--color-foreground)', lineHeight: 1, marginBottom: '4px',
          }}>
            {overall}%
          </div>
          <div style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '12px',
            color: 'var(--color-muted-foreground)',
          }}>
            Campaign completion (50%) + report timeliness (50%)
          </div>
        </div>
        {/* Component scores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          {[
            { label: 'Campaigns', value: campRate, color: campColor },
            { label: 'Reports',   value: repRate,  color: repColor  },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                color: 'var(--color-muted-foreground)',
              }}>
                {item.label}:{' '}
                <span style={{ color: item.color, fontWeight: 'var(--font-weight-semibold)' }}>
                  {item.value}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ 2. ALERTS ════════════════════════════════════════════════════════ */}
      {(hasLateAlert || hasDropAlert) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {hasLateAlert && (
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <TriangleAlert size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#DC2626' }}>
                <strong>Warning:</strong> Driver has{lateR >= 3 ? ` ${lateR} late` : ''}{lateR >= 3 && missR >= 2 ? ' and' : ''}{missR >= 2 ? ` ${missR} missing` : ''} report{(lateR + missR) !== 1 ? 's' : ''}. Consider a follow-up.
              </span>
            </div>
          )}
          {hasDropAlert && (
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <Zap size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#D97706' }}>
                <strong>Notice:</strong> Campaign completion rate is below 70% ({campRate}%). Driver performance needs attention.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══ 3. CAMPAIGN COMPLETION RATE ══════════════════════════════════════ */}
      <div>
        <SectionHeader
          title="Campaign Completion Rate"
          tooltip="Tracks how often the driver completes campaigns they join versus abandoning them mid-way"
        />

        {/* Main metric card */}
        <div style={{ ...cardStyle, marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Semi-circle gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <SemiGauge value={campRate} size={132} color={campColor} />
              <div style={{ marginTop: '-4px', textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: '26px',
                  fontWeight: 800, color: campColor, lineHeight: 1,
                }}>
                  {campRate}%
                </div>
                <span style={{
                  display: 'inline-block', marginTop: '4px',
                  padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  backgroundColor: `${campColor}20`, color: campColor,
                  fontFamily: 'var(--font-family-geist)',
                }}>
                  {campLabel}
                </span>
              </div>
            </div>

            {/* Right details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                color: 'var(--color-muted-foreground)', marginBottom: '14px',
              }}>
                {doneC} of {totalC} campaigns completed
              </div>
              {/* Breakdown mini cards */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <MiniStatCard icon={<CheckCircle2 size={15} />} label="Completed"  count={String(doneC)}   color="#10B981" />
                <MiniStatCard icon={<Clock size={15} />}        label="In Progress" count={String(inProgC)} color="#3B82F6" />
                <MiniStatCard icon={<XCircle size={15} />}      label="Abandoned"  count={String(abndC)}   color="#EF4444" />
              </div>
            </div>
          </div>
        </div>

        {/* 6-month completion trend */}
        <div style={{ ...subCardStyle, marginBottom: '10px' }}>
          <div style={labelStyle}>6-Month Completion Trend</div>
          <div style={{ height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={campTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month"
                  tick={{ fontFamily: 'var(--font-family-geist)', fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis domain={[0, 100]}
                  tick={{ fontFamily: 'var(--font-family-geist)', fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false} tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => [`${v}%`, 'Completion']}
                />
                <Line
                  type="monotone" dataKey="rate"
                  stroke={campColor} strokeWidth={2}
                  dot={{ fill: campColor, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent campaigns table */}
        <div style={labelStyle}>Recent Campaigns</div>
        <TableContainer>
          <THead cols={['Campaign', 'Join Date', 'Status', 'Abandon Reason']} />
          <tbody>
            {recentCamps.map(c => {
              const badge = campBadge(c.status);
              return (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-secondary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                >
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', color: 'var(--color-foreground)',
                    maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.name}
                  </td>
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap',
                  }}>
                    {c.joinDate}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                      fontSize: '11px', fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: badge.bg, color: badge.color,
                      fontFamily: 'var(--font-family-geist)',
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', color: 'var(--color-muted-foreground)',
                  }}>
                    {c.abandonReason ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableContainer>
      </div>

      {/* ══ 4. REPORT SUBMISSION PERFORMANCE ═════════════════════════════════ */}
      <div>
        <SectionHeader
          title="Report Submission Performance"
          tooltip="Tracks the driver's punctuality and consistency in submitting campaign evaluation reports"
        />

        {/* Main metric card */}
        <div style={{ ...cardStyle, marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Semi-circle gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <SemiGauge value={repRate} size={132} color={repColor} />
              <div style={{ marginTop: '-4px', textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: '26px',
                  fontWeight: 800, color: repColor, lineHeight: 1,
                }}>
                  {repRate}%
                </div>
                <span style={{
                  display: 'inline-block', marginTop: '4px',
                  padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  backgroundColor: `${repColor}20`, color: repColor,
                  fontFamily: 'var(--font-family-geist)',
                }}>
                  {repLabel}
                </span>
              </div>
            </div>

            {/* Right details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                color: 'var(--color-muted-foreground)', marginBottom: '14px',
              }}>
                Based on {totalR} total reports required
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <MiniStatCard
                  icon={<Zap size={15} />}
                  label="On Time" count={String(onTimeR)}
                  sub={`${+(onTimeR / totalR * 100).toFixed(1)}%`}
                  color="#10B981"
                />
                <MiniStatCard
                  icon={<Clock size={15} />}
                  label="Late" count={String(lateR)}
                  sub={`${+(lateR / totalR * 100).toFixed(1)}%`}
                  color="#F59E0B"
                />
                <MiniStatCard
                  icon={<TriangleAlert size={15} />}
                  label="Missing" count={String(missR)}
                  sub={`${+(missR / totalR * 100).toFixed(1)}%`}
                  color="#EF4444"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed breakdown */}
        <div style={{ ...subCardStyle, marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginBottom: '3px' }}>
              Avg. Delay (when late)
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-semibold)', color: '#F59E0B' }}>
              {avgDelay} days late
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginBottom: '3px' }}>
              Current Streak
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-semibold)', color: streak >= 10 ? '#10B981' : '#D97706' }}>
              {streak >= 5 ? '🔥 ' : ''}{streak} consecutive on-time
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginBottom: '3px' }}>
              Best Month
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)' }}>
              {MONTHS_FULL[bestIdx]}: {campTrend[bestIdx].rate}%
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginBottom: '3px' }}>
              Worst Month
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)' }}>
              {MONTHS_FULL[worstIdx]}: {campTrend[worstIdx].rate}%
            </div>
          </div>
        </div>

        {/* 6-month stacked bar chart */}
        <div style={{ ...subCardStyle, marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={labelStyle}>6-Month Submission Breakdown</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { label: 'On Time', color: '#10B981' },
                { label: 'Late',    color: '#F59E0B' },
                { label: 'Missing', color: '#EF4444' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: l.color }} />
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '110px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month"
                  tick={{ fontFamily: 'var(--font-family-geist)', fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: 'var(--font-family-geist)', fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false} tickLine={false}
                />
                <RechartsTooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="onTime"  stackId="a" fill="#10B981" name="On Time"  radius={[0, 0, 0, 0]} />
                <Bar dataKey="late"    stackId="a" fill="#F59E0B" name="Late" />
                <Bar dataKey="missing" stackId="a" fill="#EF4444" name="Missing" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent reports table */}
        <div style={labelStyle}>Recent Report Submissions</div>
        <TableContainer>
          <THead cols={['Campaign', 'Due Date', 'Submitted', 'Status', 'Timing']} />
          <tbody>
            {recentReports.map(r => {
              const badge  = repBadge(r.status);
              const timing = timingText(r.status, r.daysOff);
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-secondary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                >
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', color: 'var(--color-foreground)',
                    maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.campaign}
                  </td>
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap',
                  }}>
                    {r.dueDate}
                  </td>
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap',
                  }}>
                    {r.submitDate}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                      fontSize: '11px', fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: badge.bg, color: badge.color,
                      fontFamily: 'var(--font-family-geist)',
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
                    color: timing.color, whiteSpace: 'nowrap',
                  }}>
                    {timing.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableContainer>
      </div>

    </div>
  );
}