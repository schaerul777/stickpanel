import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Phone, MapPin, Shield, Camera, Check, Loader } from 'lucide-react';
import type { User as UserType, UserRole, UserOffice, UserStatus } from '../pages/Users';
import { ROLE_META } from '../pages/Users';

const ALL_ROLES: UserRole[] = ['Admin', 'Finance', 'Sales', 'Ops', 'Customer Support', 'Viewer'];

interface Props {
  open: boolean;
  user: UserType | null;
  existingEmails: string[];
  onClose: () => void;
  onSave: (user: UserType) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  office: UserOffice;
  roles: UserRole[];
  status: UserStatus;
  sendWelcome: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  roles?: string;
}

function genId(): string {
  return `USR-${Math.floor(10000 + Math.random() * 90000)}`;
}

function fmtMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 4)  return digits;
  if (digits.length <= 8)  return `${digits.slice(0,4)}-${digits.slice(4)}`;
  if (digits.length <= 12) return `${digits.slice(0,4)}-${digits.slice(4,8)}-${digits.slice(8)}`;
  return `${digits.slice(0,4)}-${digits.slice(4,8)}-${digits.slice(8,12)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormField({
  label, required, error, helper, children,
}: { label: string; required?: boolean; error?: string; helper?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#DC2626' }}>{error}</span>}
      {helper && !error && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{helper}</span>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, icon, type = 'text', disabled,
  hasError,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  icon?: React.ReactNode; type?: string; disabled?: boolean; hasError?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && (
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }}>
          {icon}
        </div>
      )}
      <input
        type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: `9px 12px 9px ${icon ? '36px' : '12px'}`,
          borderRadius: 'var(--radius)', outline: 'none', boxSizing: 'border-box',
          border: `1px solid ${hasError ? '#DC2626' : 'var(--color-border)'}`,
          backgroundColor: disabled ? 'var(--color-secondary)' : 'var(--color-card)',
          color: 'var(--color-foreground)',
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function AddEditUserModal({ open, user, existingEmails, onClose, onSave }: Props) {
  const isEdit = !!user;

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', mobile: '',
    office: 'Jakarta', roles: [], status: 'active', sendWelcome: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSaving(false);
      if (user) {
        setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, mobile: user.mobile, office: user.office, roles: [...user.roles], status: user.status, sendWelcome: false });
      } else {
        setForm({ firstName: '', lastName: '', email: '', mobile: '', office: 'Jakarta', roles: [], status: 'active', sendWelcome: true });
      }
    }
  }, [open, user]);

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: undefined }));
  }

  function toggleRole(role: UserRole) {
    setForm(p => {
      const next = p.roles.includes(role) ? p.roles.filter(r => r !== role) : [...p.roles, role];
      return { ...p, roles: next };
    });
    setErrors(p => ({ ...p, roles: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) e.firstName = 'First name must be at least 2 characters';
    if (!form.lastName.trim() || form.lastName.trim().length < 2)  e.lastName  = 'Last name must be at least 2 characters';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address';
    else if (existingEmails.includes(form.email.toLowerCase())) e.email = 'This email is already registered';
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, '').length < 10) e.mobile = 'Please enter a valid Indonesian phone number';
    if (form.roles.length === 0) e.roles = 'At least one role must be assigned';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const saved: UserType = {
        id: user?.id ?? genId(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile,
        office: form.office,
        roles: form.roles,
        status: form.status,
        createdAt: user?.createdAt ?? new Date().toISOString().slice(0, 10),
        createdBy: user?.createdBy ?? 'Ahmad Rahman',
        lastLogin: user?.lastLogin,
        twoFA: user?.twoFA ?? false,
      };
      onSave(saved);
      setSaving(false);
    }, 800);
  }

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — also acts as the flex centering container */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Modal panel — nested inside backdrop so flex centering works
                stopPropagation prevents clicks inside from closing the modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '600px',
                maxWidth: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    {isEdit ? `Edit User: ${user.firstName} ${user.lastName}` : 'Add New User'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 400 }}>
                    {isEdit ? 'Update account details and role assignments' : 'Create a new internal staff account'}
                  </p>
                </div>
                <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)', flexShrink: 0 }}>
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable form body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {/* Avatar Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: 'var(--radius)', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, position: 'relative' }}>
                      {form.firstName ? `${form.firstName[0]}${form.lastName[0] ?? ''}`.toUpperCase() : <User size={28} />}
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-card)', border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Camera size={11} style={{ color: 'var(--color-muted-foreground)' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground)' }}>Upload Photo</div>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>JPG, PNG (max 2MB) — Optional</div>
                    </div>
                  </div>

                  {/* Name row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <FormField label="First Name" required error={errors.firstName}>
                      <TextInput value={form.firstName} onChange={v => setField('firstName', v)} placeholder="e.g., Ahmad" icon={<User size={14} />} hasError={!!errors.firstName} />
                    </FormField>
                    <FormField label="Last Name" required error={errors.lastName}>
                      <TextInput value={form.lastName} onChange={v => setField('lastName', v)} placeholder="e.g., Rahman" icon={<User size={14} />} hasError={!!errors.lastName} />
                    </FormField>
                  </div>

                  {/* Email */}
                  <FormField label="Email Address" required error={errors.email} helper="User will receive invite email to this address">
                    <TextInput value={form.email} onChange={v => setField('email', v)} placeholder="ahmad.rahman@company.com" icon={<Mail size={14} />} type="email" hasError={!!errors.email}
                      disabled={isEdit}
                    />
                    {isEdit && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>ℹ️ Changing email will send verification to the new address</span>}
                  </FormField>

                  {/* Mobile */}
                  <FormField label="Mobile Number" required error={errors.mobile}>
                    <TextInput value={form.mobile} onChange={v => setField('mobile', fmtMobile(v))} placeholder="0812-xxxx-xxxx" icon={<Phone size={14} />} hasError={!!errors.mobile} />
                  </FormField>

                  {/* Office */}
                  <FormField label="Office Location" required>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {(['Jakarta', 'Surabaya'] as UserOffice[]).map(o => (
                        <label key={o} onClick={() => setField('office', o)} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '12px 14px', borderRadius: 'var(--radius)', cursor: 'pointer',
                          border: `2px solid ${form.office === o ? '#2563EB' : 'var(--color-border)'}`,
                          backgroundColor: form.office === o ? 'rgba(37,99,235,0.06)' : 'var(--color-secondary)',
                          transition: 'all 0.15s',
                        }}>
                          <MapPin size={15} style={{ color: form.office === o ? '#2563EB' : 'var(--color-muted-foreground)', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: form.office === o ? 600 : 400, color: form.office === o ? '#2563EB' : 'var(--color-foreground)' }}>
                            🏢 {o}
                          </span>
                          <div style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${form.office === o ? '#2563EB' : 'var(--color-border)'}`, backgroundColor: form.office === o ? '#2563EB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {form.office === o && <Check size={9} color="white" strokeWidth={3} />}
                          </div>
                        </label>
                      ))}
                    </div>
                  </FormField>

                  {/* Roles */}
                  <FormField label="Assign Role(s)" required error={errors.roles} helper="User will have combined permissions from all assigned roles">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: 'var(--radius)', border: `1px solid ${errors.roles ? '#DC2626' : 'var(--color-border)'}`, backgroundColor: 'var(--color-secondary)' }}>
                      {ALL_ROLES.map(role => {
                        const m = ROLE_META[role];
                        const sel = form.roles.includes(role);
                        return (
                          <label key={role} onClick={() => toggleRole(role)} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 11px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            backgroundColor: sel ? m.bg : 'transparent',
                            border: `1px solid ${sel ? m.border : 'transparent'}`,
                            transition: 'all 0.12s',
                          }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${sel ? m.color : 'var(--color-border)'}`, backgroundColor: sel ? m.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
                              {sel && <Check size={9} color="white" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '15px' }}>{m.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: sel ? 600 : 400, color: sel ? m.color : 'var(--color-foreground)' }}>{role}</div>
                              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '1px' }}>{m.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </FormField>

                  {/* Send welcome email */}
                  {!isEdit && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.sendWelcome} onChange={() => setField('sendWelcome', !form.sendWelcome)} style={{ accentColor: '#2563EB', cursor: 'pointer', marginTop: '2px', width: '15px', height: '15px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>Send Welcome Email</div>
                        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Send account invitation email with setup instructions</div>
                      </div>
                    </label>
                  )}

                  {/* Account Status */}
                  <FormField label="Account Status">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {([
                        { val: 'active',   label: '✅ Active',   desc: 'User can log in immediately after accepting invite' },
                        { val: 'inactive', label: '⏸️ Inactive', desc: 'User account created but login disabled' },
                      ] as const).map(opt => (
                        <label key={opt.val} onClick={() => setField('status', opt.val)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius)', border: `2px solid ${form.status === opt.val ? '#2563EB' : 'var(--color-border)'}`, backgroundColor: form.status === opt.val ? 'rgba(37,99,235,0.05)' : 'var(--color-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${form.status === opt.val ? '#2563EB' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', transition: 'all 0.15s' }}>
                            {form.status === opt.val && <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563EB' }} />}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{opt.label}</div>
                            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </FormField>

                  {/* Danger Zone (edit only) */}
                  {isEdit && (
                    <div style={{ padding: '14px', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.03)' }}>
                      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>⚠ Danger Zone</div>
                      <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', fontWeight: 400 }}>
                        This action cannot be undone. All user data and activity will be permanently deleted.
                      </p>
                      <button style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.5)', backgroundColor: 'transparent', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Delete User Account
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: 'var(--color-secondary)' }}>
                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving} style={{
                  padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none',
                  backgroundColor: saving ? '#93C5FD' : '#2563EB', color: 'white',
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600,
                  cursor: saving ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}>
                  {saving
                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {isEdit ? 'Saving...' : 'Creating user...'}</>
                    : <>{isEdit ? 'Save Changes' : <><span>+</span> Create User</>}</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}