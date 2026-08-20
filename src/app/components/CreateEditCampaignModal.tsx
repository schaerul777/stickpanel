import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check, Plus, Minus } from 'lucide-react';
import type { Campaign } from './CampaignsTable';

interface CreateEditCampaignModalProps {
  open: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onSave: (data: Partial<Campaign>) => void;
}

const CHANNELS: Campaign['channel'][] = ['GTI', 'TPI', 'NON GRAB'];
const ALL_CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Yogyakarta', 'Makassar', 'Depok', 'Tangerang', 'Bekasi', 'Palembang', 'Denpasar'];
const ALL_VEHICLE_TYPES = ['Toyota Calya', 'Honda Brio', 'Daihatsu Ayla', 'Toyota Agya', 'Daihatsu Sigra', 'Mitsubishi Xpander', 'Suzuki Ertiga', 'Honda Mobilio'];

const STEPS = [
  { num: 1, label: 'Campaign Info' },
  { num: 2, label: 'Schedule & Budget' },
  { num: 3, label: 'Driver Requirements' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      display: 'block', marginBottom: '6px',
      fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
      fontWeight: 'var(--font-weight-medium)', color: 'var(--color-foreground)',
    }}>
      {children}
      {required && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-input-background)',
        fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
        color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
    />
  );
}

function NumberInput({ value, onChange, min = 0, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
          color: 'var(--color-foreground)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          flex: 1, padding: '9px 12px', textAlign: 'center',
          borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-input-background)',
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          color: 'var(--color-foreground)', outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      />
      <button
        type="button"
        onClick={() => onChange(value + step)}
        style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
          color: 'var(--color-foreground)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function MultiSelect({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    selected.includes(opt)
      ? onChange(selected.filter(s => s !== opt))
      : onChange([...selected, opt]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '5px 12px', borderRadius: 'var(--radius)',
              border: `1.5px solid ${active ? '#7C3AED' : 'var(--color-border)'}`,
              backgroundColor: active ? 'rgba(124,58,237,0.08)' : 'var(--color-card)',
              color: active ? '#7C3AED' : 'var(--color-foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              fontWeight: active ? 500 : 400, cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            {active && <Check size={11} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Form State ────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  client: string;
  contactPerson: string;
  channel: Campaign['channel'];
  description: string;
  startDate: string;
  endDate: string;
  cities: string[];
  pointsBudget: number;
  pointsPerTrip: number;
  minTrips: number;
  targetTrips: number;
  vehicleTypes: string[];
}

const defaultForm: FormData = {
  name: '', client: '', contactPerson: '',
  channel: 'GTI', description: '',
  startDate: '', endDate: '',
  cities: [], pointsBudget: 1000000,
  pointsPerTrip: 50, minTrips: 10, targetTrips: 100,
  vehicleTypes: [],
};

// ── Main Component ────────────────────────────────────────────────────────────

export function CreateEditCampaignModal({ open, campaign, onClose, onSave }: CreateEditCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);

  const isEdit = campaign !== null;

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setStep(1);
      if (campaign) {
        setForm({
          name: campaign.name,
          client: campaign.client,
          contactPerson: campaign.contactPerson ?? '',
          channel: campaign.channel,
          description: campaign.description ?? '',
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          cities: [...campaign.cities],
          pointsBudget: campaign.pointsBudget,
          pointsPerTrip: campaign.pointsPerTrip,
          minTrips: campaign.minTrips,
          targetTrips: campaign.targetTrips,
          vehicleTypes: campaign.vehicleTypes ? [...campaign.vehicleTypes] : [],
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [open, campaign]);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) => setForm(f => ({ ...f, [key]: val }));

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.client.trim();
    if (step === 2) return form.startDate && form.endDate && form.cities.length > 0 && form.pointsBudget > 0;
    return form.pointsPerTrip > 0 && form.minTrips > 0 && form.targetTrips >= form.minTrips;
  };

  const handleSave = () => {
    onSave({
      name: form.name, client: form.client,
      contactPerson: form.contactPerson || undefined,
      channel: form.channel, description: form.description || undefined,
      startDate: form.startDate, endDate: form.endDate,
      cities: form.cities, pointsBudget: form.pointsBudget,
      pointsPerTrip: form.pointsPerTrip, minTrips: form.minTrips,
      targetTrips: form.targetTrips,
      vehicleTypes: form.vehicleTypes.length > 0 ? form.vehicleTypes : undefined,
    });
    onClose();
  };

  if (!open) return null;

  const modal = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '560px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)',
            }}>
              {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <p style={{
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              color: 'var(--color-muted-foreground)', fontWeight: 'var(--font-weight-normal)', marginTop: '2px',
            }}>
              Step {step} of {STEPS.length} — {STEPS[step - 1].label}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
              color: 'var(--color-muted-foreground)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progress */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', gap: '8px', flexShrink: 0,
        }}>
          {STEPS.map((s, i) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: done ? '#7C3AED' : active ? '#7C3AED' : 'var(--color-secondary)',
                    border: `2px solid ${done || active ? '#7C3AED' : 'var(--color-border)'}`,
                    color: done || active ? 'white' : 'var(--color-muted-foreground)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 700,
                    transition: 'all 0.2s',
                  }}>
                    {done ? <Check size={12} /> : s.num}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#7C3AED' : done ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                    transition: 'color 0.2s',
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ height: '1px', flex: 1, backgroundColor: done ? '#7C3AED' : 'var(--color-border)', transition: 'background-color 0.3s', marginRight: '8px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Form Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Step 1: Campaign Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <FieldLabel required>Campaign Name</FieldLabel>
                <TextInput value={form.name} onChange={v => set('name', v)} placeholder="e.g. Gojek Ramadan Q2 2025" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel required>Client / Advertiser</FieldLabel>
                  <TextInput value={form.client} onChange={v => set('client', v)} placeholder="e.g. Gojek Indonesia" />
                </div>
                <div>
                  <FieldLabel>Contact Person</FieldLabel>
                  <TextInput value={form.contactPerson} onChange={v => set('contactPerson', v)} placeholder="e.g. Andi Wijaya" />
                </div>
              </div>

              <div>
                <FieldLabel required>Channel</FieldLabel>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {CHANNELS.map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => set('channel', ch)}
                      style={{
                        flex: 1, padding: '10px',
                        borderRadius: 'var(--radius)',
                        border: `1.5px solid ${form.channel === ch ? '#7C3AED' : 'var(--color-border)'}`,
                        backgroundColor: form.channel === ch ? 'rgba(124,58,237,0.08)' : 'var(--color-card)',
                        color: form.channel === ch ? '#7C3AED' : 'var(--color-foreground)',
                        fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                        fontWeight: form.channel === ch ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the campaign objectives, rules, and any special incentives..."
                  rows={4}
                  style={{
                    width: '100%', padding: '9px 12px',
                    borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-input-background)',
                    fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                    color: 'var(--color-foreground)', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', lineHeight: 1.5, transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Budget */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel required>Start Date</FieldLabel>
                  <TextInput value={form.startDate} onChange={v => set('startDate', v)} type="date" />
                </div>
                <div>
                  <FieldLabel required>End Date</FieldLabel>
                  <TextInput value={form.endDate} onChange={v => set('endDate', v)} type="date" />
                </div>
              </div>

              <div>
                <FieldLabel required>Operating Cities ({form.cities.length} selected)</FieldLabel>
                <MultiSelect options={ALL_CITIES} selected={form.cities} onChange={v => set('cities', v)} />
              </div>

              <div>
                <FieldLabel required>Total Points Budget</FieldLabel>
                <TextInput
                  value={String(form.pointsBudget)}
                  onChange={v => set('pointsBudget', Number(v) || 0)}
                  type="number"
                  placeholder="e.g. 5000000"
                />
                <p style={{
                  marginTop: '5px', fontFamily: 'var(--font-family-geist)',
                  fontSize: '12px', color: 'var(--color-muted-foreground)',
                }}>
                  {form.pointsBudget.toLocaleString()} points total
                  {form.pointsPerTrip > 0 && ` · ≈ ${Math.floor(form.pointsBudget / form.pointsPerTrip).toLocaleString()} max trips`}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Driver Requirements */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <FieldLabel required>Points Per Trip</FieldLabel>
                <NumberInput value={form.pointsPerTrip} onChange={v => set('pointsPerTrip', v)} min={1} step={5} />
                <p style={{ marginTop: '5px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                  Each completed trip earns the driver {form.pointsPerTrip} points
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FieldLabel required>Minimum Trips</FieldLabel>
                  <NumberInput value={form.minTrips} onChange={v => set('minTrips', v)} min={1} />
                  <p style={{ marginTop: '5px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                    Minimum to qualify
                  </p>
                </div>
                <div>
                  <FieldLabel required>Target Trips</FieldLabel>
                  <NumberInput value={form.targetTrips} onChange={v => set('targetTrips', v)} min={form.minTrips} />
                  <p style={{ marginTop: '5px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                    Full bonus at target
                  </p>
                </div>
              </div>

              {/* Budget Summary */}
              <div style={{
                padding: '14px 16px', borderRadius: 'var(--radius)',
                backgroundColor: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}>
                <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: '#7C3AED', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Budget Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { label: 'Points per trip', value: `${form.pointsPerTrip} pts` },
                    { label: 'Max trips from budget', value: `${Math.floor(form.pointsBudget / (form.pointsPerTrip || 1)).toLocaleString()} trips` },
                    { label: 'Potential drivers', value: form.targetTrips > 0 ? `≈ ${Math.floor(form.pointsBudget / (form.pointsPerTrip * form.targetTrips)).toLocaleString()} drivers` : '—' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, color: 'var(--color-foreground)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Allowed Vehicle Types (optional)</FieldLabel>
                <MultiSelect options={ALL_VEHICLE_TYPES} selected={form.vehicleTypes} onChange={v => set('vehicleTypes', v)} />
                <p style={{ marginTop: '6px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                  Leave empty to allow all vehicle types
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
              color: 'var(--color-foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
          >
            {step > 1 && <ChevronLeft size={15} />}
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Step dots */}
            {STEPS.map(s => (
              <div key={s.num} style={{
                width: step === s.num ? '20px' : '6px', height: '6px',
                borderRadius: '3px',
                backgroundColor: step >= s.num ? '#7C3AED' : 'var(--color-border)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => { if (canNext()) setStep(s => s + 1); }}
              disabled={!canNext()}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 20px', borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: canNext() ? '#7C3AED' : 'var(--color-secondary)',
                color: canNext() ? 'white' : 'var(--color-muted-foreground)',
                fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)', cursor: canNext() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (canNext()) e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { if (canNext()) e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => { if (canNext()) handleSave(); }}
              disabled={!canNext()}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 20px', borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: canNext() ? '#7C3AED' : 'var(--color-secondary)',
                color: canNext() ? 'white' : 'var(--color-muted-foreground)',
                fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)', cursor: canNext() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (canNext()) e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { if (canNext()) e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              <Check size={15} />
              {isEdit ? 'Save Changes' : 'Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
