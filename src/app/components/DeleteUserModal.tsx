import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Trash2, UserX } from 'lucide-react';
import type { User } from '../pages/Users';
import { ROLE_META } from '../pages/Users';

interface Props {
  user: User;
  onClose: () => void;
  onDelete: () => void;
  onDeactivate: () => void;
}

export function DeleteUserModal({ user, onClose, onDelete, onDeactivate }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfirmed(false);
    setDeleting(false);
  }, [user]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setTimeout(() => { onDelete(); setDeleting(false); }, 600);
  }

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000 }}
      />
      <motion.div key="modal" initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '480px', maxWidth: 'calc(100vw - 40px)', zIndex: 10001,
          backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={20} style={{ color: '#DC2626' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>
              Delete User Account?
            </h3>
            <p style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 400 }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--color-foreground)' }}>{user.firstName} {user.lastName}</strong>'s account?
            </p>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* User info card */}
        <div style={{ margin: '0 24px 16px', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
          {[
            { label: 'User ID', value: user.id, mono: true },
            { label: 'Email',   value: user.email },
            { label: 'Role(s)', value: user.roles.join(', ') },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>{row.label}</span>
              <span style={{ fontFamily: row.mono ? 'monospace' : 'var(--font-family-geist)', fontSize: '13px', fontWeight: row.mono ? 700 : 500, color: row.mono ? '#2563EB' : 'var(--color-foreground)' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{ margin: '0 24px 16px', padding: '12px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>
            ⚠ This action cannot be undone. All data associated with this user will be permanently deleted.
          </p>
        </div>

        {/* Alternative suggestion */}
        <div style={{ margin: '0 24px 16px', padding: '10px 14px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#D97706', fontWeight: 400 }}>
            💡 Instead of deleting, you can <strong>deactivate</strong> this account to preserve data while removing access.
          </p>
        </div>

        {/* Confirm checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '0 24px 20px', cursor: 'pointer' }}>
          <input type="checkbox" checked={confirmed} onChange={() => setConfirmed(v => !v)} style={{ accentColor: '#DC2626', cursor: 'pointer', marginTop: '2px', width: '15px', height: '15px', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', fontWeight: 500 }}>
            I understand this action is permanent and cannot be undone
          </span>
        </label>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px', backgroundColor: 'var(--color-secondary)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onDeactivate} style={{ flex: 1, padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#D97706', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <UserX size={14} /> Deactivate Instead
          </button>
          <button onClick={handleDelete} disabled={!confirmed || deleting} style={{
            flex: 1, padding: '9px 16px', borderRadius: 'var(--radius)', border: 'none',
            backgroundColor: confirmed && !deleting ? '#DC2626' : 'rgba(239,68,68,0.3)',
            color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600,
            cursor: confirmed && !deleting ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background 0.2s',
          }}>
            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
