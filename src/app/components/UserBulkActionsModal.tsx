import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronDown, UserX, Loader } from 'lucide-react';
import type { User, UserRole } from '../pages/Users';
import { ROLE_META, getAvatarColor, getInitials } from '../pages/Users';

const ALL_ROLES: UserRole[] = ['Admin', 'Finance', 'Sales', 'Ops', 'Customer Support', 'Viewer'];

type BulkMode = 'role' | 'deactivate';

interface Props {
  mode: BulkMode;
  users: User[];
  onClose: () => void;
  onApply: (updated: User[]) => void;
}

export function UserBulkActionsModal({ mode, users, onClose, onApply }: Props) {
  const [addRole, setAddRole]     = useState<UserRole | ''>('');
  const [removeRole, setRemoveRole] = useState<UserRole | ''>('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceWith, setReplaceWith] = useState<UserRole | ''>('');
  const [reason, setReason]       = useState('');
  const [notify, setNotify]       = useState(true);
  const [applying, setApplying]   = useState(false);

  useEffect(() => {
    setAddRole(''); setRemoveRole(''); setReplaceMode(false);
    setReplaceWith(''); setReason(''); setNotify(true); setApplying(false);
  }, [mode, users]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  function handleApply() {
    setApplying(true);
    setTimeout(() => {
      const updated = users.map(u => {
        if (mode === 'deactivate') return { ...u, status: 'inactive' as const };
        // role mode
        let roles = [...u.roles];
        if (replaceMode && replaceWith) { roles = [replaceWith]; }
        else {
          if (addRole && !roles.includes(addRole))    roles.push(addRole);
          if (removeRole && roles.includes(removeRole)) roles = roles.filter(r => r !== removeRole);
        }
        return { ...u, roles: roles.length ? roles : u.roles };
      });
      onApply(updated);
      setApplying(false);
    }, 700);
  }

  const title = mode === 'role' ? 'Change Role (Bulk)' : 'Deactivate Users (Bulk)';

  const RoleSelect = ({ value, onChange, placeholder }: { value: string; onChange: (v: UserRole | '') => void; placeholder: string }) => (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as UserRole | '')}
        style={{ appearance: 'none', WebkitAppearance: 'none', width: '100%', padding: '9px 36px 9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: value ? 'var(--color-foreground)' : 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', cursor: 'pointer', outline: 'none' }}
      >
        <option value="">{placeholder}</option>
        {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].emoji} {r}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
    </div>
  );

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000 }}
      />
      <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '520px', maxWidth: 'calc(100vw - 40px)', maxHeight: '85vh', zIndex: 10001, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>{title}</h3>
            <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 400 }}>
              Affects <strong style={{ color: 'var(--color-foreground)' }}>{users.length}</strong> selected {users.length === 1 ? 'user' : 'users'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Selected users list */}
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Selected Users
            </div>
            <div style={{ maxHeight: '160px', overflowY: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
              {users.map(u => {
                const ac = getAvatarColor(`${u.firstName} ${u.lastName}`);
                const ini = getInitials(u.firstName, u.lastName);
                return (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{ini}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.roles.join(', ')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode-specific controls */}
          {mode === 'role' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Role Changes
              </div>

              {/* Replace toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={replaceMode} onChange={() => setReplaceMode(v => !v)} style={{ accentColor: '#7C3AED', cursor: 'pointer', width: '14px', height: '14px' }} />
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', fontWeight: 500 }}>Replace Mode</span>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>(removes all current roles, assigns new one)</span>
              </label>

              {replaceMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>Replace All Roles With</label>
                  <RoleSelect value={replaceWith} onChange={setReplaceWith} placeholder="Select new role…" />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>Add Role</label>
                    <RoleSelect value={addRole} onChange={setAddRole} placeholder="Select role to add…" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>Remove Role</label>
                    <RoleSelect value={removeRole} onChange={setRemoveRole} placeholder="Select role to remove…" />
                  </div>
                </>
              )}

              {/* Preview */}
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#2563EB', fontWeight: 500 }}>
                  This will affect {users.length} user{users.length !== 1 ? 's' : ''}.
                </span>
              </div>
            </div>
          )}

          {mode === 'deactivate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Deactivation Options
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: '6px' }}>Reason (Optional)</label>
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g., Account no longer needed, employee has left..."
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={notify} onChange={() => setNotify(v => !v)} style={{ accentColor: '#7C3AED', cursor: 'pointer', width: '14px', height: '14px' }} />
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', fontWeight: 500 }}>Notify users via email</span>
              </label>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#D97706', fontWeight: 500 }}>
                  ⚠ {users.length} account{users.length !== 1 ? 's' : ''} will be deactivated. Users will lose access immediately.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: 'var(--color-secondary)' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleApply} disabled={applying} style={{
            padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none',
            backgroundColor: mode === 'deactivate' ? (applying ? 'rgba(245,158,11,0.5)' : '#D97706') : (applying ? 'rgba(37,99,235,0.5)' : '#2563EB'),
            color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600,
            cursor: applying ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            {applying
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Applying…</>
              : mode === 'deactivate'
                ? <><UserX size={14} /> Deactivate {users.length} {users.length === 1 ? 'User' : 'Users'}</>
                : <><Check size={14} /> Apply Changes</>
            }
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}