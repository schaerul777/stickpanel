import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Search, SlidersHorizontal, Columns3, Check, X, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown,
  ExternalLink, Edit, Users, FileText, LayoutGrid, Ban, UserCheck,
  Trash2, Download, MoreVertical, CheckCircle, Circle,
} from 'lucide-react';
import { StatusTabs } from './StatusTabs';
import { Checkbox } from './Checkbox';
import type { Client, Industry, ClientStatus } from '../pages/Clients';
import { INDUSTRY_META, SALES_PERSONS, countDocs } from '../pages/Clients';

interface Props {
  clients: Client[];
  onRowClick: (client: Client) => void;
  onAction: (action: string, clientId: string) => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_COLS = [
  { key: 'clientId',  label: 'Client ID' },
  { key: 'company',   label: 'Company'   },
  { key: 'industry',  label: 'Industry'  },
  { key: 'sales',     label: 'Sales'     },
  { key: 'contacts',  label: 'Contacts'  },
  { key: 'documents', label: 'Documents' },
  { key: 'website',   label: 'Website'   },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'status',    label: 'Status'    },
  { key: 'created',   label: 'Created'   },
] as const;

type ColKey = typeof ALL_COLS[number]['key'];
type SortCol = 'companyName' | 'industry' | 'salesPerson' | 'activeCampaigns' | 'createdAt' | null;
type SortDir = 'asc' | 'desc';

const STATUS_CFG: Record<ClientStatus, { bg: string; color: string; dot: string; label: string }> = {
  active:    { bg: 'rgba(34,197,94,0.1)',   color: '#16A34A', dot: '#22C55E', label: 'Active'    },
  inactive:  { bg: 'rgba(115,115,115,0.1)', color: '#525252', dot: '#A3A3A3', label: 'Inactive'  },
  suspended: { bg: 'rgba(245,158,11,0.1)',  color: '#D97706', dot: '#F59E0B', label: 'Suspended' },
};

function getDocLabel(client: Client): 'Complete' | 'Incomplete' | 'Missing' {
  const { uploaded, total } = countDocs(client);
  if (uploaded === total) return 'Complete';
  if (uploaded >= 2)      return 'Incomplete';
  return 'Missing';
}

// ── usePortalMenu ─────────────────────────────────────────────────────────────

function usePortalMenu() {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown   = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  const toggle = (e: React.MouseEvent, rightAlign = true, menuWidth = 200) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: rightAlign ? r.right - menuWidth : r.left });
    }
    setOpen(v => !v);
  };

  return { open, setOpen, pos, btnRef, menuRef, toggle };
}

// ── MultiCheckboxFilter ───────────────────────────────────────────────────────

function MultiCheckboxFilter({ selected, onChange, options, placeholder }: {
  selected: Set<string>; onChange: (v: Set<string>) => void;
  options: string[]; placeholder: string;
}) {
  const [open, setOpen]     = useState(false);
  const [srch, setSrch]     = useState('');
  const [rect, setRect]     = useState<DOMRect | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const active  = selected.size > 0;

  const openDrop = () => { if (btnRef.current) setRect(btnRef.current.getBoundingClientRect()); setOpen(v => !v); };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || dropRef.current?.contains(e.target as Node)) return;
      setOpen(false); setSrch('');
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const u = () => { if (btnRef.current) setRect(btnRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', u, true);
    window.addEventListener('resize', u);
    return () => { window.removeEventListener('scroll', u, true); window.removeEventListener('resize', u); };
  }, [open]);

  const toggle = (opt: string) => { const s = new Set(selected); s.has(opt) ? s.delete(opt) : s.add(opt); onChange(s); };
  const visible = srch.trim() ? options.filter(o => o.toLowerCase().includes(srch.toLowerCase())) : options;
  const label   = active ? (selected.size === 1 ? Array.from(selected)[0] : `${selected.size} selected`) : placeholder;

  const dropdown = (open && rect) ? ReactDOM.createPortal(
    <div ref={dropRef} style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200), zIndex: 99999, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 28px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
      {options.length > 5 && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
            <input autoFocus value={srch} onChange={e => setSrch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '5px 8px 5px 26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      )}
      <div style={{ padding: '5px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => onChange(new Set(options))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: '#7C3AED', padding: '2px 0' }}>All</button>
        <button onClick={() => onChange(new Set())}        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: 'var(--color-muted-foreground)', padding: '2px 0' }}>None</button>
        {active && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{selected.size} of {options.length}</span>}
      </div>
      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {visible.map(opt => {
          const checked = selected.has(opt);
          return (
            <div key={opt} onClick={() => toggle(opt)}
              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', cursor: 'pointer', backgroundColor: checked ? 'rgba(124,58,237,0.04)' : 'transparent', transition: 'background-color 0.1s' }}
              onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = checked ? 'rgba(124,58,237,0.04)' : 'transparent'; }}>
              <div style={{ width: '15px', height: '15px', borderRadius: '3px', flexShrink: 0, border: `1.5px solid ${checked ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: checked ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                {checked && <Check size={9} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{opt}</span>
            </div>
          );
        })}
        {visible.length === 0 && <div style={{ padding: '16px 10px', textAlign: 'center', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>No matches</div>}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={openDrop}
        style={{ width: '100%', padding: '8px 32px 8px 10px', borderRadius: 'var(--radius)', border: `1px solid ${active || open ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: active ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: active ? '#7C3AED' : 'var(--color-foreground)', fontWeight: active ? 500 : 400, textAlign: 'left', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '6px', transition: 'border-color 0.15s' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {active && <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px', backgroundColor: '#7C3AED', color: 'white', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{selected.size}</span>}
      </button>
      <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})`, color: active ? '#7C3AED' : 'var(--color-muted-foreground)', pointerEvents: 'none', transition: 'transform 0.15s' }} />
      {dropdown}
    </div>
  );
}

// ── FilterChip ────────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 10px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, color: '#7C3AED' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', display: 'flex', alignItems: 'center', color: '#7C3AED', opacity: 0.7 }}>
        <X size={11} />
      </button>
    </div>
  );
}

// ── FilterLabel ───────────────────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
      {children}
    </div>
  );
}

// ── Avatars ───────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  const colors = ['#7C3AED','#2563EB','#16A34A','#EA580C','#DB2777','#0D9488'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size > 28 ? '13px' : '10px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ── IndustryBadge ─────────────────────────────────────────────────────────────

function IndustryBadge({ industry }: { industry: Industry }) {
  const m = INDUSTRY_META[industry];
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: m.bg, color: m.color, fontSize: '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
      {industry}
    </span>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: c.bg, color: c.color, fontSize: '12px', fontFamily: 'var(--font-family-geist)', fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── DocStatus ─────────────────────────────────────────────────────────────────

function DocStatusCell({ client }: { client: Client }) {
  const { uploaded, total } = countDocs(client);
  const label = getDocLabel(client);
  const color = label === 'Complete' ? '#16A34A' : label === 'Incomplete' ? '#D97706' : '#DC2626';
  const bg    = label === 'Complete' ? 'rgba(22,163,74,0.08)' : label === 'Incomplete' ? 'rgba(245,158,11,0.08)' : 'rgba(220,38,38,0.08)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {client.documents.map(d => (
          d.uploaded
            ? <CheckCircle key={d.type} size={12} style={{ color: '#16A34A' }} />
            : <Circle      key={d.type} size={12} style={{ color: 'var(--color-border)' }} />
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color, backgroundColor: bg, padding: '1px 7px', borderRadius: 'var(--radius-sm)', display: 'inline-block', width: 'fit-content' }}>
        {uploaded}/{total} {label}
      </span>
    </div>
  );
}

// ── ActionMenu ────────────────────────────────────────────────────────────────

function ActionMenu({ client, onAction }: { client: Client; onAction: (a: string, id: string) => void }) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();
  const isInactive = client.status === 'inactive' || client.status === 'suspended';

  const items = [
    { action: 'view',      label: 'View Details',     Icon: ExternalLink, danger: false },
    { action: 'edit',      label: 'Edit Client',      Icon: Edit,         danger: false },
    { action: 'contacts',  label: 'Manage Contacts',  Icon: Users,        danger: false },
    { action: 'documents', label: 'Upload Documents', Icon: FileText,     danger: false },
    { action: 'campaigns', label: 'View Campaigns',   Icon: LayoutGrid,   danger: false },
    isInactive
      ? { action: 'activate',   label: 'Activate Client',   Icon: UserCheck, danger: false }
      : { action: 'deactivate', label: 'Deactivate Client', Icon: Ban,       danger: true  },
    { action: 'delete', label: 'Delete Client', Icon: Trash2, danger: true },
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={e => toggle(e, true, 200)}
        style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)', color: 'var(--color-muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; e.currentTarget.style.color = 'var(--color-foreground)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.backgroundColor = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-muted-foreground)'; } }}>
        <MoreVertical size={15} />
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 99999, minWidth: '200px', overflow: 'hidden' }}>
          {items.map((item, idx) => {
            const { Icon } = item;
            return (
              <button key={item.action}
                onClick={e => { e.stopPropagation(); onAction(item.action, client.id); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', border: 'none', borderTop: (idx === 5) ? '1px solid var(--color-border)' : 'none', backgroundColor: 'transparent', color: item.danger ? '#DC2626' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = item.danger ? 'rgba(220,38,38,0.07)' : 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Icon size={13} style={{ flexShrink: 0 }} /> {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── BulkActionsMenu ───────────────────────────────────────────────────────────

function BulkActionsMenu({ selectedIds, onAction, onClose }: { selectedIds: Set<string>; onAction: (a: string, ids: string[]) => void; onClose: () => void }) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();

  const items = [
    { action: 'export',       label: 'Export Selected',     Icon: Download, danger: false },
    { action: 'change-sales', label: 'Change Sales Person', Icon: UserCheck,danger: false },
    { action: 'deactivate',   label: 'Deactivate',          Icon: Ban,      danger: true  },
    { action: 'delete',       label: 'Delete',              Icon: Trash2,   danger: true  },
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={e => toggle(e, true, 200)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(59,130,246,0.35)', backgroundColor: 'transparent', color: '#3B82F6', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
        Bulk Actions <ChevronDown size={13} />
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 99999, minWidth: '200px', overflow: 'hidden' }}>
          {items.map((item, idx) => {
            const { Icon } = item;
            return (
              <button key={item.action}
                onClick={e => { e.stopPropagation(); onAction(item.action, Array.from(selectedIds)); setOpen(false); onClose(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', border: 'none', borderTop: idx === 2 ? '1px solid var(--color-border)' : 'none', backgroundColor: 'transparent', color: item.danger ? '#DC2626' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = item.danger ? 'rgba(220,38,38,0.07)' : 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Icon size={13} style={{ flexShrink: 0 }} /> {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── ColumnToggle ──────────────────────────────────────────────────────────────

function ColumnToggle({ visibleCols, onToggle }: { visibleCols: Set<ColKey>; onToggle: (k: ColKey) => void }) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();
  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={e => toggle(e, true, 200)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}>
        <Columns3 size={15} /> Columns <ChevronDown size={13} style={{ color: 'var(--color-muted-foreground)' }} />
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 99999, minWidth: '200px', overflow: 'hidden', padding: '6px 0' }}>
          <div style={{ padding: '8px 14px 6px', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>Toggle Columns</div>
          {ALL_COLS.map(col => {
            const isVisible = visibleCols.has(col.key);
            return (
              <button key={col.key} onClick={e => { e.stopPropagation(); onToggle(col.key); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                {col.label}
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: `1.5px solid ${isVisible ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: isVisible ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {isVisible && <Check size={10} color="white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── SortableTh ────────────────────────────────────────────────────────────────

function SortableTh({ children, colKey, sortCol, sortDir, onSort, style }: {
  children: React.ReactNode; colKey: SortCol; sortCol: SortCol; sortDir: SortDir;
  onSort: (col: SortCol) => void; style?: React.CSSProperties;
}) {
  const isActive = sortCol === colKey;
  return (
    <th onClick={() => onSort(colKey)} style={{ ...style, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {children}
        <span style={{ color: isActive ? '#7C3AED' : 'var(--color-border)', display: 'flex', transition: 'color 0.15s' }}>
          {isActive ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} />}
        </span>
      </div>
    </th>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const ALL_INDUSTRIES: Industry[] = ['F&B','Retail','Technology','Automotive','Healthcare','Finance','Entertainment','E-commerce','Fashion','Real Estate','Education','Hospitality','Logistics','Other'];
const ALL_DOC_STATUSES = ['Complete','Incomplete','Missing'];
const ALL_STATUSES = ['Active','Inactive','Suspended'];

export function ClientsTable({ clients, onRowClick, onAction, onBulkAction }: Props) {
  const [activeTab,    setActiveTab]    = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortCol,      setSortCol]      = useState<SortCol>(null);
  const [sortDir,      setSortDir]      = useState<SortDir>('asc');
  // Default visible: hide clientId, documents, website, campaigns
  const [visibleCols,  setVisibleCols]  = useState<Set<ColKey>>(
    new Set(ALL_COLS.map(c => c.key).filter(k => !['clientId','documents','website','campaigns'].includes(k)))
  );
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  // Filters
  const [fIndustries, setFIndustries] = useState<Set<string>>(new Set());
  const [fSales,      setFSales]      = useState<Set<string>>(new Set());
  const [fDocStatus,  setFDocStatus]  = useState<Set<string>>(new Set());
  const [fStatuses,   setFStatuses]   = useState<Set<string>>(new Set());
  const [fCreatedFrom,setFCreatedFrom]= useState('');
  const [fCreatedTo,  setFCreatedTo]  = useState('');

  const activeFilterCount = [
    fIndustries.size > 0, fSales.size > 0, fDocStatus.size > 0, fStatuses.size > 0,
    !!fCreatedFrom, !!fCreatedTo,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFIndustries(new Set()); setFSales(new Set()); setFDocStatus(new Set()); setFStatuses(new Set());
    setFCreatedFrom(''); setFCreatedTo(''); setCurrentPage(1);
  };

  const statusTabs = [
    { label: 'All Clients', value: 'all',       count: clients.length },
    { label: 'Active',      value: 'active',    count: clients.filter(c => c.status === 'active').length },
    { label: 'Inactive',    value: 'inactive',  count: clients.filter(c => c.status === 'inactive').length },
    { label: 'Suspended',   value: 'suspended', count: clients.filter(c => c.status === 'suspended').length },
  ];

  // Filter + search
  const tabFiltered = activeTab === 'all' ? clients : clients.filter(c => c.status === activeTab);
  const searched = tabFiltered.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.id.toLowerCase().includes(q) && !c.companyName.toLowerCase().includes(q) && !c.brands.some(b => b.name.toLowerCase().includes(q))) return false;
    }
    if (fIndustries.size > 0 && !fIndustries.has(c.industry)) return false;
    if (fSales.size > 0 && !fSales.has(c.salesPerson.name))   return false;
    if (fDocStatus.size > 0 && !fDocStatus.has(getDocLabel(c))) return false;
    if (fStatuses.size > 0) {
      const s = c.status.charAt(0).toUpperCase() + c.status.slice(1);
      if (!fStatuses.has(s)) return false;
    }
    return true;
  });

  const filtered = [...searched].sort((a, b) => {
    if (!sortCol) return 0;
    let av = '', bv = '';
    if (sortCol === 'companyName')     { av = a.companyName;        bv = b.companyName; }
    if (sortCol === 'industry')        { av = a.industry;           bv = b.industry; }
    if (sortCol === 'salesPerson')     { av = a.salesPerson.name;   bv = b.salesPerson.name; }
    if (sortCol === 'activeCampaigns') { av = String(a.activeCampaigns).padStart(6,'0'); bv = String(b.activeCampaigns).padStart(6,'0'); }
    if (sortCol === 'createdAt')       { av = a.createdAt;          bv = b.createdAt; }
    const cmp = av.localeCompare(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const startIdx   = (safePage - 1) * itemsPerPage;
  const paginated  = filtered.slice(startIdx, Math.min(startIdx + itemsPerPage, totalItems));

  const handleTabChange = (tab: string) => { setActiveTab(tab); setCurrentPage(1); setSelectedIds(new Set()); };
  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const handleToggleCol = (key: ColKey) => {
    setVisibleCols(prev => { const ns = new Set(prev); if (ns.has(key)) { if (ns.size > 1) ns.delete(key); } else ns.add(key); return ns; });
  };

  const allPageSelected = paginated.length > 0 && paginated.every(c => selectedIds.has(c.id));
  const handleSelectAll = (checked: boolean) => {
    const ns = new Set(selectedIds);
    if (checked) paginated.forEach(c => ns.add(c.id)); else paginated.forEach(c => ns.delete(c.id));
    setSelectedIds(ns);
  };
  const handleSelectRow = (id: string) => { const ns = new Set(selectedIds); ns.has(id) ? ns.delete(id) : ns.add(id); setSelectedIds(ns); };

  // Shared th/td styles matching DriversTable exactly
  const thBase: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-family-geist)',
    fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)',
    backgroundColor: 'var(--color-secondary)', whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--color-border)', userSelect: 'none',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  };
  const tdBase: React.CSSProperties = {
    padding: '16px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle',
  };

  // Page numbers
  const pageNumbers: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    const left = Math.max(1, safePage - 2), right = Math.min(totalPages, safePage + 2);
    if (left > 1) pageNumbers.push(1);
    if (left > 2) pageNumbers.push(-1);
    for (let i = left; i <= right; i++) pageNumbers.push(i);
    if (right < totalPages - 1) pageNumbers.push(-2);
    if (right < totalPages) pageNumbers.push(totalPages);
  }

  const paginBtnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: 'pointer', transition: 'all 0.15s' };

  return (
    <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>

      {/* ── Status Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0 24px' }}>
        <StatusTabs tabs={statusTabs} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* ── Toolbar ── */}
      <div style={{ padding: '16px 24px', borderBottom: filtersOpen ? 'none' : '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search by company name, brand name, or client ID..."
              value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
              onBlur={e  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px', borderRadius: 'var(--radius)', border: `1px solid ${filtersOpen || activeFilterCount > 0 ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: filtersOpen ? '#7C3AED' : activeFilterCount > 0 ? 'rgba(124,58,237,0.06)' : 'var(--color-card)', color: filtersOpen ? 'white' : activeFilterCount > 0 ? '#7C3AED' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px', backgroundColor: filtersOpen ? 'rgba(255,255,255,0.28)' : '#7C3AED', color: 'white', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Column visibility */}
          <ColumnToggle visibleCols={visibleCols} onToggle={handleToggleCol} />
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      <div style={{ maxHeight: filtersOpen ? '420px' : '0', overflow: 'hidden', transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: '20px 24px 24px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <FilterLabel>Industry</FilterLabel>
              <MultiCheckboxFilter selected={fIndustries} onChange={v => { setFIndustries(v); setCurrentPage(1); }} options={ALL_INDUSTRIES} placeholder="All Industries" />
            </div>
            <div>
              <FilterLabel>Sales Person</FilterLabel>
              <MultiCheckboxFilter selected={fSales} onChange={v => { setFSales(v); setCurrentPage(1); }} options={SALES_PERSONS.map(s => s.name)} placeholder="All Sales" />
            </div>
            <div>
              <FilterLabel>Document Status</FilterLabel>
              <MultiCheckboxFilter selected={fDocStatus} onChange={v => { setFDocStatus(v); setCurrentPage(1); }} options={ALL_DOC_STATUSES} placeholder="All Doc Status" />
            </div>
            <div>
              <FilterLabel>Status</FilterLabel>
              <MultiCheckboxFilter selected={fStatuses} onChange={v => { setFStatuses(v); setCurrentPage(1); }} options={ALL_STATUSES} placeholder="All Statuses" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
            <div>
              <FilterLabel>Created Date</FilterLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['From', 'To'] as const).map(lbl => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', width: '26px' }}>{lbl}</span>
                    <input type="date" value={lbl === 'From' ? fCreatedFrom : fCreatedTo}
                      onChange={e => { lbl === 'From' ? setFCreatedFrom(e.target.value) : setFCreatedTo(e.target.value); setCurrentPage(1); }}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: 'var(--radius)', boxSizing: 'border-box', border: `1px solid ${(lbl === 'From' ? fCreatedFrom : fCreatedTo) ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: (lbl === 'From' ? fCreatedFrom : fCreatedTo) ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', outline: 'none', transition: 'border-color 0.15s' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {Array.from(fIndustries).map(v => <FilterChip key={v} label={`Industry: ${v}`} onRemove={() => { const s = new Set(fIndustries); s.delete(v); setFIndustries(s); }} />)}
          {Array.from(fSales).map(v => <FilterChip key={v} label={`Sales: ${v}`} onRemove={() => { const s = new Set(fSales); s.delete(v); setFSales(s); }} />)}
          {Array.from(fDocStatus).map(v => <FilterChip key={v} label={`Docs: ${v}`} onRemove={() => { const s = new Set(fDocStatus); s.delete(v); setFDocStatus(s); }} />)}
          {Array.from(fStatuses).map(v => <FilterChip key={v} label={`Status: ${v}`} onRemove={() => { const s = new Set(fStatuses); s.delete(v); setFStatuses(s); }} />)}
          {fCreatedFrom && <FilterChip label={`From: ${fCreatedFrom}`} onRemove={() => setFCreatedFrom('')} />}
          {fCreatedTo   && <FilterChip label={`To: ${fCreatedTo}`}     onRemove={() => setFCreatedTo('')}   />}
          <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', padding: '3px 6px' }}>Clear all</button>
        </div>
      )}

      {/* ── Selection Banner ── */}
      {selectedIds.size > 0 && (
        <div style={{ padding: '10px 24px', backgroundColor: 'rgba(59,130,246,0.06)', borderBottom: '1px solid rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: '#2563EB' }}>{selectedIds.size} client{selectedIds.size > 1 ? 's' : ''} selected</span>
          <button onClick={() => setSelectedIds(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', padding: '0' }}>Clear</button>
          <BulkActionsMenu selectedIds={selectedIds} onAction={onBulkAction} onClose={() => setSelectedIds(new Set())} />
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thBase, width: '48px', paddingLeft: '20px' }}>
                <Checkbox checked={allPageSelected} indeterminate={selectedIds.size > 0 && !allPageSelected} onChange={handleSelectAll} />
              </th>
              {/* Client ID — always rendered but visibility toggled */}
              {visibleCols.has('clientId') && <th style={thBase}>Client ID</th>}
              {visibleCols.has('company')   && <SortableTh colKey="companyName"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={thBase}>Company</SortableTh>}
              {visibleCols.has('industry')  && <SortableTh colKey="industry"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={thBase}>Industry</SortableTh>}
              {visibleCols.has('sales')     && <SortableTh colKey="salesPerson"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={thBase}>Sales Person</SortableTh>}
              {visibleCols.has('contacts')  && <th style={thBase}>Contacts</th>}
              {visibleCols.has('documents') && <th style={thBase}>Documents</th>}
              {visibleCols.has('website')   && <th style={thBase}>Website</th>}
              {visibleCols.has('campaigns') && <SortableTh colKey="activeCampaigns" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={thBase}>Campaigns</SortableTh>}
              {visibleCols.has('status')    && <th style={thBase}>Status</th>}
              {visibleCols.has('created')   && <SortableTh colKey="createdAt"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={thBase}>Created</SortableTh>}
              <th style={{ ...thBase, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={20} style={{ ...tdBase, textAlign: 'center', padding: '64px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Search size={36} style={{ color: 'var(--color-border)' }} />
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 600, color: 'var(--color-foreground)' }}>No clients found</div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>Try adjusting your search or filters</div>
                    {activeFilterCount > 0 && (
                      <button onClick={clearAllFilters} style={{ padding: '8px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer' }}>Clear Filters</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginated.map(client => {
              const isSelected  = selectedIds.has(client.id);
              const primary     = client.contacts.find(c => c.isPrimary);
              const otherCount  = client.contacts.length - (primary ? 1 : 0);
              return (
                <tr key={client.id}
                  onClick={() => onRowClick(client)}
                  style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(59,130,246,0.04)' : 'transparent', transition: 'background-color 0.12s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>

                  {/* Checkbox */}
                  <td style={{ ...tdBase, paddingLeft: '20px', width: '48px' }} onClick={e => { e.stopPropagation(); handleSelectRow(client.id); }}>
                    <Checkbox checked={isSelected} onChange={() => handleSelectRow(client.id)} />
                  </td>

                  {/* Client ID */}
                  {visibleCols.has('clientId') && (
                    <td style={tdBase}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#2563EB', backgroundColor: 'rgba(37,99,235,0.07)', padding: '2px 7px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
                        {client.id}
                      </span>
                    </td>
                  )}

                  {/* Company */}
                  {visibleCols.has('company') && (
                    <td style={{ ...tdBase, minWidth: '220px' }}>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '5px' }}>{client.companyName}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {client.brands.slice(0, 3).map(b => (
                          <span key={b.id} style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: '#7C3AED', whiteSpace: 'nowrap' }}>
                          {b.name}
                          </span>
                        ))}
                        {client.brands.length > 3 && (
                          <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
                            +{client.brands.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Industry */}
                  {visibleCols.has('industry') && (
                    <td style={tdBase}><IndustryBadge industry={client.industry} /></td>
                  )}

                  {/* Sales Person */}
                  {visibleCols.has('sales') && (
                    <td style={tdBase}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar initials={client.salesPerson.initials} size={26} />
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 500, whiteSpace: 'nowrap' }}>{client.salesPerson.name}</span>
                      </div>
                    </td>
                  )}

                  {/* Contacts */}
                  {visibleCols.has('contacts') && (
                    <td style={{ ...tdBase, minWidth: '180px' }}>
                      {primary ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {/* Primary label + name */}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '10px', fontWeight: 600, color: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)', padding: '1px 5px', borderRadius: 'var(--radius-sm)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Primary</span>
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primary.name}</span>
                          </div>
                          {/* Mobile number */}
                          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', letterSpacing: '0.01em' }}>
                            {primary.mobile}
                          </div>
                          {/* +N other contacts */}
                          {otherCount > 0 && (
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: 'var(--color-muted-foreground)', marginTop: '1px' }}>
                              +{otherCount} other contact{otherCount > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>No contacts</span>
                      )}
                    </td>
                  )}

                  {/* Documents */}
                  {visibleCols.has('documents') && (
                    <td style={tdBase}><DocStatusCell client={client} /></td>
                  )}

                  {/* Website */}
                  {visibleCols.has('website') && (
                    <td style={tdBase}>
                      {client.website
                        ? <a href={`https://${client.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            {client.website} <ExternalLink size={11} />
                          </a>
                        : <span style={{ color: 'var(--color-border)', fontFamily: 'var(--font-family-geist)' }}>—</span>}
                    </td>
                  )}

                  {/* Campaigns */}
                  {visibleCols.has('campaigns') && (
                    <td style={tdBase}>
                      {client.activeCampaigns > 0
                        ? <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>{client.activeCampaigns} running</span>
                        : <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>None</span>}
                    </td>
                  )}

                  {/* Status */}
                  {visibleCols.has('status') && (
                    <td style={tdBase}><ClientStatusBadge status={client.status} /></td>
                  )}

                  {/* Created */}
                  {visibleCols.has('created') && (
                    <td style={tdBase}>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{client.createdAt}</span>
                    </td>
                  )}

                  {/* Actions */}
                  <td style={{ ...tdBase, textAlign: 'right', paddingRight: '16px' }} onClick={e => e.stopPropagation()}>
                    <ActionMenu client={client} onAction={onAction} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
            Showing {totalItems === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + itemsPerPage, totalItems)} of {totalItems} clients
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[10, 25, 50].map(n => (
              <button key={n} onClick={() => { setItemsPerPage(n); setCurrentPage(1); }}
                style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${itemsPerPage === n ? '#7C3AED' : 'var(--color-border)'}`, backgroundColor: itemsPerPage === n ? 'rgba(124,58,237,0.08)' : 'transparent', color: itemsPerPage === n ? '#7C3AED' : 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: itemsPerPage === n ? 600 : 400, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
            style={{ ...paginBtnBase, opacity: safePage === 1 ? 0.4 : 1, cursor: safePage === 1 ? 'default' : 'pointer' }}>
            <ChevronLeft size={14} />
          </button>
          {pageNumbers.map((n, i) => n < 0
            ? <span key={`dot-${i}`} style={{ padding: '0 4px', color: 'var(--color-muted-foreground)' }}>...</span>
            : <button key={n} onClick={() => setCurrentPage(n)}
                style={{ ...paginBtnBase, backgroundColor: safePage === n ? '#7C3AED' : 'var(--color-card)', color: safePage === n ? 'white' : 'var(--color-foreground)', border: `1px solid ${safePage === n ? '#7C3AED' : 'var(--color-border)'}`, fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: safePage === n ? 600 : 400 }}>
                {n}
              </button>
          )}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
            style={{ ...paginBtnBase, opacity: safePage === totalPages ? 0.4 : 1, cursor: safePage === totalPages ? 'default' : 'pointer' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}