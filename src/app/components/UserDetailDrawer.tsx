import { useState, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Edit, UserX, UserCheck, Mail, Phone, MapPin, Copy,
  Shield, ChevronDown, ChevronRight, CheckCircle, Circle,
  LogIn, Globe, Monitor, Clock, AlertTriangle, Trash2, Lock,
  RefreshCw, Bell, Eye, Key, Settings, Activity, History,
} from 'lucide-react';
import type { User, UserRole } from '../pages/Users';
import { ROLE_META, STATUS_META, getAvatarColor, getInitials, relativeTime, fmtDate } from '../pages/Users';

// ── Role Permissions Map ──────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  'Admin': {
    'Users & Access': ['Create users', 'Edit users', 'Delete users', 'Manage roles'],
    'System': ['System settings', 'View audit logs', 'Manage integrations'],
    'All Modules': ['Full read/write access to all modules'],
  },
  'Finance': {
    'Redemptions': ['Approve cash transfers', 'Approve mobile credits', 'Process payments'],
    'Reports': ['View financial reports', 'Export payment data'],
    'Campaigns': ['View campaign budgets', 'Budget approval'],
  },
  'Sales': {
    'Campaigns': ['Create campaigns', 'Edit campaigns', 'Manage campaign budgets'],
    'Clients': ['View clients', 'Add clients', 'Manage quotations'],
    'Reports': ['View sales reports'],
  },
  'Ops': {
    'Drivers': ['View drivers', 'Edit driver profiles', 'Manage driver status'],
    'Redemptions': ['View redemptions', 'Process requests'],
    'Campaigns': ['View campaigns', 'Enroll drivers'],
  },
  'Customer Support': {
    'Drivers': ['View driver profiles', 'Handle driver queries'],
    'Redemptions': ['View redemption status', 'Escalate issues'],
    'Support': ['Manage tickets', 'View activity logs'],
  },
  'Viewer': {
    'All Modules': ['Read-only access to all modules'],
  },
};

// ── Mock Activity Log ─────────────────────────────────────────────────────────

function getMockActivity(user: User) {
  const seed = parseInt(user.id.replace('USR-', ''));
  const sv = (i: number, mn: number, mx: number) => {
    const x = Math.sin(seed * 91.3 + i * 237.7) * 43758.5;
    return Math.floor(mn + (x - Math.floor(x)) * (mx - mn + 1));
  };
  const actions = [
    { icon: LogIn,     color: '#22C55E', label: 'Logged in',                  detail: 'Session started' },
    { icon: Edit,      color: '#2563EB', label: 'Updated driver DRV-10045',    detail: 'Changed status to Active' },
    { icon: CheckCircle,color:'#16A34A', label: 'Approved redemption RDM-289', detail: 'Cash transfer IDR 250,000' },
    { icon: Eye,       color: '#7C3AED', label: 'Viewed campaign CMP-2501',    detail: 'Gojek Ramadan Q1' },
    { icon: Shield,    color: '#D97706', label: 'Changed role assignment',     detail: 'Added Finance role to USR-10012' },
    { icon: Trash2,    color: '#DC2626', label: 'Deleted campaign CMP-1889',   detail: 'Removed draft campaign' },
    { icon: LogIn,     color: '#22C55E', label: 'Logged in',                  detail: 'Session from mobile' },
    { icon: Edit,      color: '#2563EB', label: 'Updated driver DRV-10077',    detail: 'Updated bank account info' },
  ];
  return Array.from({ length: 8 }, (_, i) => {
    const base = new Date('2025-02-20T10:00:00').getTime() - sv(i, 1, 48) * 3600000;
    const a = actions[sv(i + 10, 0, actions.length - 1)];
    return {
      ...a,
      time: new Date(base).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' at ' + new Date(base).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      ip: `118.${sv(i+20,0,255)}.${sv(i+21,0,255)}.${sv(i+22,1,254)}`,
    };
  });
}

// ── Mock Login History ────────────────────────────────────────────────────────

function getMockLogins(user: User) {
  const seed = parseInt(user.id.replace('USR-', ''));
  const sv = (i: number, mn: number, mx: number) => {
    const x = Math.sin(seed * 71.1 + i * 193.3) * 43758.5;
    return Math.floor(mn + (x - Math.floor(x)) * (mx - mn + 1));
  };
  const devices = ['Chrome on Windows', 'Safari on macOS', 'Chrome on Android', 'Mobile App on iOS', 'Firefox on Windows'];
  const statuses = ['Success', 'Success', 'Success', 'Logged Out', 'Failed'] as const;
  return Array.from({ length: 10 }, (_, i) => {
    const base = new Date('2025-02-20T09:00:00').getTime() - sv(i, 1, 72) * 3600000;
    const status = statuses[sv(i + 30, 0, statuses.length - 1)];
    return {
      datetime: new Date(base).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                ' ' + new Date(base).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      ip: `118.${sv(i+40,0,255)}.${sv(i+41,0,255)}.${sv(i+42,1,254)}`,
      device: devices[sv(i + 50, 0, devices.length - 1)],
      location: sv(i, 0, 1) === 0 ? 'Jakarta, Indonesia' : 'Surabaya, Indonesia',
      duration: status === 'Failed' ? '—' : `${sv(i + 60, 5, 240)} min`,
      status,
    };
  });
}

// ── Tab Content Components ────────────────────────────────────────────────────

function ProfileTab({ user }: { user: User }) {
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Personal Information */}
      <section>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
          Personal Information
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { label: 'First Name',  value: user.firstName },
            { label: 'Last Name',   value: user.lastName },
            { label: 'Email',       value: user.email,   mono: false, verified: true },
            { label: 'Mobile',      value: user.mobile,  mono: false, verified: true },
            { label: 'Office',      value: user.office },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', minWidth: '140px' }}>
                {row.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)', textAlign: 'right' }}>
                  {row.value}
                </span>
                {row.verified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34,197,94,0.1)', color: '#16A34A', fontFamily: 'var(--font-family-geist)', fontSize: '10px', fontWeight: 600, border: '1px solid rgba(34,197,94,0.25)' }}>
                    <CheckCircle size={9} /> Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Account Information */}
      <section>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
          Account Information
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { label: 'User ID',      value: user.id, mono: true },
            { label: 'Status',       custom: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 9px', borderRadius: 'var(--radius-sm)', backgroundColor: STATUS_META[user.status].bg, color: STATUS_META[user.status].color, border: `1px solid ${STATUS_META[user.status].border}`, fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600 }}><span style={{ width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'currentColor'}} />{STATUS_META[user.status].label}</span> },
            { label: 'Created',      value: fmtDate(user.createdAt) },
            { label: 'Created By',   value: user.createdBy },
            { label: 'Last Login',   value: relativeTime(user.lastLogin) },
            { label: '2FA',          custom: user.twoFA ? <span style={{ color: '#16A34A', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={13}/> Enabled</span> : <span style={{ color: '#6B7280', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><Circle size={13}/> Not Enabled</span> },
          ].map((row: any, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', minWidth: '140px' }}>{row.label}</span>
              {row.custom ?? (
                <span style={{ fontFamily: row.mono ? 'monospace' : 'var(--font-family-geist)', fontSize: row.mono ? '13px' : 'var(--text-14)', fontWeight: row.mono ? 700 : 500, color: row.mono ? '#2563EB' : 'var(--color-foreground)', letterSpacing: row.mono ? '0.04em' : undefined }}>
                  {row.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RolesTab({ user }: { user: User }) {
  const [expanded, setExpanded] = useState<UserRole | null>(null);

  const allPerms = Object.values(
    Object.fromEntries(user.roles.flatMap(r => Object.entries(ROLE_PERMISSIONS[r] ?? {})))
  ).flat();

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Assigned Roles ({user.roles.length})
      </div>

      {user.roles.map(role => {
        const m = ROLE_META[role];
        const perms = ROLE_PERMISSIONS[role];
        const isOpen = expanded === role;
        return (
          <div key={role} style={{ border: `1px solid ${m.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div
              onClick={() => setExpanded(isOpen ? null : role)}
              style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', backgroundColor: m.bg }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{m.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 700, color: m.color }}>{role}</div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '1px' }}>{m.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${m.border}`, backgroundColor: 'var(--color-card)', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                {isOpen ? <ChevronDown size={15} style={{ color: m.color }} /> : <ChevronRight size={15} style={{ color: m.color }} />}
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-card)', borderTop: `1px solid ${m.border}` }}>
                {Object.entries(perms).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{category}</div>
                    {items.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
                        <CheckCircle size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '10px 16px', borderRadius: 'var(--radius)',
        border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-secondary)',
        color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)',
        fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
      }}>
        + Add Role
      </button>

      {/* Effective Permissions */}
      <div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          Effective Permissions ({allPerms.length})
        </div>
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {allPerms.slice(0, 8).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <CheckCircle size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)' }}>{p}</span>
            </div>
          ))}
          {allPerms.length > 8 && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', fontStyle: 'italic' }}>…and {allPerms.length - 8} more permissions</span>}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ user }: { user: User }) {
  const [filter, setFilter] = useState<'7d' | '30d' | '3m'>('30d');
  const logs = getMockActivity(user);
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
        {(['7d','30d','3m'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${filter === f ? '#7C3AED' : 'var(--color-border)'}`,
            backgroundColor: filter === f ? 'rgba(124,58,237,0.1)' : 'var(--color-card)',
            color: filter === f ? '#7C3AED' : 'var(--color-muted-foreground)',
            fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>{{ '7d': 'Last 7 days', '30d': 'Last 30 days', '3m': 'Last 3 months' }[f]}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '32px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${log.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', border: `1px solid ${log.color}30` }}>
                <log.icon size={14} style={{ color: log.color }} />
              </div>
              {i < logs.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '12px', marginTop: '4px', backgroundColor: 'var(--color-border)' }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{log.label}</div>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>{log.detail}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{log.time}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-muted-foreground)', padding: '1px 5px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>{log.ip}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginHistoryTab({ user }: { user: User }) {
  const logins = getMockLogins(user);
  const hasFailed = logins.some(l => l.status === 'Failed');
  return (
    <div style={{ padding: '20px 24px' }}>
      {hasFailed && (
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
          <AlertTriangle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#D97706', fontWeight: 500 }}>
            Multiple failed login attempts detected. Please review activity.
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          <History size={13} /> Export Login History
        </button>
      </div>
      <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
              {['Date & Time', 'IP Address', 'Device', 'Location', 'Duration', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logins.map((l, i) => (
              <tr key={i} style={{ backgroundColor: l.status === 'Failed' ? 'rgba(239,68,68,0.04)' : 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>{l.datetime}</td>
                <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{l.ip}</td>
                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)' }}>{l.device}</td>
                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{l.location}</td>
                <td style={{ padding: '9px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{l.duration}</td>
                <td style={{ padding: '9px 12px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
                    backgroundColor: { Success: 'rgba(34,197,94,0.1)', Failed: 'rgba(239,68,68,0.1)', 'Logged Out': 'rgba(107,114,128,0.1)' }[l.status],
                    color: { Success: '#16A34A', Failed: '#DC2626', 'Logged Out': '#6B7280' }[l.status],
                  }}>
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ user }: { user: User }) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [mobileNotif, setMobileNotif] = useState(false);
  const [notifTypes, setNotifTypes] = useState({ system: true, drivers: true, approvals: true, reports: false });
  const [require2FA, setRequire2FA] = useState(false);

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: checked ? '#7C3AED' : 'var(--color-border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: checked ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Notification Preferences */}
      <section>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={12} /> Notification Preferences
        </div>
        <div style={{ padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Email Notifications', val: emailNotif, set: () => setEmailNotif(v => !v) },
            { label: 'Mobile Notifications', val: mobileNotif, set: () => setMobileNotif(v => !v) },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', fontWeight: 500 }}>{item.label}</span>
              <Toggle checked={item.val} onChange={item.set} />
            </div>
          ))}
          <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', marginBottom: '2px' }}>Notification Types</div>
          {(Object.entries(notifTypes) as [keyof typeof notifTypes, boolean][]).map(([key, val]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={val} onChange={() => setNotifTypes(p => ({ ...p, [key]: !p[key] }))} style={{ accentColor: '#7C3AED', cursor: 'pointer' }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)' }}>
                {{ system: 'System updates', drivers: 'New driver registrations', approvals: 'Pending approvals', reports: 'Daily reports' }[key]}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Security Settings */}
      <section>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={12} /> Security Settings
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
            <Key size={14} style={{ color: 'var(--color-muted-foreground)' }} /> Force Password Reset
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', cursor: 'pointer' }}>
            <input type="checkbox" checked={require2FA} onChange={() => setRequire2FA(v => !v)} style={{ accentColor: '#7C3AED', cursor: 'pointer' }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', fontWeight: 500 }}>Require 2FA on next login</span>
          </label>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: '#2563EB', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
            <Globe size={14} /> View Active Sessions
          </button>
        </div>
      </section>

      {/* Account Actions */}
      <section>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Settings size={12} /> Account Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
            <Mail size={14} style={{ color: 'var(--color-muted-foreground)' }} /> Send Password Reset Email
          </button>
          {user.status === 'pending' && (
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
              <RefreshCw size={14} style={{ color: 'var(--color-muted-foreground)' }} /> Resend Welcome Email
            </button>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.04)', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
            <Lock size={14} /> Lock Account Temporarily
          </button>
        </div>
      </section>
    </div>
  );
}

// ── Main Drawer Component ─────────────────────────────────────────────────────

const TABS = ['Profile Details', 'Roles & Permissions', 'Activity Log', 'Login History', 'Settings'];

interface Props {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onEdit: (u: User) => void;
  onToggleStatus: (u: User) => void;
  onDelete: (u: User) => void;
}

export function UserDetailDrawer({ user, open, onClose, onEdit, onToggleStatus, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => { setActiveTab(0); }, [user?.id]);

  if (!user) return null;

  const avatarColor = getAvatarColor(`${user.firstName} ${user.lastName}`);
  const initials = getInitials(user.firstName, user.lastName);
  const sm = STATUS_META[user.status];

  function copyId() {
    copyToClipboard(user!.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabContent = [
    <ProfileTab user={user} />,
    <RolesTab user={user} />,
    <ActivityTab user={user} />,
    <LoginHistoryTab user={user} />,
    <SettingsTab user={user} />,
  ];

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '9px 14px', borderRadius: 'var(--radius)', cursor: 'pointer',
    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600,
    border: 'none', transition: 'opacity 0.15s', width: '100%',
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }} transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9998 }}
          />
          <motion.div key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%', transition: { type: 'tween', duration: 0.26, ease: [0.4, 0, 1, 1] } }} transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.85 }}
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '600px', zIndex: 9999, backgroundColor: 'var(--color-card)', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Close */}
            <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
              <X size={15} />
            </button>

            {/* Header */}
            <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingRight: '40px' }}>
                {/* Avatar */}
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-family-geist)', fontSize: '22px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    {user.firstName} {user.lastName}
                  </h2>
                  {/* ID + copy */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{user.id}</span>
                    <button onClick={copyId} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? '#16A34A' : 'var(--color-muted-foreground)' }}>
                      <Copy size={12} />
                    </button>
                  </div>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: 'var(--radius-sm)', backgroundColor: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                      {sm.label}
                    </span>
                    {user.roles.map(r => {
                      const rm = ROLE_META[r];
                      return <span key={r} style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: rm.bg, color: rm.color, border: `1px solid ${rm.border}`, fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600 }}>{rm.emoji} {r}</span>;
                    })}
                  </div>
                </div>
              </div>

              {/* Quick info card */}
              <div style={{ margin: '16px 0 0', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { icon: Mail,    val: user.email,   action: () => window.location.href = `mailto:${user.email}` },
                  { icon: Phone,   val: user.mobile,  action: () => {} },
                  { icon: MapPin,  val: `${user.office} Office`,  action: undefined },
                  { icon: Activity,val: `Member since ${fmtDate(user.createdAt)}`, action: undefined },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: item.action ? 'pointer' : 'default' }} onClick={item.action}>
                    <item.icon size={13} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: item.action ? '#2563EB' : 'var(--color-foreground)', fontWeight: item.action ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-border)', marginTop: '16px', overflowX: 'auto' }}>
                {TABS.map((label, i) => (
                  <button key={i} onClick={() => setActiveTab(i)} style={{
                    padding: '10px 12px', border: 'none',
                    borderBottom: `2px solid ${activeTab === i ? '#7C3AED' : 'transparent'}`,
                    backgroundColor: 'transparent', color: activeTab === i ? '#7C3AED' : 'var(--color-muted-foreground)',
                    fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: activeTab === i ? 700 : 400,
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: '-1px',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {tabContent[activeTab]}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0, backgroundColor: 'var(--color-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={onClose} style={{ ...btnBase, backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)' }}>
                  Close
                </button>
                <button onClick={() => onEdit(user)} style={{ ...btnBase, backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)' }}>
                  <Edit size={14} /> Edit User
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {user.status === 'active'
                  ? <button onClick={() => onToggleStatus(user)} style={{ ...btnBase, backgroundColor: 'rgba(245,158,11,0.1)', color: '#D97706' }}><UserX size={14} /> Deactivate Account</button>
                  : <button onClick={() => onToggleStatus(user)} style={{ ...btnBase, backgroundColor: 'rgba(34,197,94,0.1)', color: '#16A34A' }}><UserCheck size={14} /> Activate Account</button>
                }
                <button onClick={() => onDelete(user)} style={{ ...btnBase, backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626' }}>
                  <Trash2 size={14} /> Delete User
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
