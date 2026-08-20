import { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Plus, Download, Search, FileText, X,
  Send, Edit, Trash2, CheckCircle, Check,
  ChevronLeft, ChevronRight, AlertCircle, Clock,
  AlertTriangle, DollarSign, Eye, Copy,
  MoreVertical, Columns3, ChevronDown,
  ChevronsUpDown, ArrowUp, ArrowDown,
  SlidersHorizontal, Package, Calendar,
} from 'lucide-react';

import type { Quotation, QuotationStatus } from './quotation-data';
import {
  STATUS_CONFIG, SALES_PERSONS_LIST,
  formatIDR, getExpiryInfo, INITIAL_QUOTATIONS,
} from './quotation-data';

import { Checkbox } from '../components/Checkbox';
import { QuotationDetailDrawer } from '../components/QuotationDetailDrawer';
import { CreateEditQuotationModal } from '../components/CreateEditQuotationModal';
import { useToast, ToastContainer } from '../components/Toast';

// ── Column definitions ─────────────────────────────────────────────────────────

const ALL_COLS = [
  { key: 'quoNo',       label: 'Quotation No.'  },
  { key: 'nameClient',  label: 'Quotation Name' },
  { key: 'sales',       label: 'Sales Person'   },
  { key: 'status',      label: 'Status'         },
  { key: 'created',     label: 'Created'        },
  { key: 'convertedAt', label: 'Converted At'   },
  { key: 'tags',        label: 'Tags'           },
  { key: 'grandTotal',  label: 'Grand Total'    },
  { key: 'validity',    label: 'Valid Until'    },
  { key: 'products',    label: 'Products'       },
] as const;
type ColKey = typeof ALL_COLS[number]['key'];

const DEFAULT_COLS = new Set<ColKey>(['quoNo', 'nameClient', 'sales', 'status', 'created', 'convertedAt']);

// Frozen column widths (px) – used to compute sticky left offsets
const W_CHECKBOX = 52;
const W_ACTIONS  = 60;
const W_QUONO    = 160;
const W_NAME     = 240;

// ── Status tab config ──────────────────────────────────────────────────────────

const STATUS_TABS: { key: QuotationStatus | 'all'; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'lead',    label: 'Leads'   },
  { key: 'won',     label: 'Won'     },
  { key: 'lost',    label: 'Lost'    },
  { key: 'expired', label: 'Expired' },
  { key: 'draft',   label: 'Draft'   },
];

// ── Portal menu hook ───────────────────────────────────────────────────────────

function usePortalMenu() {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', outside);
    document.addEventListener('scroll',    scroll,   true);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('scroll',    scroll, true);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent, rightAlign = true, menuWidth = 195) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: rightAlign ? r.right - menuWidth : r.left });
    }
    setOpen(v => !v);
  };

  return { open, setOpen, pos, btnRef, menuRef, toggle };
}

// ── Mini display components ────────────────────────────────────────────────────

function SalesAvatar({ person, size = 28 }: { person: { name: string; initials: string }; size?: number }) {
  const colors = ['#7C3AED', '#2563EB', '#16A34A', '#EA580C', '#DB2777', '#0D9488'];
  const bg = colors[person.initials.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'var(--font-family-geist)',
      fontSize: size > 30 ? '12px' : '10px', fontWeight: 700, flexShrink: 0,
    }}>
      {person.initials}
    </div>
  );
}

function QStatusBadge({ status }: { status: QuotationStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: 'var(--radius-sm)',
      backgroundColor: s.bg, border: s.border || 'none', whiteSpace: 'nowrap',
    }}>
      {status !== 'draft' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
      )}
      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: s.color }}>
        {s.label}
      </span>
    </span>
  );
}

function QTagBadge({ tag }: { tag: { label: string; color: string; bg: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 'var(--radius-sm)', backgroundColor: tag.bg,
      fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
      color: tag.color, whiteSpace: 'nowrap',
    }}>
      {tag.label}
    </span>
  );
}

// ── Column Toggle (portal dropdown) ───────────────────────────────────────────

function ColumnToggle({ visibleCols, onToggle }: { visibleCols: Set<ColKey>; onToggle: (k: ColKey) => void }) {
  const { open, pos, btnRef, menuRef, toggle } = usePortalMenu();

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 220)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 14px', borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
      >
        <Columns3 size={15} />
        Columns
        <ChevronDown size={13} style={{ color: 'var(--color-muted-foreground)' }} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '220px', overflow: 'hidden', padding: '6px 0',
        }}>
          <div style={{
            padding: '8px 14px 6px',
            fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
            color: 'var(--color-muted-foreground)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            borderBottom: '1px solid var(--color-border)', marginBottom: '4px',
          }}>
            Toggle Columns
          </div>
          {ALL_COLS.map(col => {
            const isVisible = visibleCols.has(col.key);
            return (
              <button
                key={col.key}
                onClick={e => { e.stopPropagation(); onToggle(col.key); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {col.label}
                <span style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                  border: `1.5px solid ${isVisible ? '#7C3AED' : 'var(--color-border)'}`,
                  backgroundColor: isVisible ? '#7C3AED' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
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

// ── Multi-Select Dropdown ──────────────────────────────────────────────────────

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  minWidth = 180,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const menuRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const scroll = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    document.addEventListener('scroll',    scroll,   true);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('scroll',    scroll,   true);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(v => !v);
  };

  const toggleOption = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };

  const hasSelection = selected.length > 0;
  const displayText  = !hasSelection
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? `${selected.length} selected`
      : `${selected.length} selected`;

  return (
    <div style={{ position: 'relative', minWidth }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px', padding: '8px 10px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${hasSelection ? '#7C3AED' : 'var(--color-border)'}`,
          backgroundColor: hasSelection ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)',
          color: hasSelection ? '#7C3AED' : 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          cursor: 'pointer', outline: 'none', transition: 'all 0.15s',
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {displayText}
        </span>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            color: hasSelection ? '#7C3AED' : 'var(--color-muted-foreground)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          minWidth: Math.max(pos.width, 200),
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, overflow: 'hidden',
          maxHeight: '240px', overflowY: 'auto',
          padding: '4px 0',
        }}>
          {options.map(opt => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                  fontWeight: isSelected ? 500 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                  border: `1.5px solid ${isSelected ? '#7C3AED' : 'var(--color-border)'}`,
                  backgroundColor: isSelected ? '#7C3AED' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isSelected && <Check size={10} color="white" strokeWidth={3} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Sortable TH ────────────────────────────────────────────────────────────────

type SortColKey = 'quoNo' | 'grandTotal' | 'createdDate' | 'validUntil';

function SortableTh({ children, colKey, sortCol, sortDir, onSort, style }: {
  children: React.ReactNode;
  colKey: SortColKey;
  sortCol: SortColKey | null;
  sortDir: 'asc' | 'desc';
  onSort: (col: SortColKey) => void;
  style?: React.CSSProperties;
}) {
  const isActive = sortCol === colKey;
  return (
    <th onClick={() => onSort(colKey)} style={{ ...style, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {children}
        <span style={{ color: isActive ? '#7C3AED' : 'var(--color-border)', display: 'flex', transition: 'color 0.15s' }}>
          {isActive
            ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
            : <ChevronsUpDown size={12} />
          }
        </span>
      </div>
    </th>
  );
}

// ── Row Action Menu (portal) ───────────────────────────────────────────────────

function RowActionMenu({ quo, onView, onEdit, onSend, onConvert, onMarkLost, onDuplicate, onDelete }: {
  quo: Quotation;
  onView: () => void;
  onEdit: () => void;
  onSend: () => void;
  onConvert: () => void;
  onMarkLost: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { open, setOpen, pos, btnRef, menuRef, toggle } = usePortalMenu();

  const items = [
    { label: 'View Details',              icon: Eye,          action: onView,      danger: false },
    { label: 'Edit',                      icon: Edit,         action: onEdit,      danger: false },
    { label: 'Duplicate',                 icon: Copy,         action: onDuplicate, danger: false },
    { label: 'Send to Client',            icon: Send,         action: onSend,      danger: false },
    ...(quo.status === 'lead'
      ? [{ label: 'Convert to Sales Order', icon: CheckCircle, action: onConvert,  danger: false }]
      : []),
    ...(quo.status === 'lead' || quo.status === 'draft'
      ? [{ label: 'Mark as Lost',           icon: AlertCircle, action: onMarkLost, danger: false }]
      : []),
    { label: 'Delete',                    icon: Trash2,       action: onDelete,    danger: true  },
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={e => toggle(e, true, 210)}
        style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-muted-foreground)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
          e.currentTarget.style.color = 'var(--color-foreground)';
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.backgroundColor = 'var(--color-card)';
            e.currentTarget.style.color = 'var(--color-muted-foreground)';
          }
        }}
      >
        <MoreVertical size={15} />
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 99999, minWidth: '210px', overflow: 'hidden',
        }}>
          {items.map((item) => {
            const Icon = item.icon;
            const isDelete = item.label === 'Delete';
            return (
              <button
                key={item.label}
                onClick={e => { e.stopPropagation(); item.action(); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 14px', border: 'none',
                  borderTop: isDelete ? '1px solid var(--color-border)' : 'none',
                  backgroundColor: 'transparent',
                  color: item.danger ? '#DC2626' : 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = item.danger
                    ? 'rgba(239,68,68,0.07)'
                    : 'var(--color-secondary)';
                }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />
                {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Mark as Lost Modal ─────────────────────────────────────────────────────────

const LOST_REASONS = [
  'Price too high', 'Went with competitor', 'Client budget constraints',
  'Timing not right', 'Client unresponsive', 'Client cancelled project', 'Other',
];

function MarkLostModal({ quo, onConfirm, onClose }: {
  quo: Quotation;
  onConfirm: (id: string, reason: string, notes: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [notes,  setNotes]  = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', width: 480, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Mark Quotation as Lost</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: 2 }}>{quo.quoNo}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>
              Reason <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">Select a reason...</option>
                {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>Additional Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Provide more details about why this opportunity was lost..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => { if (!reason) return; onConfirm(quo.id, reason, notes); }}
            disabled={!reason}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: reason ? '#EF4444' : 'rgba(239,68,68,0.3)', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: reason ? 'pointer' : 'not-allowed' }}
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Convert to Sales Order Modal ───────────────────────────────────────────────

function ConvertSOModal({ quo, onConfirm, onClose }: {
  quo: Quotation;
  onConfirm: (id: string) => void;
  onClose: () => void;
}) {
  const [notifyClient, setNotifyClient] = useState(true);
  const soNumber = quo.quoNo.replace('QUO', 'SO');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', width: 480, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Convert to Sales Order</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: '#10B981', marginBottom: 4 }}>Converting {quo.quoNo}</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Client: {quo.clientName}</span>
              <span>Grand Total: {formatIDR(quo.grandTotal)}</span>
              <span>Products: {quo.products.length} item{quo.products.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Sales Order Number</span>
            <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-14)', fontWeight: 700, color: '#10B981' }}>{soNumber}</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={notifyClient} onChange={e => setNotifyClient(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#10B981' }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>Notify client via email</span>
          </label>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => onConfirm(quo.id)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#10B981', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={14} /> Convert to Sales Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Send to Client Modal ───────────────────────────────────────────────────────

function SendClientModal({ quo, onClose }: { quo: Quotation; onClose: () => void }) {
  const [subject, setSubject] = useState(`Quotation ${quo.quoNo} - ${quo.quoteName}`);
  const [email,   setEmail]   = useState(quo.contactEmail);
  const [sent,    setSent]    = useState(false);

  if (sent) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', width: 400, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '32px 24px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <CheckCircle size={24} style={{ color: '#10B981' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 6 }}>Quotation Sent</div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)', marginBottom: 20 }}>Sent successfully to {email}</div>
        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#10B981', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', width: 560, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)' }}>Send Quotation to Client</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>Recipient Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>Attachment</label>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} style={{ color: 'var(--color-muted-foreground)' }} />
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{quo.quoNo}.pdf</span>
              <CheckCircle size={14} style={{ color: '#10B981', marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => setSent(true)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={14} /> Send Quotation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function genQuoNo(count: number): string {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(-2);
  const DD  = String(now.getDate()).padStart(2, '0');
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(count).padStart(3, '0');
  return `QUO-${yy}${DD}${mm}-${seq}`;
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function Quotation() {
  const [quotations,     setQuotations]     = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const { toasts, showToast, dismiss }      = useToast();
  const [search,         setSearch]         = useState('');
  const [activeTab,      setActiveTab]      = useState<QuotationStatus | 'all'>('all');
  const [filterOpen,     setFilterOpen]     = useState(false);
  // Multi-select filter state
  const [filterSales,    setFilterSales]    = useState<string[]>([]);
  const [filterCompany,  setFilterCompany]  = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [sortCol,        setSortCol]        = useState<SortColKey | null>(null);
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('desc');
  const [page,           setPage]           = useState(1);
  const [rowsPerPage,    setRowsPerPage]    = useState(25);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [visibleCols,    setVisibleCols]    = useState<Set<ColKey>>(DEFAULT_COLS);
  const [hoveredId,      setHoveredId]      = useState<string | null>(null);
  const [detailQuo,      setDetailQuo]      = useState<Quotation | null>(null);
  const [showCreate,     setShowCreate]     = useState(false);
  const [editQuo,        setEditQuo]        = useState<Quotation | null>(null);
  const [lostQuo,        setLostQuo]        = useState<Quotation | null>(null);
  const [convertQuo,     setConvertQuo]     = useState<Quotation | null>(null);
  const [sendQuo,        setSendQuo]        = useState<Quotation | null>(null);
  const [rppOpen,        setRppOpen]        = useState(false);
  const rppRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (rppRef.current && !rppRef.current.contains(e.target as Node)) setRppOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Stats ──
  const stats = useMemo(() => {
    const leads    = quotations.filter(q => q.status === 'lead');
    const won      = quotations.filter(q => q.status === 'won');
    const lostExp  = quotations.filter(q => q.status === 'lost' || q.status === 'expired');
    const totalVal = [...leads, ...won].reduce((s, q) => s + q.grandTotal, 0);
    return { total: quotations.length, leads: leads.length, won: won.length, lostExp: lostExp.length, totalVal };
  }, [quotations]);

  // ── Tab counts ──
  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: quotations.length };
    quotations.forEach(q => { c[q.status] = (c[q.status] || 0) + 1; });
    return c;
  }, [quotations]);

  // ── Filter option lists ──
  const salesOptions = useMemo(
    () => SALES_PERSONS_LIST.map(s => ({ value: s.id, label: s.name })),
    []
  );
  const companyOptions = useMemo(() => {
    const names = [...new Set(quotations.map(q => q.clientName))].sort();
    return names.map(n => ({ value: n, label: n }));
  }, [quotations]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let list = [...quotations];
    if (activeTab !== 'all') list = list.filter(q => q.status === activeTab);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(q =>
        q.quoNo.toLowerCase().includes(s) ||
        q.clientName.toLowerCase().includes(s) ||
        q.quoteName.toLowerCase().includes(s) ||
        q.salesPerson.name.toLowerCase().includes(s) ||
        q.tags.some(t => t.label.toLowerCase().includes(s))
      );
    }
    if (filterSales.length > 0)   list = list.filter(q => filterSales.includes(q.salesPerson.id));
    if (filterCompany.length > 0) list = list.filter(q => filterCompany.includes(q.clientName));
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      list = list.filter(q => q.createdDateObj >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter(q => q.createdDateObj <= to);
    }
    if (sortCol) {
      list.sort((a, b) => {
        let va: number | string | Date, vb: number | string | Date;
        if      (sortCol === 'quoNo')       { va = a.quoNo;          vb = b.quoNo; }
        else if (sortCol === 'grandTotal')  { va = a.grandTotal;     vb = b.grandTotal; }
        else if (sortCol === 'createdDate') { va = a.createdDateObj; vb = b.createdDateObj; }
        else                               { va = a.validUntilDate; vb = b.validUntilDate; }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  }, [quotations, activeTab, search, filterSales, filterCompany, filterDateFrom, filterDateTo, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage   = Math.min(page, totalPages);
  const startIdx   = (safePage - 1) * rowsPerPage;
  const endIdx     = Math.min(startIdx + rowsPerPage, filtered.length);
  const paginated  = filtered.slice(startIdx, endIdx);

  // ── Handlers ──
  const handleSort = (col: SortColKey) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const handleToggleCol = (key: ColKey) => {
    setVisibleCols(prev => {
      const ns = new Set(prev);
      if (ns.has(key)) { if (ns.size > 1) ns.delete(key); }
      else ns.add(key);
      return ns;
    });
  };
  const allPageSelected = paginated.length > 0 && paginated.every(q => selectedIds.has(q.id));
  const handleSelectAll = (checked: boolean) => {
    const ns = new Set(selectedIds);
    if (checked) paginated.forEach(q => ns.add(q.id));
    else paginated.forEach(q => ns.delete(q.id));
    setSelectedIds(ns);
  };
  const handleSelectRow = (id: string) => {
    const ns = new Set(selectedIds);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelectedIds(ns);
  };
  const handleClearFilters = () => {
    setFilterSales([]);
    setFilterCompany([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  };

  const handleMarkLost = (id: string, reason: string) => {
    const quo = quotations.find(q => q.id === id);
    setQuotations(p => p.map(q =>
      q.id === id ? { ...q, status: 'lost' as QuotationStatus, lostReason: reason, convertedAt: 'Feb 20, 2026' } : q
    ));
    setLostQuo(null);
    if (quo) showToast('warning', 'Quotation Marked Lost', `${quo.quoNo} has been marked as lost.`);
  };
  const handleConvert = (id: string) => {
    const quo = quotations.find(q => q.id === id);
    setQuotations(p => p.map(q =>
      q.id === id ? { ...q, status: 'won' as QuotationStatus, convertedAt: 'Feb 20, 2026' } : q
    ));
    setConvertQuo(null);
    if (quo) showToast('success', 'Converted to Sales Order', `${quo.quoNo} has been converted successfully.`);
  };
  const handleDuplicate = (quo: Quotation) => {
    const newNo = genQuoNo(quotations.length + 1);
    const n: Quotation = {
      ...quo,
      id: newNo, quoNo: newNo,
      status: 'draft', createdDate: 'Feb 20, 2026', createdDateObj: new Date('2026-02-20'),
      convertedAt: undefined,
    };
    setQuotations(p => [n, ...p]);
    showToast('success', 'Quotation Duplicated', `A draft copy of ${quo.quoNo} has been created as ${newNo}.`);
  };
  const handleDelete = (id: string) => {
    const quo = quotations.find(q => q.id === id);
    if (window.confirm('Delete this quotation?')) {
      setQuotations(p => p.filter(q => q.id !== id));
      setSelectedIds(prev => { const ns = new Set(prev); ns.delete(id); return ns; });
      if (quo) showToast('success', 'Quotation Deleted', `${quo.quoNo} has been deleted.`);
    }
  };
  const handleExport = () => {
    const csv = [
      ['Quo No', 'Client', 'Quotation Name', 'Sales Person', 'Status', 'Grand Total', 'Created', 'Converted At'],
      ...quotations.map(q => [q.quoNo, q.clientName, q.quoteName, q.salesPerson.name, q.status, formatIDR(q.grandTotal), q.createdDate, q.convertedAt || '']),
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `quotations-${new Date().toISOString().split('T')[0]}.csv`,
    });
    a.click();
  };

  const selectedVal   = Array.from(selectedIds).reduce((s, id) => {
    const q = quotations.find(x => x.id === id);
    return s + (q?.grandTotal || 0);
  }, 0);
  const activeFilters = [
    filterSales.length > 0,
    filterCompany.length > 0,
    filterDateFrom !== '' || filterDateTo !== '',
  ].filter(Boolean).length;

  // ── Page numbers ──
  const pageNumbers: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    const left  = Math.max(1, safePage - 2);
    const right = Math.min(totalPages, safePage + 2);
    if (left > 1)               pageNumbers.push(1);
    if (left > 2)               pageNumbers.push(-1);
    for (let i = left; i <= right; i++) pageNumbers.push(i);
    if (right < totalPages - 1) pageNumbers.push(-2);
    if (right < totalPages)     pageNumbers.push(totalPages);
  }

  // ── Shared cell styles ──
  const thBase: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontFamily: 'var(--font-family-geist)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-muted-foreground)',
    backgroundColor: 'var(--color-secondary)',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--color-border)',
    userSelect: 'none',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  const tdBase: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'middle',
  };

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-foreground)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  // ── Frozen column sticky left offsets ──
  // Always frozen: Checkbox (W_CHECKBOX) + Actions (W_ACTIONS)
  // Conditionally frozen: quoNo (if visible) + nameClient (if visible)
  let frozenLeft = W_CHECKBOX + W_ACTIONS; // starts after checkbox + actions
  const quoNoLeft  = frozenLeft; if (visibleCols.has('quoNo'))      frozenLeft += W_QUONO;
  const nameLeft   = frozenLeft; if (visibleCols.has('nameClient')) frozenLeft += W_NAME;

  // Which frozen column is the last one (gets the divider shadow)
  const lastFrozenKey =
    visibleCols.has('nameClient') ? 'nameClient' :
    visibleCols.has('quoNo')      ? 'quoNo'      : 'actions';
  const frozenDivider = '3px 0 8px rgba(0,0,0,0.07)';

  // Helper: bg for frozen td cells
  const frozenCellBg = (isSelected: boolean, isHovered: boolean) =>
    isSelected ? 'rgba(124,58,237,0.04)' : isHovered ? 'var(--color-secondary)' : 'var(--color-card)';

  const visColCount = 2 + visibleCols.size;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Sales</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>Quotations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)', fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1.2 }}>
              Quotations
            </h1>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>
              Manage client quotes and convert to sales orders
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={handleExport}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
            >
              <Download size={15} /> Export List
            </button>
            <button
              onClick={() => { setEditQuo(null); setShowCreate(true); }}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              <Plus size={15} /> Create Quotation
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {([
          { label: 'Total Quotations',  value: String(stats.total),       sub: 'All time',                  color: '#7C3AED', bg: 'rgba(124,58,237,0.07)',  Icon: FileText    },
          { label: 'Active Leads',      value: String(stats.leads),       sub: 'Pending client decision',   color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',  Icon: Clock       },
          { label: 'Won (Converted)',   value: String(stats.won),         sub: 'Converted to Sales Orders', color: '#10B981', bg: 'rgba(16,185,129,0.07)',  Icon: CheckCircle },
          { label: 'Lost / Expired',    value: String(stats.lostExp),     sub: 'Expired or rejected',       color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   Icon: AlertCircle },
          { label: 'Total Quote Value', value: formatIDR(stats.totalVal), sub: 'Active leads + won',        color: '#10B981', bg: 'rgba(16,185,129,0.07)',  Icon: DollarSign  },
        ] as const).map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>{s.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={14} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: s.label === 'Total Quote Value' ? '15px' : 'var(--text-24)', fontWeight: 700, color: s.color, marginBottom: 4, lineHeight: 1.2, wordBreak: 'break-all' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      {/* NOTE: No overflow:hidden on the card — that would make it the sticky scroll-container
          and break the frozen columns. Sticky must reference the inner overflow-x:auto div. */}
      <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>

        {/* ── Status Tabs ── */}
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0 24px', display: 'flex', gap: 0 }}>
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count    = tabCounts[tab.key] || 0;
            const col      = tab.key === 'all' ? '#7C3AED' : (STATUS_CONFIG[tab.key as QuotationStatus]?.color || '#6B7280');
            const bgChip   = tab.key === 'all' ? 'rgba(124,58,237,0.1)' : (STATUS_CONFIG[tab.key as QuotationStatus]?.bg || 'var(--color-secondary)');
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key as QuotationStatus | 'all'); setPage(1); setSelectedIds(new Set()); }}
                style={{
                  padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#7C3AED' : 'var(--color-muted-foreground)',
                  borderBottom: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                  marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700,
                    color: isActive ? 'white' : col,
                    backgroundColor: isActive ? col : bgChip,
                    padding: '1px 6px', borderRadius: '999px', minWidth: 18, textAlign: 'center',
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ padding: '16px 24px', borderBottom: filterOpen ? 'none' : '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by quotation no., client name, quotation name, sales person, tags..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{
                  width: '100%', padding: '10px 14px 10px 40px',
                  borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-input-background)',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                  fontWeight: 400, color: 'var(--color-foreground)',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={e =>  { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setFilterOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 14px', borderRadius: 'var(--radius)',
                border: `1px solid ${filterOpen || activeFilters > 0 ? '#7C3AED' : 'var(--color-border)'}`,
                backgroundColor: filterOpen ? '#7C3AED' : activeFilters > 0 ? 'rgba(124,58,237,0.06)' : 'var(--color-card)',
                color: filterOpen ? 'white' : activeFilters > 0 ? '#7C3AED' : 'var(--color-foreground)',
                fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters > 0 && (
                <span style={{
                  minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px',
                  backgroundColor: filterOpen ? 'rgba(255,255,255,0.28)' : '#7C3AED',
                  color: 'white', fontSize: '11px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Column visibility */}
            <ColumnToggle visibleCols={visibleCols} onToggle={handleToggleCol} />
          </div>

          {/* ── Filter Panel ── */}
          <div style={{
            maxHeight: filterOpen ? '260px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{
              paddingTop: '14px', marginTop: '14px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
            }}>
              {/* Sales Person multi-select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 180px', minWidth: 0 }}>
                <label style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
                  color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Sales Person
                </label>
                <MultiSelect
                  options={salesOptions}
                  selected={filterSales}
                  onChange={v => { setFilterSales(v); setPage(1); }}
                  placeholder="All Sales Persons"
                  minWidth={180}
                />
              </div>

              {/* Company Name multi-select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 180px', minWidth: 0 }}>
                <label style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
                  color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Company Name
                </label>
                <MultiSelect
                  options={companyOptions}
                  selected={filterCompany}
                  onChange={v => { setFilterCompany(v); setPage(1); }}
                  placeholder="All Companies"
                  minWidth={180}
                />
              </div>

              {/* Date Period */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 260px', minWidth: 0 }}>
                <label style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
                  color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <Calendar size={11} /> Created Period
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
                    style={{
                      flex: 1, padding: '8px 10px',
                      borderRadius: 'var(--radius)',
                      border: `1px solid ${filterDateFrom ? '#7C3AED' : 'var(--color-border)'}`,
                      backgroundColor: filterDateFrom ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)',
                      color: filterDateFrom ? '#7C3AED' : 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      outline: 'none', cursor: 'pointer', minWidth: 0,
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', flexShrink: 0 }}>to</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    min={filterDateFrom || undefined}
                    onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
                    style={{
                      flex: 1, padding: '8px 10px',
                      borderRadius: 'var(--radius)',
                      border: `1px solid ${filterDateTo ? '#7C3AED' : 'var(--color-border)'}`,
                      backgroundColor: filterDateTo ? 'rgba(124,58,237,0.04)' : 'var(--color-input-background)',
                      color: filterDateTo ? '#7C3AED' : 'var(--color-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                      outline: 'none', cursor: 'pointer', minWidth: 0,
                    }}
                  />
                </div>
              </div>

              {/* Clear button */}
              {activeFilters > 0 && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '8px 12px', borderRadius: 'var(--radius)',
                    border: '1px solid rgba(220,38,38,0.2)', backgroundColor: 'rgba(220,38,38,0.04)',
                    color: '#DC2626', fontFamily: 'var(--font-family-geist)',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    alignSelf: 'flex-end', whiteSpace: 'nowrap',
                  }}
                >
                  <X size={12} /> Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Count row ── */}
        <div style={{ padding: '10px 24px', borderBottom: selectedIds.size > 0 ? 'none' : '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>
            Showing {filtered.length > 0 ? startIdx + 1 : 0}–{endIdx} of {filtered.length.toLocaleString()} quotations
          </span>
        </div>

        {/* ── Selection banner ── */}
        {selectedIds.size > 0 && (
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(124,58,237,0.2)',
            borderBottom: '1px solid rgba(124,58,237,0.2)',
            backgroundColor: 'rgba(124,58,237,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: '#7C3AED' }}>
              {selectedIds.size} quotation{selectedIds.size !== 1 ? 's' : ''} selected
              &nbsp;·&nbsp;
              <span style={{ fontWeight: 400 }}>{formatIDR(selectedVal)} total value</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.3)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                onClick={handleExport}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.3)', backgroundColor: 'transparent', color: '#7C3AED', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                <Download size={13} /> Export Selected
              </button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        {/* overflow-x:auto here (not on the card) so sticky left columns reference THIS as
            their scroll container, and the table can grow freely beyond the viewport. */}
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          {/* width:max-content lets the table grow as columns are toggled on.
              minWidth:100% ensures it fills the wrapper when few columns are shown.
              No tableLayout:fixed — that locks widths to the container and kills scroll. */}
          <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {/* ── Checkbox (frozen) ── */}
                <th style={{
                  ...thBase,
                  position: 'sticky', left: 0, zIndex: 21,
                  width: `${W_CHECKBOX}px`, padding: '12px 8px 12px 20px',
                  boxShadow: lastFrozenKey === 'actions' ? frozenDivider : undefined,
                }}>
                  <Checkbox checked={allPageSelected} onChange={handleSelectAll} />
                </th>

                {/* ── Actions (frozen, now 2nd) ── */}
                <th style={{
                  ...thBase,
                  position: 'sticky', left: `${W_CHECKBOX}px`, zIndex: 21,
                  width: `${W_ACTIONS}px`, textAlign: 'center',
                  boxShadow: lastFrozenKey === 'actions' ? frozenDivider : undefined,
                }}>
                  Actions
                </th>

                {/* ── Quotation No. (frozen if visible) ── */}
                {visibleCols.has('quoNo') && (
                  <SortableTh
                    colKey="quoNo"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                    style={{
                      ...thBase,
                      position: 'sticky', left: `${quoNoLeft}px`, zIndex: 21,
                      width: `${W_QUONO}px`,
                      boxShadow: lastFrozenKey === 'quoNo' ? frozenDivider : undefined,
                    }}
                  >
                    Quotation No.
                  </SortableTh>
                )}

                {/* ── Quotation Name + Client (frozen if visible) ── */}
                {visibleCols.has('nameClient') && (
                  <th style={{
                    ...thBase,
                    position: 'sticky', left: `${nameLeft}px`, zIndex: 21,
                    width: `${W_NAME}px`,
                    boxShadow: lastFrozenKey === 'nameClient' ? frozenDivider : undefined,
                  }}>
                    Quotation Name
                  </th>
                )}

                {/* ── Scrollable columns ── */}
                {visibleCols.has('sales') && (
                  <th style={{ ...thBase, minWidth: '160px' }}>Sales Person</th>
                )}
                {visibleCols.has('status') && (
                  <th style={{ ...thBase, minWidth: '110px' }}>Status</th>
                )}
                {visibleCols.has('created') && (
                  <SortableTh colKey="createdDate" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ ...thBase, minWidth: '130px' }}>
                    Created
                  </SortableTh>
                )}
                {visibleCols.has('convertedAt') && (
                  <th style={{ ...thBase, minWidth: '130px' }}>Converted At</th>
                )}
                {visibleCols.has('tags') && (
                  <th style={{ ...thBase, minWidth: '140px' }}>Tags</th>
                )}
                {visibleCols.has('grandTotal') && (
                  <SortableTh colKey="grandTotal" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ ...thBase, minWidth: '140px' }}>
                    Grand Total
                  </SortableTh>
                )}
                {visibleCols.has('validity') && (
                  <SortableTh colKey="validUntil" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ ...thBase, minWidth: '140px' }}>
                    Valid Until
                  </SortableTh>
                )}
                {visibleCols.has('products') && (
                  <th style={{ ...thBase, minWidth: '90px' }}>Products</th>
                )}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={visColCount} style={{ padding: '64px 24px', textAlign: 'center', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>
                    <FileText size={32} style={{ color: 'var(--color-border)', display: 'block', margin: '0 auto 10px' }} />
                    No quotations found matching your filters.
                  </td>
                </tr>
              ) : paginated.map(q => {
                const isSelected = selectedIds.has(q.id);
                const isHovered  = hoveredId === q.id;
                const expiry     = getExpiryInfo(q.validUntilDate);
                const fbg        = frozenCellBg(isSelected, isHovered);

                return (
                  <tr
                    key={q.id}
                    onClick={() => setDetailQuo(q)}
                    onMouseEnter={() => setHoveredId(q.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(124,58,237,0.04)' : 'transparent',
                      transition: 'background-color 0.15s',
                      cursor: 'pointer',
                    }}
                  >
                    {/* ── Checkbox (frozen) ── */}
                    <td
                      style={{
                        ...tdBase,
                        padding: '16px 8px 16px 20px',
                        position: 'sticky', left: 0, zIndex: 10,
                        backgroundColor: fbg,
                        boxShadow: lastFrozenKey === 'actions' ? frozenDivider : undefined,
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Checkbox checked={isSelected} onChange={() => handleSelectRow(q.id)} />
                    </td>

                    {/* ── Actions (frozen, 2nd) ── */}
                    <td
                      onClick={e => e.stopPropagation()}
                      style={{
                        ...tdBase,
                        position: 'sticky', left: `${W_CHECKBOX}px`, zIndex: 10,
                        backgroundColor: fbg, textAlign: 'center',
                        boxShadow: lastFrozenKey === 'actions' ? frozenDivider : undefined,
                      }}
                    >
                      <RowActionMenu
                        quo={q}
                        onView={() => setDetailQuo(q)}
                        onEdit={() => { setEditQuo(q); setShowCreate(true); }}
                        onSend={() => setSendQuo(q)}
                        onConvert={() => setConvertQuo(q)}
                        onMarkLost={() => setLostQuo(q)}
                        onDuplicate={() => handleDuplicate(q)}
                        onDelete={() => handleDelete(q.id)}
                      />
                    </td>

                    {/* ── Quotation No. (frozen) ── */}
                    {visibleCols.has('quoNo') && (
                      <td style={{
                        ...tdBase,
                        position: 'sticky', left: `${quoNoLeft}px`, zIndex: 10,
                        backgroundColor: fbg,
                        boxShadow: lastFrozenKey === 'quoNo' ? frozenDivider : undefined,
                      }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
                          {q.quoNo}
                        </span>
                      </td>
                    )}

                    {/* ── Quotation Name + Client (frozen) ── */}
                    {visibleCols.has('nameClient') && (
                      <td style={{
                        ...tdBase,
                        position: 'sticky', left: `${nameLeft}px`, zIndex: 10,
                        backgroundColor: fbg,
                        boxShadow: lastFrozenKey === 'nameClient' ? frozenDivider : undefined,
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            title={q.quoteName}
                            style={{
                              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600,
                              color: 'var(--color-foreground)', overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', display: 'block',
                              maxWidth: `${W_NAME - 32}px`,
                            }}
                          >
                            {q.quoteName}
                          </span>
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 400, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: `${W_NAME - 32}px` }}>
                            {q.clientName}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* ���─ Sales Person ── */}
                    {visibleCols.has('sales') && (
                      <td style={tdBase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SalesAvatar person={q.salesPerson} />
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                            {q.salesPerson.name}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* ── Status ── */}
                    {visibleCols.has('status') && (
                      <td style={tdBase} onClick={e => e.stopPropagation()}>
                        <QStatusBadge status={q.status} />
                      </td>
                    )}

                    {/* ── Created ── */}
                    {visibleCols.has('created') && (
                      <td style={tdBase}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                          {q.createdDate}
                        </span>
                      </td>
                    )}

                    {/* ── Converted At ── */}
                    {visibleCols.has('convertedAt') && (
                      <td style={tdBase}>
                        {q.convertedAt ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>
                              {q.convertedAt}
                            </span>
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: q.status === 'won' ? '#10B981' : '#EF4444' }}>
                              {q.status === 'won' ? 'Won' : q.status === 'lost' ? 'Lost' : ''}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>—</span>
                        )}
                      </td>
                    )}

                    {/* ── Tags ── */}
                    {visibleCols.has('tags') && (
                      <td style={tdBase}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {q.tags.slice(0, 2).map(t => <QTagBadge key={t.label} tag={t} />)}
                          {q.tags.length > 2 && (
                            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>+{q.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* ── Grand Total ── */}
                    {visibleCols.has('grandTotal') && (
                      <td style={tdBase}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>
                          {formatIDR(q.grandTotal)}
                        </span>
                      </td>
                    )}

                    {/* ── Valid Until ── */}
                    {visibleCols.has('validity') && (
                      <td style={tdBase}>
                        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: expiry.color, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {expiry.urgent && <AlertTriangle size={11} />}
                          {expiry.text}
                        </span>
                      </td>
                    )}

                    {/* ── Products ── */}
                    {visibleCols.has('products') && (
                      <td style={tdBase}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                          <Package size={11} style={{ color: 'var(--color-muted-foreground)' }} />
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)' }}>{q.products.length}</span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination bar ── */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

          {/* Left: count + rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
              Showing {filtered.length > 0 ? startIdx + 1 : 0}–{endIdx} of {filtered.length.toLocaleString()} quotations
            </span>

            {/* Rows per page */}
            <div ref={rppRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setRppOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {rowsPerPage} / page
                <ChevronDown size={12} style={{ color: 'var(--color-muted-foreground)' }} />
              </button>
              {rppOpen && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 9999, overflow: 'hidden', minWidth: '110px' }}>
                  {[10, 25, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => { setRowsPerPage(n); setPage(1); setRppOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: 'none', backgroundColor: 'transparent', color: n === rowsPerPage ? '#7C3AED' : 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: n === rowsPerPage ? 500 : 400, cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {n} rows
                      {n === rowsPerPage && <Check size={12} color="#7C3AED" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: page buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              disabled={safePage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ ...btnBase, opacity: safePage === 1 ? 0.4 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={15} />
            </button>

            {pageNumbers.map((p, idx) =>
              p < 0 ? (
                <span key={`el-${idx}`} style={{ padding: '0 4px', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    minWidth: '32px', height: '32px', borderRadius: 'var(--radius)',
                    border: p === safePage ? '1px solid #7C3AED' : '1px solid var(--color-border)',
                    backgroundColor: p === safePage ? '#7C3AED' : 'var(--color-card)',
                    color: p === safePage ? 'white' : 'var(--color-foreground)',
                    cursor: 'pointer', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                    fontWeight: p === safePage ? 500 : 400, padding: '0 8px', transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={safePage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ ...btnBase, opacity: safePage === totalPages ? 0.4 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Drawers & Modals ── */}
      <QuotationDetailDrawer
        open={!!detailQuo}
        quo={detailQuo}
        onClose={() => setDetailQuo(null)}
        onEdit={q => { setEditQuo(q); setShowCreate(true); setDetailQuo(null); }}
        onSend={q => setSendQuo(q)}
        onConvert={q => setConvertQuo(q)}
        onMarkLost={q => setLostQuo(q)}
        onDuplicate={handleDuplicate}
      />
      {showCreate && (
        <CreateEditQuotationModal
          quo={editQuo}
          onSave={data => {
            const isUpdate = !!(data.id && quotations.find(q => q.id === data.id));
            if (isUpdate) {
              setQuotations(p => p.map(q => q.id === data.id ? data : q));
              showToast('success', 'Quotation Updated', `${data.quoNo} has been updated.`);
            } else {
              setQuotations(p => [data, ...p]);
              showToast('success', 'Quotation Created', `${data.quoNo} has been created successfully.`);
            }
            setShowCreate(false);
            setEditQuo(null);
          }}
          onClose={() => { setShowCreate(false); setEditQuo(null); }}
        />
      )}
      {lostQuo    && <MarkLostModal   quo={lostQuo}    onConfirm={handleMarkLost} onClose={() => setLostQuo(null)} />}
      {convertQuo && <ConvertSOModal  quo={convertQuo} onConfirm={handleConvert}  onClose={() => setConvertQuo(null)} />}
      {sendQuo    && <SendClientModal quo={sendQuo}                               onClose={() => setSendQuo(null)} />}
    </>
  );
}
