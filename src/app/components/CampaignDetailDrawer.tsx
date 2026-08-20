import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Edit, Copy, Pause, Play, StopCircle,
  Users, Coins, MapPin, Calendar, Zap,
  TrendingUp, Building2, Phone, Target,
  Car, FileText, Clock,
} from 'lucide-react';
import type { Campaign } from './CampaignsTable';

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onEdit: (campaign: Campaign) => void;
  onAction: (action: string, campaignId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPoints(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M pts`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K pts`;
  return `${n} pts`;
}

function getDaysRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff < 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDuration(startDate: string, endDate: string) {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: Campaign['status'] }) {
  const cfg = {
    active:    { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', dot: '#22C55E', label: 'Active' },
    draft:     { bg: 'rgba(115,115,115,0.1)', color: '#525252', dot: '#A3A3A3', label: 'Draft' },
    paused:    { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', dot: '#F59E0B', label: 'Paused' },
    completed: { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB', dot: '#3B82F6', label: 'Completed' },
  };
  const c = cfg[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
      backgroundColor: c.bg, color: c.color,
      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: Campaign['channel'] }) {
  const styles = {
    GTI:        { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB', border: 'rgba(59,130,246,0.25)' },
    TPI:        { bg: 'rgba(124,58,237,0.1)',  color: '#7C3AED', border: 'rgba(124,58,237,0.25)' },
    'NON GRAB': { bg: 'rgba(115,115,115,0.1)', color: '#525252', border: 'rgba(115,115,115,0.25)' },
  };
  const s = styles[channel];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em',
    }}>
      {channel}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div style={{
      backgroundColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
        <Icon size={14} style={{ color: accent ?? '#7C3AED', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-family-geist)', fontSize: '11px',
          fontWeight: 600, color: 'var(--color-muted-foreground)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)',
        fontWeight: 'var(--font-weight-semibold)', color: accent ?? 'var(--color-foreground)',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'var(--font-family-geist)', fontSize: '12px',
          fontWeight: 'var(--font-weight-normal)', color: 'var(--color-muted-foreground)',
          marginTop: '2px',
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(124,58,237,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
      }}>
        <Icon size={13} style={{ color: '#7C3AED' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-family-geist)', fontSize: '11px',
          fontWeight: 600, color: 'var(--color-muted-foreground)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px',
        }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-foreground)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CampaignDetailDrawer({ campaign, open, onClose, onEdit, onAction }: CampaignDetailDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const pct = campaign ? Math.round((campaign.pointsUsed / campaign.pointsBudget) * 100) : 0;
  const daysLeft = campaign ? getDaysRemaining(campaign.endDate) : null;
  const duration = campaign ? getDuration(campaign.startDate, campaign.endDate) : 0;
  const progressColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#22C55E';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              zIndex: 50,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { type: 'tween', duration: 0.26, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.85 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '520px',
              backgroundColor: 'var(--color-card)',
              boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
              zIndex: 51,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {campaign && (
              <>
                {/* ── Header ── */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
                  flexShrink: 0,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <CampaignStatusBadge status={campaign.status} />
                      <ChannelBadge channel={campaign.channel} />
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)',
                      fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)',
                      marginBottom: '2px', lineHeight: 1.3,
                    }}>
                      {campaign.name}
                    </h2>
                    <p style={{
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-normal)', color: 'var(--color-muted-foreground)',
                    }}>
                      {campaign.client} · {campaign.id}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      width: '32px', height: '32px', borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      color: 'var(--color-muted-foreground)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.color = 'var(--color-foreground)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-muted-foreground)'; }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                  {/* Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                    <MetricCard
                      icon={Users}
                      label="Enrolled Drivers"
                      value={campaign.driversEnrolled.toLocaleString()}
                      sub="across all cities"
                      accent="#7C3AED"
                    />
                    <MetricCard
                      icon={Target}
                      label="Progress"
                      value={`${pct}%`}
                      sub={`of budget used`}
                      accent={progressColor}
                    />
                    <MetricCard
                      icon={Coins}
                      label="Points Used"
                      value={formatPoints(campaign.pointsUsed)}
                      sub={`of ${formatPoints(campaign.pointsBudget)} budget`}
                      accent="#D97706"
                    />
                    <MetricCard
                      icon={Zap}
                      label="Trips Completed"
                      value={campaign.totalTripsCompleted.toLocaleString()}
                      sub={`${campaign.pointsPerTrip} pts per trip`}
                      accent="#0891B2"
                    />
                  </div>

                  {/* Points Progress Bar */}
                  <div style={{
                    backgroundColor: 'var(--color-secondary)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    border: '1px solid var(--color-border)',
                    marginBottom: '24px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Points Burn Rate
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: progressColor }}>
                        {pct}% used
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(pct, 100)}%`,
                        backgroundColor: progressColor,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>
                        {formatPoints(campaign.pointsUsed)} used
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>
                        {formatPoints(campaign.pointsBudget - campaign.pointsUsed)} remaining
                      </span>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)', fontSize: '11px',
                      fontWeight: 600, color: 'var(--color-muted-foreground)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: '4px',
                    }}>
                      Campaign Details
                    </div>

                    <DetailRow icon={Building2} label="Client">
                      <div>{campaign.client}</div>
                      {campaign.contactPerson && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--color-muted-foreground)' }}>
                          <Phone size={11} />
                          <span style={{ fontSize: '12px' }}>{campaign.contactPerson}</span>
                        </div>
                      )}
                    </DetailRow>

                    <DetailRow icon={Calendar} label="Campaign Period">
                      <div>{formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                          {duration} days total
                        </span>
                        {daysLeft !== null && campaign.status === 'active' && (
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: daysLeft <= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            color: daysLeft <= 7 ? '#DC2626' : '#16A34A',
                          }}>
                            {daysLeft}d left
                          </span>
                        )}
                      </div>
                    </DetailRow>

                    <DetailRow icon={MapPin} label="Cities">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                        {campaign.cities.map(city => (
                          <span key={city} style={{
                            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-secondary)',
                            border: '1px solid var(--color-border)',
                            fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)',
                          }}>
                            {city}
                          </span>
                        ))}
                      </div>
                    </DetailRow>

                    <DetailRow icon={Coins} label="Points Structure">
                      <div>{campaign.pointsPerTrip} pts per trip</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
                        Min {campaign.minTrips} trips · Target {campaign.targetTrips} trips
                      </div>
                    </DetailRow>

                    <DetailRow icon={TrendingUp} label="Points Budget">
                      <div>{campaign.pointsBudget.toLocaleString()} pts total</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
                        ≈ {Math.floor(campaign.pointsBudget / campaign.pointsPerTrip).toLocaleString()} max trips
                      </div>
                    </DetailRow>

                    {campaign.vehicleTypes && campaign.vehicleTypes.length > 0 && (
                      <DetailRow icon={Car} label="Vehicle Types">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                          {campaign.vehicleTypes.map(vt => (
                            <span key={vt} style={{
                              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--color-secondary)',
                              border: '1px solid var(--color-border)',
                              fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)',
                            }}>
                              {vt}
                            </span>
                          ))}
                        </div>
                      </DetailRow>
                    )}

                    {campaign.description && (
                      <DetailRow icon={FileText} label="Description">
                        <div style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-14)', lineHeight: 1.5 }}>
                          {campaign.description}
                        </div>
                      </DetailRow>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0', color: 'var(--color-muted-foreground)' }}>
                      <Clock size={12} />
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px' }}>
                        Created {formatDate(campaign.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Footer Actions ── */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex', gap: '10px', flexShrink: 0,
                  backgroundColor: 'var(--color-card)',
                }}>
                  {/* Edit */}
                  <button
                    onClick={() => onEdit(campaign)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '9px 16px', borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      color: 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
                  >
                    <Edit size={14} /> Edit
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => onAction('duplicate', campaign.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '9px 16px', borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      color: 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
                  >
                    <Copy size={14} /> Duplicate
                  </button>

                  {/* Pause / Resume */}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <button
                      onClick={() => onAction(campaign.status === 'active' ? 'pause' : 'resume', campaign.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '9px 16px', borderRadius: 'var(--radius)',
                        border: campaign.status === 'active' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(34,197,94,0.4)',
                        backgroundColor: campaign.status === 'active' ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
                        color: campaign.status === 'active' ? '#D97706' : '#16A34A',
                        fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                        fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {campaign.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      {campaign.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  )}

                  {/* End Campaign */}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <button
                      onClick={() => onAction('end', campaign.id)}
                      style={{
                        marginLeft: 'auto',
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '9px 16px', borderRadius: 'var(--radius)',
                        border: '1px solid rgba(220,38,38,0.3)',
                        backgroundColor: 'rgba(220,38,38,0.06)',
                        color: '#DC2626',
                        fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                        fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.06)'; }}
                    >
                      <StopCircle size={14} /> End Campaign
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}