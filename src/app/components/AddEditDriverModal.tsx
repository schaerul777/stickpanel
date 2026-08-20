import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X, ChevronRight, ChevronLeft, ChevronDown, Check, AlertCircle,
  User, Car, CreditCard,
  Upload, Building2, Mail, Palette, Hash, Tag, Image as ImageIcon,
} from 'lucide-react';
import type { Driver } from './DriversTable';

// ── Types ────────────────────────────────────────────────────────────────────

interface AddEditDriverModalProps {
  open: boolean;
  driver?: Driver | null;   // null/undefined = Add mode
  onClose: () => void;
  onSave: (data: Partial<Driver>) => void;
}

type FormData = {
  // Step 1 – Personal
  name: string;
  email: string;
  mobile: string;
  birthDate: string;
  religion: string;
  city: string;
  domicile: string;
  // Step 2 – Identity
  nationalId: string;
  driverLicense: string;
  // Step 3 – Vehicle
  vehicleType: string;
  plateNumber: string;
  vehicleOwner: string;
  vehicleColor: string;
  manufacturedYear: string;
  odometerSticker: string;
  licenseNumberType: 'Black' | 'Yellow';
  // Step 4 – Banking
  bankAccountName: string;
  bankAccountNumber: string;
  accountRelation: Driver['accountRelation'];
  // Step 5 – Additional
  channel: Driver['channel'];
  driverType: Driver['driverType'];
  community: string;
  status: Driver['status'];
  isVIP: boolean;
};

function generateOdoSticker(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'ODO-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const VEHICLE_COLORS = [
  { name: 'White',     hex: '#F5F5F4' },
  { name: 'Silver',    hex: '#A8A29E' },
  { name: 'Gray',      hex: '#6B7280' },
  { name: 'Black',     hex: '#1C1917' },
  { name: 'Red',       hex: '#DC2626' },
  { name: 'Maroon',    hex: '#881337' },
  { name: 'Blue',      hex: '#2563EB' },
  { name: 'Dark Blue', hex: '#1E3A8A' },
  { name: 'Green',     hex: '#16A34A' },
  { name: 'Yellow',    hex: '#EAB308' },
  { name: 'Orange',    hex: '#EA580C' },
  { name: 'Brown',     hex: '#92400E' },
  { name: 'Gold',      hex: '#D97706' },
  { name: 'Beige',     hex: '#D4B896' },
];

const EMPTY: FormData = {
  name: '', email: '', mobile: '', birthDate: '', religion: '', city: '', domicile: '',
  nationalId: '', driverLicense: '',
  vehicleType: '', plateNumber: '',
  vehicleOwner: '', vehicleColor: '', manufacturedYear: '',
  odometerSticker: '', licenseNumberType: 'Black',
  bankAccountName: '', bankAccountNumber: '', accountRelation: 'Self',
  channel: 'GTI', driverType: 'Normal', community: '', status: 'active', isVIP: false,
};

// ── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Personal',   Icon: User       },
  { label: 'Identity',   Icon: Car        },
  { label: 'Vehicle',    Icon: Car        },
  { label: 'Banking',    Icon: CreditCard },
  { label: 'Additional', Icon: Building2  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-input-background)',
  fontFamily: 'var(--font-family-geist)',
  fontSize: 'var(--text-14)',
  fontWeight: 400,
  color: 'var(--color-foreground)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-family-geist)',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-foreground)',
  marginBottom: '5px',
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', color: '#DC2626', fontFamily: 'var(--font-family-geist)', fontSize: '12px' }}>
      <AlertCircle size={11} /> {msg}
    </div>
  );
}

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = 'text', error, monospace,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; error?: boolean; monospace?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputStyle,
        border: error ? '1px solid #DC2626' : '1px solid var(--color-border)',
        fontFamily: monospace ? 'monospace' : 'var(--font-family-geist)',
        letterSpacing: monospace ? '0.05em' : undefined,
      }}
      onFocus={e => { e.target.style.borderColor = error ? '#DC2626' : '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = error ? '#DC2626' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function Select({
  value, onChange, options, error,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; error?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingRight: '36px',
          cursor: 'pointer',
          border: error ? '1px solid #DC2626' : '1px solid var(--color-border)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
    </div>
  );
}

function MockUploadZone({ label, icon }: { label: string; icon?: React.ReactNode }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDrop={() => setDragging(false)}
      style={{
        border: `2px dashed ${dragging ? '#7C3AED' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius)',
        padding: '20px 16px',
        textAlign: 'center',
        backgroundColor: dragging ? 'rgba(124,58,237,0.04)' : 'var(--color-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ color: 'var(--color-muted-foreground)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        {icon ?? <Upload size={18} />}
      </div>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
        PNG, JPG up to 5 MB
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AddEditDriverModal({ open, driver, onClose, onSave }: AddEditDriverModalProps) {
  const isEdit = !!driver;
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState<FormData>(EMPTY);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [dirty, setDirty]     = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (open && driver) {
      setForm({
        name: driver.name, email: driver.email, mobile: driver.mobile,
        birthDate: driver.birthDate, religion: driver.religion || '', city: driver.city,
        domicile: driver.domicile, nationalId: driver.nationalId,
        driverLicense: driver.driverLicense, vehicleType: driver.vehicleType,
        plateNumber: driver.plateNumber,
        vehicleOwner: driver.vehicleOwner || driver.email,
        vehicleColor: driver.vehicleColor || '',
        manufacturedYear: driver.manufacturedYear ? String(driver.manufacturedYear) : '',
        odometerSticker: driver.odometerSticker || '',
        licenseNumberType: driver.licenseNumberType || 'Black',
        bankAccountName: driver.bankAccountName,
        bankAccountNumber: driver.bankAccountNumber, accountRelation: driver.accountRelation,
        channel: driver.channel, driverType: driver.driverType,
        community: driver.community || '', status: driver.status, isVIP: driver.isVIP,
      });
    } else if (open) {
      setForm({ ...EMPTY, odometerSticker: generateOdoSticker() });
    }
    setStep(0);
    setErrors({});
    setDirty(false);
  }, [open, driver?.id]);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
    setDirty(true);
  };

  // Validate current step
  const validateStep = (s: number): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 0) {
      if (!form.name.trim())     errs.name     = 'Full name is required';
      if (!form.email.trim())    errs.email    = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
      if (!form.mobile.trim())   errs.mobile   = 'Mobile number is required';
      else if (!/^0\d{8,11}$/.test(form.mobile.replace(/[-\s]/g, ''))) errs.mobile = 'Enter a valid Indonesian mobile number';
      if (!form.birthDate)       errs.birthDate = 'Birth date is required';
      if (!form.city.trim())     errs.city     = 'City is required';
      if (!form.domicile.trim()) errs.domicile = 'Domicile is required';
    }
    if (s === 1) {
      if (!form.nationalId.trim())     errs.nationalId    = 'National ID is required';
      else if (!/^\d{16}$/.test(form.nationalId)) errs.nationalId = 'Must be exactly 16 digits';
      if (!form.driverLicense.trim())  errs.driverLicense = 'Driver license number is required';
    }
    if (s === 2) {
      if (!form.vehicleType.trim()) errs.vehicleType = 'Vehicle type is required';
      if (!form.plateNumber.trim()) errs.plateNumber = 'Plate number is required';
    }
    if (s === 3) {
      if (!form.bankAccountName.trim())   errs.bankAccountName   = 'Account name is required';
      if (!form.bankAccountNumber.trim()) errs.bankAccountNumber = 'Account number is required';
      else if (!/^\d{8,16}$/.test(form.bankAccountNumber)) errs.bankAccountNumber = 'Must be 8–16 digits';
    }
    if (s === 4) {
      // channel always has a default, no required check needed
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => Math.min(STEPS.length - 1, s + 1));
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleSave = () => {
    if (!validateStep(step)) return;
    onSave({ ...form });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Full Name" required error={errors.name}>
          <Input value={form.name} onChange={v => set('name', v)} placeholder="e.g. Budi Santoso" error={!!errors.name} />
        </Field>
      </div>
      <Field label="Email Address" required error={errors.email}>
        <Input value={form.email} onChange={v => set('email', v)} placeholder="budi@email.com" type="email" error={!!errors.email} />
      </Field>
      <Field label="Mobile Number" required error={errors.mobile}>
        <Input value={form.mobile} onChange={v => set('mobile', v)} placeholder="0812-3456-7890" error={!!errors.mobile} />
      </Field>
      <Field label="Birth Date" required error={errors.birthDate}>
        <Input value={form.birthDate} onChange={v => set('birthDate', v)} type="date" error={!!errors.birthDate} />
      </Field>
      <Field label="Religion">
        <Select
          value={form.religion}
          onChange={v => set('religion', v)}
          options={[
            { value: '', label: 'Select religion' },
            { value: 'Islam', label: 'Islam' },
            { value: 'Kristen', label: 'Kristen' },
            { value: 'Katolik', label: 'Katolik' },
            { value: 'Hindu', label: 'Hindu' },
            { value: 'Buddha', label: 'Buddha' },
            { value: 'Konghucu', label: 'Konghucu' },
          ]}
        />
      </Field>
      <Field label="City" required error={errors.city}>
        <Select
          value={form.city}
          onChange={v => set('city', v)}
          options={[
            { value: '', label: 'Select city' },
            { value: 'Jakarta',   label: 'Jakarta'   },
            { value: 'Bandung',   label: 'Bandung'   },
            { value: 'Surabaya',  label: 'Surabaya'  },
            { value: 'Semarang',  label: 'Semarang'  },
            { value: 'Medan',     label: 'Medan'     },
            { value: 'Yogyakarta', label: 'Yogyakarta' },
            { value: 'Makassar',  label: 'Makassar'  },
          ]}
          error={!!errors.city}
        />
      </Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Domicile Address" required error={errors.domicile}>
          <Input value={form.domicile} onChange={v => set('domicile', v)} placeholder="e.g. Kebayoran Baru" error={!!errors.domicile} />
        </Field>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* National ID */}
      <div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={14} /> National ID (KTP)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="NIK / ID Number" required error={errors.nationalId}>
            <Input value={form.nationalId} onChange={v => set('nationalId', v)} placeholder="16-digit number" monospace error={!!errors.nationalId} />
          </Field>
          <MockUploadZone label="Upload National ID (KTP) image" />
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

      {/* Driver License */}
      <div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Car size={14} /> Driver License (SIM)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="License Number" required error={errors.driverLicense}>
            <Input value={form.driverLicense} onChange={v => set('driverLicense', v)} placeholder="e.g. A1234567890" monospace error={!!errors.driverLicense} />
          </Field>
          <MockUploadZone label="Upload Driver License (SIM) image" />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Vehicle Type" required error={errors.vehicleType}>
          <Select
            value={form.vehicleType}
            onChange={v => set('vehicleType', v)}
            options={[
              { value: '', label: 'Select vehicle type' },
              { value: 'Toyota Calya',     label: 'Toyota Calya'     },
              { value: 'Toyota Agya',      label: 'Toyota Agya'      },
              { value: 'Honda Brio',       label: 'Honda Brio'       },
              { value: 'Daihatsu Ayla',    label: 'Daihatsu Ayla'    },
              { value: 'Daihatsu Sigra',   label: 'Daihatsu Sigra'   },
              { value: 'Suzuki Ertiga',    label: 'Suzuki Ertiga'    },
              { value: 'Mitsubishi Xpander', label: 'Mitsubishi Xpander' },
              { value: 'Other',            label: 'Other'            },
            ]}
            error={!!errors.vehicleType}
          />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Plate Number" required error={errors.plateNumber}>
          <Input
            value={form.plateNumber}
            onChange={v => set('plateNumber', v.toUpperCase())}
            placeholder="e.g. B 1234 XYZ"
            monospace
            error={!!errors.plateNumber}
          />
        </Field>
      </div>
      {/* Owner */}
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Owner (Email)">
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-muted-foreground)', pointerEvents: 'none', display: 'flex',
            }}>
              <Mail size={14} />
            </div>
            <input
              style={{ ...inputStyle, paddingLeft: '32px' }}
              value={form.vehicleOwner}
              onChange={e => set('vehicleOwner', e.target.value)}
              placeholder={form.email || 'Owner email address'}
            />
          </div>
        </Field>
      </div>

      {/* Vehicle Color */}
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Vehicle Color">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
            {VEHICLE_COLORS.map(c => {
              const selected = form.vehicleColor === c.name;
              const isLight = ['White', 'Silver', 'Beige', 'Yellow'].includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => set('vehicleColor', c.name)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: c.hex, cursor: 'pointer',
                    border: selected
                      ? `3px solid var(--color-primary)`
                      : isLight
                        ? '1.5px solid var(--color-border)'
                        : '1.5px solid transparent',
                    boxShadow: selected ? `0 0 0 2px var(--color-background), 0 0 0 4px var(--color-primary)` : 'none',
                    transition: 'all 0.15s',
                    outline: 'none',
                  }}
                />
              );
            })}
          </div>
          {form.vehicleColor && (
            <div style={{
              marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-13)',
              color: 'var(--color-muted-foreground)',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: VEHICLE_COLORS.find(c => c.name === form.vehicleColor)?.hex || '#888',
                border: '1px solid var(--color-border)',
              }} />
              {form.vehicleColor}
            </div>
          )}
        </Field>
      </div>

      {/* Manufactured Year + License Number Type */}
      <Field label="Manufactured Year">
        <div style={{ position: 'relative' }}>
          <select
            style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
            value={form.manufacturedYear}
            onChange={e => set('manufacturedYear', e.target.value)}
          >
            <option value="">Select year</option>
            {Array.from({ length: 26 }, (_, i) => 2025 - i).map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }} />
        </div>
      </Field>

      <Field label="License Plate Type">
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['Black', 'Yellow'] as const).map(type => {
            const selected = form.licenseNumberType === type;
            const plateStyle = type === 'Black'
              ? { bg: '#1C1917', text: '#FFFFFF', sample: 'B 1234 XY' }
              : { bg: '#EAB308', text: '#1C1917', sample: 'B 1234 XY' };
            return (
              <button
                key={type}
                type="button"
                onClick={() => set('licenseNumberType', type)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 'var(--radius)',
                  border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  backgroundColor: selected ? 'rgba(124,58,237,0.06)' : 'var(--color-input-background)',
                  cursor: 'pointer', transition: 'all 0.15s', outline: 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                }}
              >
                <div style={{
                  backgroundColor: plateStyle.bg, color: plateStyle.text,
                  padding: '3px 8px', borderRadius: '3px',
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.06em', border: `1px solid ${type === 'Black' ? '#555' : '#CA8A04'}`,
                }}>
                  {plateStyle.sample}
                </div>
                <span style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: '11px',
                  fontWeight: selected ? 600 : 400,
                  color: selected ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                }}>
                  {type} Plate
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {/* Odometer Sticker */}
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Odometer Sticker Code">
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-muted-foreground)', pointerEvents: 'none', display: 'flex',
            }}>
              <Hash size={14} />
            </div>
            <input
              style={{
                ...inputStyle, paddingLeft: '32px',
                fontFamily: 'monospace', letterSpacing: '0.08em', fontWeight: 600,
                backgroundColor: 'var(--color-secondary)',
                color: 'var(--color-muted-foreground)',
              }}
              value={form.odometerSticker}
              readOnly
            />
            <div style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontFamily: 'var(--font-family-geist)', fontSize: '11px',
              color: 'var(--color-muted-foreground)',
            }}>
              <Tag size={11} /> Auto-generated
            </div>
          </div>
          <div style={{
            marginTop: '5px', fontFamily: 'var(--font-family-geist)', fontSize: '12px',
            color: 'var(--color-muted-foreground)',
          }}>
            Unique sticker code used to prevent odometer photo fraud. Cannot be changed after creation.
          </div>
        </Field>
      </div>

      {/* STNK Image */}
      <div style={{ gridColumn: '1 / -1' }}>
        <MockUploadZone label="Upload STNK (Vehicle Registration Document)" icon={<ImageIcon size={20} />} />
      </div>

      {/* Vehicle Photo */}
      <div style={{ gridColumn: '1 / -1' }}>
        <MockUploadZone label="Upload vehicle photo (optional)" />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Bank Name">
          <Select
            value=""
            onChange={() => {}}
            options={[
              { value: '',        label: 'Select bank' },
              { value: 'BCA',     label: 'BCA'     },
              { value: 'Mandiri', label: 'Mandiri' },
              { value: 'BRI',     label: 'BRI'     },
              { value: 'BNI',     label: 'BNI'     },
              { value: 'CIMB',    label: 'CIMB'    },
              { value: 'Danamon', label: 'Danamon' },
              { value: 'Permata', label: 'Permata' },
            ]}
          />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Account Name (as registered)" required error={errors.bankAccountName}>
          <Input value={form.bankAccountName} onChange={v => set('bankAccountName', v)} placeholder="Name exactly as in bank records" error={!!errors.bankAccountName} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Account Number" required error={errors.bankAccountNumber}>
          <Input value={form.bankAccountNumber} onChange={v => set('bankAccountNumber', v)} placeholder="8–16 digit account number" monospace error={!!errors.bankAccountNumber} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Account Relation">
          <Select
            value={form.accountRelation}
            onChange={v => set('accountRelation', v as Driver['accountRelation'])}
            options={[
              { value: 'Self',           label: 'Self'            },
              { value: 'Wife/Husband',   label: 'Wife / Husband'  },
              { value: 'Brother/Sister', label: 'Brother / Sister' },
              { value: 'Parents',        label: 'Parents'         },
              { value: 'Other',          label: 'Other'           },
            ]}
          />
        </Field>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <Field label="Channel" required>
        <Select
          value={form.channel}
          onChange={v => set('channel', v as Driver['channel'])}
          options={[
            { value: 'GTI',      label: 'GTI'      },
            { value: 'TPI',      label: 'TPI'      },
            { value: 'NON GRAB', label: 'NON GRAB' },
          ]}
        />
      </Field>
      <Field label="Driver Type">
        <Select
          value={form.driverType}
          onChange={v => set('driverType', v as Driver['driverType'])}
          options={[
            { value: 'Normal',      label: 'Normal'      },
            { value: 'Replacement', label: 'Replacement' },
            { value: 'Vendor',      label: 'Vendor'      },
          ]}
        />
      </Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Community">
          <Input value={form.community} onChange={v => set('community', v)} placeholder="e.g. Komunitas Jakarta Selatan" />
        </Field>
      </div>
      <Field label="Initial Status">
        <Select
          value={form.status}
          onChange={v => set('status', v as Driver['status'])}
          options={[
            { value: 'active',   label: 'Active'   },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </Field>
      <Field label="VIP Status">
        <div
          onClick={() => set('isVIP', !form.isVIP)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: 'var(--radius)',
            border: `1px solid ${form.isVIP ? 'rgba(245,158,11,0.4)' : 'var(--color-border)'}`,
            backgroundColor: form.isVIP ? 'rgba(245,158,11,0.06)' : 'transparent',
            cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
          }}
        >
          <div style={{
            width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
            border: `1.5px solid ${form.isVIP ? '#D97706' : 'var(--color-border)'}`,
            backgroundColor: form.isVIP ? '#D97706' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {form.isVIP && <Check size={10} color="white" strokeWidth={3} />}
          </div>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: form.isVIP ? 500 : 400, color: form.isVIP ? '#D97706' : 'var(--color-foreground)' }}>
            Mark as VIP driver
          </span>
        </div>
      </Field>
    </div>
  );

  const STEP_CONTENT = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9990 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9991,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', pointerEvents: 'none',
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            width: '100%', maxWidth: '600px',
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'all',
          }}
        >
          {/* ── Header ── */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-18)', fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>
                {isEdit ? `Edit Driver: ${driver!.name}` : 'Add New Driver'}
              </h2>
              <p style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)', margin: '4px 0 0' }}>
                Step {step + 1} of {STEPS.length} — {STEPS[step].label}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{ width: '30px', height: '30px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Step indicator ── */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div
                    onClick={() => i < step && setStep(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      cursor: i < step ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-family-geist)',
                      backgroundColor: i < step ? '#7C3AED' : i === step ? '#7C3AED' : 'var(--color-secondary)',
                      color: i <= step ? 'white' : 'var(--color-muted-foreground)',
                      border: i === step ? 'none' : i < step ? 'none' : '1.5px solid var(--color-border)',
                      transition: 'all 0.2s',
                    }}>
                      {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                      fontWeight: i === step ? 600 : 400,
                      color: i === step ? '#7C3AED' : i < step ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                      whiteSpace: 'nowrap',
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: '2px', margin: '0 8px', backgroundColor: i < step ? '#7C3AED' : 'var(--color-border)', transition: 'background-color 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {STEP_CONTENT[step]()}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={handleClose}
              style={{
                padding: '9px 16px', borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)', backgroundColor: 'transparent',
                color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {step > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
                    color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={15} /> Back
                </button>
              )}
              {dirty && step < STEPS.length - 1 && (
                <button
                  onClick={() => { /* save as draft */ }}
                  style={{
                    padding: '9px 16px', borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
                    color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)', fontWeight: 400, cursor: 'pointer',
                  }}
                >
                  Save Draft
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 20px', borderRadius: 'var(--radius)',
                    border: 'none', backgroundColor: '#7C3AED', color: 'white',
                    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                    fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 20px', borderRadius: 'var(--radius)',
                    border: 'none', backgroundColor: '#7C3AED', color: 'white',
                    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                    fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <Check size={15} /> {isEdit ? 'Save Changes' : 'Save Driver'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}