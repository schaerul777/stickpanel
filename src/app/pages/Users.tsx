import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import ReactDOM from 'react-dom';
import {
  Plus, Download, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Edit, Eye, UserX, UserCheck,
  MoreHorizontal, X, MapPin, Phone, Mail, Trash2,
  Users as UsersIcon, RefreshCw, SlidersHorizontal,
} from 'lucide-react';
import { UserDetailDrawer }   from '../components/UserDetailDrawer';
import { AddEditUserModal }   from '../components/AddEditUserModal';
import { DeleteUserModal }    from '../components/DeleteUserModal';
import { UserBulkActionsModal } from '../components/UserBulkActionsModal';
import { Checkbox }           from '../components/Checkbox';
import { StatusTabs }         from '../components/StatusTabs';
import { useToast, ToastContainer } from '../components/Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole   = 'Admin' | 'Finance' | 'Sales' | 'Ops' | 'Customer Support' | 'Viewer';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type UserOffice = 'Jakarta' | 'Surabaya';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  office: UserOffice;
  status: UserStatus;
  roles: UserRole[];
  createdAt: string;
  createdBy: string;
  lastLogin?: string;
  twoFA: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ROLE_META: Record<UserRole, { bg: string; color: string; border: string; emoji: string; desc: string }> = {
  'Admin':            { bg: 'rgba(124,58,237,0.1)',   color: '#7C3AED', border: 'rgba(124,58,237,0.25)',  emoji: '🛡️', desc: 'Full system access, user management & settings' },
  'Finance':          { bg: 'rgba(34,197,94,0.1)',    color: '#16A34A', border: 'rgba(34,197,94,0.25)',   emoji: '💰', desc: 'Financial operations, redemption approvals & reports' },
  'Sales':            { bg: 'rgba(37,99,235,0.1)',    color: '#2563EB', border: 'rgba(37,99,235,0.25)',   emoji: '📊', desc: 'Campaign management, client relations & quotations' },
  'Ops':              { bg: 'rgba(245,158,11,0.1)',   color: '#D97706', border: 'rgba(245,158,11,0.25)',  emoji: '⚙️', desc: 'Driver management, redemption processing & operations' },
  'Customer Support': { bg: 'rgba(107,114,128,0.1)', color: '#6B7280', border: 'rgba(107,114,128,0.25)', emoji: '💬', desc: 'Support tickets, driver queries & issue resolution' },
  'Viewer':           { bg: 'rgba(79,70,229,0.1)',    color: '#4338CA', border: 'rgba(79,70,229,0.25)',   emoji: '👁️', desc: 'Read-only access to all modules' },
};

export const STATUS_META: Record<UserStatus, { bg: string; color: string; border: string; label: string }> = {
  active:    { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', border: 'rgba(34,197,94,0.25)',   label: 'Active' },
  inactive:  { bg: 'rgba(107,114,128,0.1)', color: '#6B7280', border: 'rgba(107,114,128,0.25)', label: 'Inactive' },
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', border: 'rgba(245,158,11,0.25)',  label: 'Pending' },
  suspended: { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626', border: 'rgba(239,68,68,0.25)',   label: 'Suspended' },
};

const AVATAR_COLORS = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626','#DB2777','#0D9488'];

export function getAvatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
export function getInitials(first: string, last: string) { return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase(); }

export function relativeTime(iso?: string): string {
  if (!iso) return 'Never';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (mins < 2)    return 'Just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days === 1)  return 'Yesterday';
  if (days < 7)    return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 5)   return `${weeks} weeks ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Mock Data (40 users) ───────────────────────────────────────────────────���───

const INITIAL_USERS: User[] = [
  { id: 'USR-10001', firstName: 'Ahmad',   lastName: 'Rahman',       email: 'ahmad.rahman@stickpoint.co',      mobile: '0812-3456-7890', office: 'Jakarta',  status: 'active',   roles: ['Admin', 'Ops'],            createdAt: '2024-01-15', createdBy: 'System',           lastLogin: '2026-02-20T06:30:00', twoFA: true  },
  { id: 'USR-10002', firstName: 'Dewi',    lastName: 'Kusuma',       email: 'dewi.kusuma@stickpoint.co',       mobile: '0821-5678-9012', office: 'Jakarta',  status: 'active',   roles: ['Finance'],                 createdAt: '2024-02-10', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-19T14:00:00', twoFA: false },
  { id: 'USR-10003', firstName: 'Rudi',    lastName: 'Hartono',      email: 'rudi.hartono@stickpoint.co',      mobile: '0877-1234-5678', office: 'Surabaya', status: 'active',   roles: ['Sales'],                   createdAt: '2024-02-18', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-17T10:00:00', twoFA: false },
  { id: 'USR-10004', firstName: 'Siti',    lastName: 'Rahayu',       email: 'siti.rahayu@stickpoint.co',       mobile: '0831-9876-5432', office: 'Jakarta',  status: 'inactive', roles: ['Ops', 'Customer Support'], createdAt: '2024-03-05', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-06T09:00:00', twoFA: false },
  { id: 'USR-10005', firstName: 'Budi',    lastName: 'Santoso',      email: 'budi.santoso@stickpoint.co',      mobile: '0856-7890-1234', office: 'Surabaya', status: 'pending',  roles: ['Admin'],                   createdAt: '2026-01-20', createdBy: 'Dewi Kusuma',      lastLogin: undefined,             twoFA: false },
  { id: 'USR-10006', firstName: 'Rina',    lastName: 'Marlina',      email: 'rina.marlina@stickpoint.co',      mobile: '0878-3579-2468', office: 'Jakarta',  status: 'active',   roles: ['Viewer'],                  createdAt: '2024-04-01', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-20T08:28:00', twoFA: false },
  { id: 'USR-10007', firstName: 'Yoga',    lastName: 'Pratama',      email: 'yoga.pratama@stickpoint.co',      mobile: '0813-2468-1357', office: 'Jakarta',  status: 'active',   roles: ['Sales'],                   createdAt: '2024-04-12', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-19T10:00:00', twoFA: false },
  { id: 'USR-10008', firstName: 'Hana',    lastName: 'Dewi',         email: 'hana.dewi@stickpoint.co',         mobile: '0822-3691-2580', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2024-04-20', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-18T14:30:00', twoFA: false },
  { id: 'USR-10009', firstName: 'Fajar',   lastName: 'Nugroho',      email: 'fajar.nugroho@stickpoint.co',     mobile: '0856-1472-5836', office: 'Surabaya', status: 'active',   roles: ['Ops'],                     createdAt: '2024-05-03', createdBy: 'Dewi Kusuma',      lastLogin: '2026-02-20T07:00:00', twoFA: false },
  { id: 'USR-10010', firstName: 'Laila',   lastName: 'Putri',        email: 'laila.putri@stickpoint.co',       mobile: '0878-9630-1470', office: 'Jakarta',  status: 'active',   roles: ['Finance'],                 createdAt: '2024-05-15', createdBy: 'Dewi Kusuma',      lastLogin: '2026-02-16T11:00:00', twoFA: false },
  { id: 'USR-10011', firstName: 'Aditya',  lastName: 'Ramadhan',     email: 'aditya.ramadhan@stickpoint.co',   mobile: '0812-7531-9864', office: 'Surabaya', status: 'active',   roles: ['Ops'],                     createdAt: '2024-05-28', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-15T09:30:00', twoFA: false },
  { id: 'USR-10012', firstName: 'Mega',    lastName: 'Wulandari',    email: 'mega.wulandari@stickpoint.co',    mobile: '0821-8642-0975', office: 'Jakarta',  status: 'active',   roles: ['Sales'],                   createdAt: '2024-06-10', createdBy: 'Rudi Hartono',     lastLogin: '2026-02-19T16:00:00', twoFA: false },
  { id: 'USR-10013', firstName: 'Bayu',    lastName: 'Saputra',      email: 'bayu.saputra@stickpoint.co',      mobile: '0877-2580-4719', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2024-06-22', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-18T10:00:00', twoFA: false },
  { id: 'USR-10014', firstName: 'Desi',    lastName: 'Ratnasari',    email: 'desi.ratnasari@stickpoint.co',    mobile: '0831-6420-8153', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2024-07-04', createdBy: 'Siti Rahayu',      lastLogin: '2026-02-17T13:00:00', twoFA: false },
  { id: 'USR-10015', firstName: 'Eko',     lastName: 'Purnomo',      email: 'eko.purnomo@stickpoint.co',       mobile: '0856-3097-6251', office: 'Surabaya', status: 'active',   roles: ['Sales'],                   createdAt: '2024-07-18', createdBy: 'Rudi Hartono',     lastLogin: '2026-02-20T08:00:00', twoFA: false },
  { id: 'USR-10016', firstName: 'Fitri',   lastName: 'Andriani',     email: 'fitri.andriani@stickpoint.co',    mobile: '0813-4815-2637', office: 'Jakarta',  status: 'active',   roles: ['Finance'],                 createdAt: '2024-08-01', createdBy: 'Dewi Kusuma',      lastLogin: '2026-02-14T15:00:00', twoFA: false },
  { id: 'USR-10017', firstName: 'Guntur',  lastName: 'Wibowo',       email: 'guntur.wibowo@stickpoint.co',     mobile: '0822-1593-7048', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2024-08-15', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-19T09:00:00', twoFA: false },
  { id: 'USR-10018', firstName: 'Hesti',   lastName: 'Kusumawati',   email: 'hesti.kusumawati@stickpoint.co',  mobile: '0878-6271-3049', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2024-09-01', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-18T11:30:00', twoFA: false },
  { id: 'USR-10019', firstName: 'Ikhsan',  lastName: 'Maulana',      email: 'ikhsan.maulana@stickpoint.co',    mobile: '0812-0384-5671', office: 'Jakarta',  status: 'active',   roles: ['Admin'],                   createdAt: '2024-01-20', createdBy: 'System',           lastLogin: '2026-02-20T07:45:00', twoFA: true  },
  { id: 'USR-10020', firstName: 'Jeni',    lastName: 'Perdana',      email: 'jeni.perdana@stickpoint.co',      mobile: '0856-9157-3826', office: 'Surabaya', status: 'active',   roles: ['Ops'],                     createdAt: '2024-09-20', createdBy: 'Siti Rahayu',      lastLogin: '2026-02-13T10:00:00', twoFA: false },
  { id: 'USR-10021', firstName: 'Kartini', lastName: 'Wahyuni',      email: 'kartini.wahyuni@stickpoint.co',   mobile: '0821-4826-1503', office: 'Jakarta',  status: 'active',   roles: ['Sales'],                   createdAt: '2024-10-03', createdBy: 'Rudi Hartono',     lastLogin: '2026-02-17T14:00:00', twoFA: false },
  { id: 'USR-10022', firstName: 'Loren',   lastName: 'Akbar',        email: 'loren.akbar@stickpoint.co',       mobile: '0877-3715-9240', office: 'Surabaya', status: 'active',   roles: ['Ops'],                     createdAt: '2024-10-15', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-16T09:00:00', twoFA: false },
  { id: 'USR-10023', firstName: 'Mira',    lastName: 'Susianti',     email: 'mira.susianti@stickpoint.co',     mobile: '0831-5049-2618', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2024-11-01', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-19T11:00:00', twoFA: false },
  { id: 'USR-10024', firstName: 'Nurul',   lastName: 'Hidayah',      email: 'nurul.hidayah@stickpoint.co',     mobile: '0813-7263-8041', office: 'Jakarta',  status: 'active',   roles: ['Customer Support'],        createdAt: '2024-11-12', createdBy: 'Siti Rahayu',      lastLogin: '2026-02-18T13:00:00', twoFA: false },
  { id: 'USR-10025', firstName: 'Oki',     lastName: 'Setiawan',     email: 'oki.setiawan@stickpoint.co',      mobile: '0856-2840-7163', office: 'Jakarta',  status: 'active',   roles: ['Admin'],                   createdAt: '2024-01-22', createdBy: 'System',           lastLogin: '2026-02-15T10:30:00', twoFA: true  },
  { id: 'USR-10026', firstName: 'Prima',   lastName: 'Agung',        email: 'prima.agung@stickpoint.co',       mobile: '0822-9374-5012', office: 'Jakarta',  status: 'active',   roles: ['Sales'],                   createdAt: '2024-12-01', createdBy: 'Rudi Hartono',     lastLogin: '2026-02-20T06:00:00', twoFA: false },
  { id: 'USR-10027', firstName: 'Qori',    lastName: 'Wahyuningsih', email: 'qori.wahyuningsih@stickpoint.co', mobile: '0878-0628-4195', office: 'Jakarta',  status: 'active',   roles: ['Customer Support'],        createdAt: '2024-12-15', createdBy: 'Siti Rahayu',      lastLogin: '2026-02-14T12:00:00', twoFA: false },
  { id: 'USR-10028', firstName: 'Ratna',   lastName: 'Dewi',         email: 'ratna.dewi@stickpoint.co',        mobile: '0812-1836-4927', office: 'Surabaya', status: 'active',   roles: ['Admin'],                   createdAt: '2024-01-28', createdBy: 'System',           lastLogin: '2026-02-19T15:00:00', twoFA: true  },
  { id: 'USR-10029', firstName: 'Surya',   lastName: 'Mahendra',     email: 'surya.mahendra@stickpoint.co',    mobile: '0821-5319-6047', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2025-01-10', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-17T08:00:00', twoFA: false },
  { id: 'USR-10030', firstName: 'Tika',    lastName: 'Prasetyo',     email: 'tika.prasetyo@stickpoint.co',     mobile: '0856-7041-3528', office: 'Jakarta',  status: 'active',   roles: ['Customer Support'],        createdAt: '2025-01-20', createdBy: 'Siti Rahayu',      lastLogin: '2026-02-12T11:00:00', twoFA: false },
  { id: 'USR-10031', firstName: 'Umar',    lastName: 'Faruq',        email: 'umar.faruq@stickpoint.co',        mobile: '0877-4283-9615', office: 'Surabaya', status: 'active',   roles: ['Sales'],                   createdAt: '2025-02-01', createdBy: 'Rudi Hartono',     lastLogin: '2026-02-16T14:30:00', twoFA: false },
  { id: 'USR-10032', firstName: 'Vera',    lastName: 'Sagita',       email: 'vera.sagita@stickpoint.co',       mobile: '0831-6197-2043', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2025-02-08', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-18T09:00:00', twoFA: false },
  { id: 'USR-10033', firstName: 'Wahyu',   lastName: 'Ningsih',      email: 'wahyu.ningsih@stickpoint.co',     mobile: '0813-8352-0471', office: 'Jakarta',  status: 'active',   roles: ['Customer Support'],        createdAt: '2025-02-12', createdBy: 'Siti Rahayu',      lastLogin: '2026-02-15T13:00:00', twoFA: false },
  { id: 'USR-10034', firstName: 'Xena',    lastName: 'Wijaya',       email: 'xena.wijaya@stickpoint.co',       mobile: '0822-0164-3872', office: 'Surabaya', status: 'active',   roles: ['Viewer'],                  createdAt: '2025-02-15', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-11T10:00:00', twoFA: false },
  { id: 'USR-10035', firstName: 'Yuda',    lastName: 'Pratama',      email: 'yuda.pratama@stickpoint.co',      mobile: '0856-2946-8013', office: 'Jakarta',  status: 'active',   roles: ['Sales'],                   createdAt: '2025-02-17', createdBy: 'Rudi Hartono',     lastLogin: '2026-02-19T13:30:00', twoFA: false },
  { id: 'USR-10036', firstName: 'Zahra',   lastName: 'Natasya',      email: 'zahra.natasya@stickpoint.co',     mobile: '0878-7530-2894', office: 'Jakarta',  status: 'active',   roles: ['Ops'],                     createdAt: '2025-02-18', createdBy: 'Ahmad Rahman',     lastLogin: '2026-02-17T16:00:00', twoFA: false },
  { id: 'USR-10037', firstName: 'Andi',    lastName: 'Susanto',      email: 'andi.susanto@stickpoint.co',      mobile: '0812-4618-3957', office: 'Surabaya', status: 'inactive', roles: ['Ops'],                     createdAt: '2024-06-05', createdBy: 'Ahmad Rahman',     lastLogin: '2026-01-20T11:00:00', twoFA: false },
  { id: 'USR-10038', firstName: 'Bella',   lastName: 'Maharani',     email: 'bella.maharani@stickpoint.co',    mobile: '0821-3057-9146', office: 'Jakarta',  status: 'inactive', roles: ['Customer Support'],        createdAt: '2024-08-10', createdBy: 'Siti Rahayu',      lastLogin: '2026-01-08T14:00:00', twoFA: false },
  { id: 'USR-10039', firstName: 'Chandra', lastName: 'Kusuma',       email: 'chandra.kusuma@stickpoint.co',    mobile: '0877-8294-0365', office: 'Jakarta',  status: 'inactive', roles: ['Viewer'],                  createdAt: '2024-10-22', createdBy: 'Ahmad Rahman',     lastLogin: '2025-12-15T09:00:00', twoFA: false },
  { id: 'USR-10040', firstName: 'Dony',    lastName: 'Saputra',      email: 'dony.saputra@stickpoint.co',      mobile: '0856-6183-7042', office: 'Surabaya', status: 'pending',  roles: ['Viewer'],                  createdAt: '2026-02-10', createdBy: 'Dewi Kusuma',      lastLogin: undefined,             twoFA: false },
];

const ALL_ROLES:   UserRole[]   = ['Admin', 'Finance', 'Sales', 'Ops', 'Customer Support', 'Viewer'];
const ALL_OFFICES: UserOffice[] = ['Jakarta', 'Surabaya'];

// ── Role Tooltip portal ───────────────────────────────────────────────────────

function RoleTooltip({ role, rect }: { role: UserRole; rect: DOMRect }) {
  const m   = ROLE_META[role];
  const top  = rect.bottom + 6;
  const left = rect.left + rect.width / 2;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', top, left, transform: 'translateX(-50%)', zIndex: 99999, pointerEvents: 'none', backgroundColor: '#1a1a2e', color: 'white', padding: '7px 11px', borderRadius: 'var(--radius)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: '220px' }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: m.color, marginBottom: '3px' }}>{m.emoji} {role}</div>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{m.desc}</div>
      <div style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid #1a1a2e' }} />
    </div>,
    document.body,
  );
}

// ── Role Badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role, onHover, onLeave }: { role: UserRole; onHover: (r: UserRole, rect: DOMRect) => void; onLeave: () => void }) {
  const m = ROLE_META[role];
  return (
    <span
      onMouseEnter={e => onHover(role, (e.currentTarget as HTMLElement).getBoundingClientRect())}
      onMouseLeave={onLeave}
      style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: m.bg, color: m.color, border: `1px solid ${m.border}`, fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'default' }}
    >
      {role}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UserStatus }) {
  const m = STATUS_META[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: 'var(--radius-sm)', backgroundColor: m.bg, color: m.color, border: `1px solid ${m.border}`, fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: '#7C3AED', whiteSpace: 'nowrap' }}>
      {label}
      <button onClick={onRemove} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: '#7C3AED', opacity: 0.7 }}><X size={11} /></button>
    </span>
  );
}

// ── Action Menu (portal, ••• button) ─────────────────────────────────────────

function ActionMenu({ user, anchorRect, onClose, onView, onEdit, onToggleStatus, onResendInvite, onDelete }: {
  user: User; anchorRect: DOMRect; onClose: () => void;
  onView: () => void; onEdit: () => void; onToggleStatus: () => void; onResendInvite: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const top   = anchorRect.bottom + 4;
  const right = window.innerWidth - anchorRect.right;

  const item = (icon: React.ReactNode, label: string, fn: () => void, danger = false) => (
    <button key={label} onClick={() => { fn(); onClose(); }}
      style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: danger ? '#DC2626' : 'var(--color-foreground)' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = danger ? 'rgba(239,68,68,0.06)' : 'var(--color-secondary)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >{icon}{label}</button>
  );

  return ReactDOM.createPortal(
    <div ref={ref} style={{ position: 'fixed', top, right, width: '200px', zIndex: 9999, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', padding: '4px 0' }}>
      {item(<Eye size={14} />, 'View Details', onView)}
      {item(<Edit size={14} />, 'Edit User', onEdit)}
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
      {user.status === 'active' ? item(<UserX size={14} />, 'Deactivate', onToggleStatus) : item(<UserCheck size={14} />, 'Activate', onToggleStatus)}
      {user.status === 'pending' && item(<Mail size={14} />, 'Resend Invite', onResendInvite)}
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
      {item(<Trash2 size={14} />, 'Delete User', onDelete, true)}
    </div>,
    document.body,
  );
}

// ── Right-click Context Menu ───────────────────────────���──────────────────────

function ContextMenu({ user, x, y, onClose, onView, onEdit, onToggleStatus, onCopyId, onDelete }: {
  user: User; x: number; y: number; onClose: () => void;
  onView: () => void; onEdit: () => void; onToggleStatus: () => void; onCopyId: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [onClose]);

  const menuW = 210, menuH = 240;
  const left  = Math.min(x, window.innerWidth  - menuW - 8);
  const top   = Math.min(y, window.innerHeight - menuH - 8);

  const item = (icon: React.ReactNode, label: string, shortcut: string, fn: () => void, danger = false, divAfter = false) => (
    <div key={label}>
      <button onClick={() => { fn(); onClose(); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: danger ? '#DC2626' : 'var(--color-foreground)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = danger ? 'rgba(239,68,68,0.06)' : 'var(--color-secondary)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>{icon}{label}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)' }}>{shortcut}</span>
      </button>
      {divAfter && <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '3px 0' }} />}
    </div>
  );

  return ReactDOM.createPortal(
    <div ref={ref} style={{ position: 'fixed', top, left, width: `${menuW}px`, zIndex: 99998, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 12px 32px rgba(0,0,0,0.16)', overflow: 'hidden', padding: '4px 0' }}>
      <div style={{ padding: '6px 14px 4px', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {user.firstName} {user.lastName}
      </div>
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '3px 0' }} />
      {item(<Eye size={13} />,       'View Details', 'Enter', onView,          false, false)}
      {item(<Edit size={13} />,      'Edit User',    'E',     onEdit,          false, true)}
      {user.status === 'active'
        ? item(<UserX size={13} />,    'Deactivate',   'D',   onToggleStatus,  false, false)
        : item(<UserCheck size={13} />, 'Activate',    'A',   onToggleStatus,  false, false)
      }
      {item(<RefreshCw size={13} />, 'Copy User ID', 'C',     onCopyId,        false, true)}
      {item(<Trash2 size={13} />,    'Delete User',  '⌫',     onDelete,        true,  false)}
    </div>,
    document.body,
  );
}

// ── Sortable TH ───────────────────────────────────────────────────────────────

type SortField = 'name' | 'office' | 'lastLogin' | 'createdAt' | 'status' | null;

const thBase: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left',
  fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-muted-foreground)', textTransform: 'uppercase',
  letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-secondary)', whiteSpace: 'nowrap', userSelect: 'none',
};

const tdBase: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--color-border)',
  fontFamily: 'var(--font-family-geist)',
  fontSize: 'var(--text-14)',
  color: 'var(--color-foreground)',
  verticalAlign: 'middle',
};

function SortTh({ label, field, sortField, sortDir, onSort, style }: {
  label: string; field: SortField; sortField: SortField;
  sortDir: 'asc' | 'desc'; onSort: (f: SortField) => void; style?: React.CSSProperties;
}) {
  const active = sortField === field;
  return (
    <th onClick={() => field && onSort(field)} style={{ ...thBase, cursor: field ? 'pointer' : 'default', color: active ? '#7C3AED' : 'var(--color-muted-foreground)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {field && (active
          ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronDown size={12} style={{ opacity: 0.3 }} />
        )}
      </div>
    </th>
  );
}

// ── Main Component ────────────────���───────────────────────────────────────────

export function Users() {
  const [users, setUsers]               = useState<User[]>(INITIAL_USERS);
  const { toasts, showToast, dismiss }  = useToast();
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('all');
  const [roleFilter, setRoleFilter]     = useState('All');
  const [officeFilter, setOfficeFilter] = useState('All');
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [sortField, setSortField]       = useState<SortField>(null);
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [page, setPage]                 = useState(1);
  const [rowsPerPage, setRowsPerPage]   = useState(25);
  const [hoveredRow, setHoveredRow]     = useState<string | null>(null);

  // ── Tooltip ──────────────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<{ role: UserRole; rect: DOMRect } | null>(null);

  // ── Menus ────────────────────────────────────────────────────────────────────
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [ctxMenu, setCtxMenu]       = useState<{ user: User; x: number; y: number } | null>(null);

  // ── Inline edit (double-click mobile) ────────────────────────────────────────
  const [inlineEdit, setInlineEdit] = useState<{ userId: string; value: string } | null>(null);
  const inlineRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (inlineEdit) inlineRef.current?.focus(); }, [inlineEdit]);

  function commitInline() {
    if (!inlineEdit) return;
    setUsers(p => p.map(u => u.id === inlineEdit.userId ? { ...u, mobile: inlineEdit.value } : u));
    setInlineEdit(null);
  }

  // ── Modals ────────────────────────────────────────────────────────────────────
  const [drawerUser, setDrawerUser]   = useState<User | null>(null);
  const [editUser, setEditUser]       = useState<User | null>(null);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [deleteUser, setDeleteUser]   = useState<User | null>(null);
  const [bulkModal, setBulkModal]     = useState<'role' | 'deactivate' | null>(null);

  // ── Derived counts for tabs ───────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:       users.length,
    active:    users.filter(u => u.status === 'active').length,
    inactive:  users.filter(u => u.status === 'inactive').length,
    pending:   users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  }), [users]);

  const statusTabs = [
    { label: 'All',       value: 'all',       count: counts.all       },
    { label: 'Active',    value: 'active',    count: counts.active    },
    { label: 'Inactive',  value: 'inactive',  count: counts.inactive  },
    { label: 'Pending',   value: 'pending',   count: counts.pending   },
    { label: 'Suspended', value: 'suspended', count: counts.suspended },
  ];

  // ── Active filter chips ───────────────────────────────────────────────────────
  const activeFilterCount = (roleFilter !== 'All' ? 1 : 0) + (officeFilter !== 'All' ? 1 : 0);

  // ── Filtered + sorted data ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...users];
    // Tab filter
    if (activeTab !== 'all') r = r.filter(u => u.status === activeTab);
    // Search
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobile.includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    // Panel filters
    if (roleFilter   !== 'All') r = r.filter(u => u.roles.includes(roleFilter as UserRole));
    if (officeFilter !== 'All') r = r.filter(u => u.office === officeFilter);
    // Sort
    if (sortField) {
      r.sort((a, b) => {
        let av = '', bv = '';
        if (sortField === 'name')      { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; }
        if (sortField === 'office')    { av = a.office;      bv = b.office; }
        if (sortField === 'status')    { av = a.status;      bv = b.status; }
        if (sortField === 'lastLogin') { av = a.lastLogin ?? ''; bv = b.lastLogin ?? ''; }
        if (sortField === 'createdAt') { av = a.createdAt;   bv = b.createdAt; }
        const c = av.localeCompare(bv);
        return sortDir === 'asc' ? c : -c;
      });
    }
    return r;
  }, [users, activeTab, search, roleFilter, officeFilter, sortField, sortDir]);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated     = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedUsers = users.filter(u => selectedIds.has(u.id));
  const startIdx      = (page - 1) * rowsPerPage;
  const endIdx        = Math.min(startIdx + rowsPerPage, filtered.length);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  }
  function handleTabChange(v: string) { setActiveTab(v); setPage(1); setSelectedIds(new Set()); }
  function toggleAll() { setSelectedIds(p => p.size === paginated.length ? new Set() : new Set(paginated.map(u => u.id))); }
  function toggleRow(id: string) { setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function clearFilters() { setRoleFilter('All'); setOfficeFilter('All'); setPage(1); }
  function handleSave(updated: User) {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === updated.id);
      if (idx >= 0) {
        const n = [...prev]; n[idx] = updated;
        showToast('success', 'User Updated', `${updated.firstName} ${updated.lastName} has been updated.`);
        return n;
      }
      showToast('success', 'User Created', `${updated.firstName} ${updated.lastName} has been added.`);
      return [...prev, updated];
    });
    setShowAddEdit(false); setEditUser(null);
  }
  function handleDelete(id: string) {
    const user = users.find(u => u.id === id);
    setUsers(p => p.filter(u => u.id !== id));
    setDeleteUser(null); if (drawerUser?.id === id) setDrawerUser(null);
    if (user) showToast('success', 'User Deleted', `${user.firstName} ${user.lastName} has been removed.`);
  }
  function handleToggleStatus(user: User) {
    const next: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    setUsers(p => p.map(u => u.id === user.id ? { ...u, status: next } : u));
    if (next === 'active') {
      showToast('success', 'User Activated', `${user.firstName} ${user.lastName} is now active.`);
    } else {
      showToast('info', 'User Deactivated', `${user.firstName} ${user.lastName} has been set to inactive.`);
    }
  }
  const closeMenus = useCallback(() => { setOpenMenuId(null); setCtxMenu(null); }, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'var(--font-family-geist)' }} onClick={() => { if (ctxMenu) setCtxMenu(null); }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Account</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>Users</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)', fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1.2 }}>Users</h1>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', fontWeight: 400 }}>
              Manage internal staff accounts and access permissions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {/* ① Purple primary CTA */}
            <button
              onClick={() => { setEditUser(null); setShowAddEdit(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6d28d9')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
            >
              <Plus size={15} /> Add User
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500 }}>
              <Download size={15} /> Export List
            </button>
          </div>
        </div>
      </div>

      {/* ── Unified Card (mirrors DriversTable structure exactly) ──────────── */}
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>

        {/* ① Status Tabs */}
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0 24px' }}>
          <StatusTabs tabs={statusTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* ② Toolbar: Search + Filters toggle */}
        <div style={{ padding: '16px 24px', borderBottom: filtersOpen ? 'none' : '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name, email, phone or user ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={e =>  { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px', borderRadius: 'var(--radius)', border: `1px solid ${filtersOpen || activeFilterCount > 0 ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: filtersOpen ? '#7C3AED' : activeFilterCount > 0 ? 'rgba(124,58,237,0.06)' : 'var(--color-card)', color: filtersOpen ? 'white' : activeFilterCount > 0 ? '#7C3AED' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px', backgroundColor: filtersOpen ? 'rgba(255,255,255,0.28)' : '#7C3AED', color: 'white', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ③ Collapsible Filter Panel */}
        <div style={{ maxHeight: filtersOpen ? '320px' : '0', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
          <div style={{ padding: '20px 24px 24px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Role */}
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Role</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ALL_ROLES.map(r => {
                    const active = roleFilter === r;
                    const m = ROLE_META[r];
                    return (
                      <button key={r} onClick={() => { setRoleFilter(active ? 'All' : r); setPage(1); }}
                        style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${active ? m.border : 'var(--color-border)'}`, backgroundColor: active ? m.bg : 'var(--color-card)', color: active ? m.color : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Office */}
              <div>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Office</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {ALL_OFFICES.map(o => {
                    const active = officeFilter === o;
                    return (
                      <button key={o} onClick={() => { setOfficeFilter(active ? 'All' : o); setPage(1); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${active ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: active ? 'rgba(124,58,237,0.08)' : 'var(--color-card)', color: active ? '#7C3AED' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <MapPin size={12} />{o}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active chips + Clear All */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', minHeight: '24px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                {roleFilter !== 'All' && <FilterChip label={`Role: ${roleFilter}`} onRemove={() => { setRoleFilter('All'); setPage(1); }} />}
                {officeFilter !== 'All' && <FilterChip label={`Office: ${officeFilter}`} onRemove={() => { setOfficeFilter('All'); setPage(1); }} />}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', backgroundColor: 'transparent', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                  <X size={12} /> Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ④ Count row */}
        <div style={{ padding: '12px 24px', borderBottom: selectedIds.size > 0 ? 'none' : '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>
            Showing {filtered.length > 0 ? startIdx + 1 : 0}–{endIdx} of {filtered.length.toLocaleString()} users
          </span>
        </div>

        {/* ⑤ Selection banner */}
        {selectedIds.size > 0 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(124,58,237,0.2)', borderBottom: '1px solid rgba(124,58,237,0.2)', backgroundColor: 'rgba(124,58,237,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: '#7C3AED' }}>
              {selectedIds.size} {selectedIds.size === 1 ? 'user' : 'users'} selected
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setSelectedIds(new Set())} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.35)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Clear
              </button>
              <button onClick={() => setBulkModal('role')} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.35)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Change Role
              </button>
              <button onClick={() => setBulkModal('deactivate')} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.35)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Deactivate
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.35)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                <Download size={13} /> Export Selected
              </button>
            </div>
          </div>
        )}

        {/* ⑥ Table */}
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <UsersIcon size={40} style={{ color: 'var(--color-muted-foreground)', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>No users found</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: '16px' }}>Try adjusting your search or filters</div>
            <button onClick={() => { setSearch(''); clearFilters(); setActiveTab('all'); }} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer' }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr>
                  {/* Checkbox */}
                  <th style={{ ...thBase, width: '52px', padding: '12px 16px' }}>
                    <Checkbox checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleAll} />
                  </th>
                  {/* ② User ID column REMOVED from table — visible only in drawer */}
                  <SortTh label="User"       field="name"      sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ minWidth: '220px' }} />
                  <th style={{ ...thBase }}>Role(s)</th>
                  <th style={{ ...thBase }}>Mobile</th>
                  <SortTh label="Office"     field="office"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Status"     field="status"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Last Login" field="lastLogin" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Created"    field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th style={{ ...thBase, position: 'sticky', right: 0, zIndex: 20, width: '60px', textAlign: 'center', boxShadow: '-3px 0 8px rgba(0,0,0,0.06)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(user => {
                  const isSelected = selectedIds.has(user.id);
                  const isEditing  = inlineEdit?.userId === user.id;
                  const avatarBg   = getAvatarColor(`${user.firstName} ${user.lastName}`);

                  return (
                    <tr
                      key={user.id}
                      style={{ backgroundColor: isSelected ? 'rgba(124,58,237,0.04)' : 'transparent', transition: 'background-color 0.15s', cursor: 'pointer' }}
                      onClick={() => { if (!inlineEdit) setDrawerUser(user); }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(124,58,237,0.04)' : 'transparent'; }}
                      onContextMenu={e => {
                        e.preventDefault(); e.stopPropagation();
                        closeMenus();
                        setCtxMenu({ user, x: e.clientX, y: e.clientY });
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ ...tdBase, padding: '14px 16px', width: '52px' }} onClick={e => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onChange={() => toggleRow(user.id)} />
                      </td>

                      {/* User: avatar + name + email */}
                      <td style={tdBase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, backgroundColor: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 700, color: 'white' }}>
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                              {user.firstName} {user.lastName}
                            </div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td style={tdBase} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                          {user.roles.slice(0, 2).map(r => (
                            <RoleBadge key={r} role={r}
                              onHover={(role, rect) => setTooltip({ role, rect })}
                              onLeave={() => setTooltip(null)}
                            />
                          ))}
                          {user.roles.length > 2 && (
                            <span style={{ padding: '2px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600 }}>
                              +{user.roles.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mobile — double-click to inline edit */}
                      <td style={tdBase}
                        onDoubleClick={e => { e.stopPropagation(); setInlineEdit({ userId: user.id, value: user.mobile }); }}
                        onClick={e => e.stopPropagation()}
                        title="Double-click to edit"
                      >
                        {isEditing ? (
                          <input
                            ref={inlineRef}
                            value={inlineEdit!.value}
                            onChange={e => setInlineEdit(p => p ? { ...p, value: e.target.value } : p)}
                            onBlur={commitInline}
                            onKeyDown={e => { if (e.key === 'Enter') commitInline(); if (e.key === 'Escape') setInlineEdit(null); }}
                            style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', border: '1px solid #7C3AED', borderRadius: 'var(--radius-sm)', padding: '3px 8px', outline: 'none', width: '130px', backgroundColor: 'var(--color-card)' }}
                          />
                        ) : (
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                            {user.mobile}
                          </span>
                        )}
                      </td>

                      {/* Office */}
                      <td style={tdBase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={12} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>{user.office}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={tdBase}><StatusBadge status={user.status} /></td>

                      {/* Last Login */}
                      <td style={tdBase}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)', fontStyle: user.lastLogin ? 'normal' : 'italic', whiteSpace: 'nowrap' }}>
                          {relativeTime(user.lastLogin)}
                        </span>
                      </td>

                      {/* Created */}
                      <td style={tdBase}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
                          {fmtDate(user.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdBase, position: 'sticky', right: 0, zIndex: 10, backgroundColor: isSelected ? 'rgba(124,58,237,0.04)' : 'var(--color-card)', textAlign: 'center', boxShadow: '-3px 0 8px rgba(0,0,0,0.06)', padding: '14px 12px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenuAnchor(rect);
                            setOpenMenuId(p => p === user.id ? null : user.id);
                            setCtxMenu(null);
                          }}
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)', margin: '0 auto' }}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuId === user.id && menuAnchor && (
                          <ActionMenu
                            user={user} anchorRect={menuAnchor} onClose={() => setOpenMenuId(null)}
                            onView={() => setDrawerUser(user)}
                            onEdit={() => { setEditUser(user); setShowAddEdit(true); }}
                            onToggleStatus={() => handleToggleStatus(user)}
                            onResendInvite={() => {}}
                            onDelete={() => setDeleteUser(user)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ⑦ Pagination */}
        {filtered.length > 0 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>Rows per page:</span>
              <div style={{ position: 'relative' }}>
                <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                  style={{ appearance: 'none', WebkitAppearance: 'none', padding: '4px 28px 4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer' }}>
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-foreground)' }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', border: `1px solid ${page === p ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: page === p ? '#7C3AED' : 'var(--color-card)', color: page === p ? 'white' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: page === p ? 700 : 400, cursor: 'pointer' }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-foreground)' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────────────── */}
      {tooltip && <RoleTooltip role={tooltip.role} rect={tooltip.rect} />}

      {ctxMenu && (
        <ContextMenu
          user={ctxMenu.user} x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          onView={() => setDrawerUser(ctxMenu.user)}
          onEdit={() => { setEditUser(ctxMenu.user); setShowAddEdit(true); }}
          onToggleStatus={() => handleToggleStatus(ctxMenu.user)}
          onCopyId={() => copyToClipboard(ctxMenu.user.id)}
          onDelete={() => setDeleteUser(ctxMenu.user)}
        />
      )}

      <UserDetailDrawer
        user={drawerUser} open={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        onEdit={u => { setEditUser(u); setShowAddEdit(true); }}
        onToggleStatus={handleToggleStatus}
        onDelete={u => setDeleteUser(u)}
      />
      <AddEditUserModal
        open={showAddEdit} user={editUser}
        existingEmails={users.filter(u => u.id !== editUser?.id).map(u => u.email)}
        onClose={() => { setShowAddEdit(false); setEditUser(null); }}
        onSave={handleSave}
      />
      {deleteUser && (
        <DeleteUserModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDelete={() => handleDelete(deleteUser.id)}
          onDeactivate={() => { handleToggleStatus(deleteUser); setDeleteUser(null); }}
        />
      )}
      {bulkModal && (
        <UserBulkActionsModal
          mode={bulkModal} users={selectedUsers}
          onClose={() => setBulkModal(null)}
          onApply={updated => {
            setUsers(p => p.map(u => updated.find(x => x.id === u.id) ?? u));
            setSelectedIds(new Set());
            setBulkModal(null);
          }}
        />
      )}
    </div>
  );
}
