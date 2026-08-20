import { useState, useEffect, useCallback } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Copy, Check, Eye, EyeOff, ExternalLink, MessageSquare,
  Download, Ban, UserCheck, Star, StarOff, Edit, ZoomIn,
  Phone, Mail, MapPin, Calendar, BookOpen, Car, CreditCard,
  Trophy, Activity, Shield, Clock, TriangleAlert, User,
  FileText, ChartBar, ChevronRight, RotateCw, Users,
  Palette, Hash, Tag, Image as ImageIcon,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import type { Driver, VehicleRecord } from './DriversTable';
import { DriverPerformanceTab } from './DriverPerformanceTab';

// ── Helpers ──────────────────────────────────────────────────────────────────

function seededVal(seed: number, index: number, min: number, max: number): number {
  const x = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453123;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min + 1));
}

const AVATAR_COLORS = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626','#DB2777','#7C3AED'];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function calcAge(iso: string) {
  const b = new Date(iso);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

const CAMPAIGN_NAMES = [
  'Gojek Ramadan Q1','Tokopedia Summer','Shopee 9.9 Campaign','Grab Eid Campaign',
  'GoPay Loyalty Q1','Lazada 12.12 Mega','OVO Cashback Run','Dana Promo Nov',
  'Blibli Harbolnas','Bukalapak Deals','ShopeePay Festival','Grab Year End',
  'Tokopedia Flash Sale','Shopee Year-End','GoFood Special',
];
const BANKS = ['BCA','Mandiri','BRI','BNI','CIMB','Danamon','Permata'];

// ── Sub-components ────────────────────────────────────────────────────────────

function CircularProgress({ value, size = 56 }: { value: number; size?: number }) {
  const strokeW = 5;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value < 50 ? '#EF4444' : value <= 80 ? '#F59E0B' : '#22C55E';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--color-border)" strokeWidth={strokeW} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={strokeW} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, color }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function CopyButton({ text, field }: { text: string; field: string }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={doCopy}
      title="Copy"
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        color: copied ? '#22C55E' : 'var(--color-muted-foreground)',
        display: 'inline-flex', alignItems: 'center', transition: 'color 0.15s',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <Icon size={14} style={{ color: 'var(--color-muted-foreground)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-foreground)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', marginTop: '4px' }}>
      {children}
    </h4>
  );
}

// Mock document card (styled as ID card)
function DocumentCard({
  type, driver, onClick,
}: { type: 'id' | 'license'; driver: Driver; onClick: () => void }) {
  const isId = type === 'id';
  return (
    <div
      onClick={onClick}
      style={{
        width: '100%', paddingTop: '63%', position: 'relative',
        borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'zoom-in',
        background: isId
          ? 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)'
          : 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #10b981 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, padding: '14px 16px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '7px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8, textTransform: 'uppercase' }}>
              {isId ? 'Kartu Tanda Penduduk' : 'Surat Izin Mengemudi'}
            </div>
            <div style={{ fontSize: '7px', fontFamily: 'var(--font-family-geist)', fontWeight: 500, opacity: 0.7, marginTop: '1px' }}>
              REPUBLIK INDONESIA
            </div>
          </div>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isId ? <User size={12} color="white" /> : <Car size={12} color="white" />}
          </div>
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: '28px', height: '36px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '8px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, marginBottom: '3px' }}>{driver.name}</div>
            <div style={{ fontSize: '7px', fontFamily: 'monospace', opacity: 0.9 }}>
              {isId ? driver.nationalId : driver.driverLicense}
            </div>
            <div style={{ fontSize: '7px', fontFamily: 'var(--font-family-geist)', opacity: 0.7, marginTop: '3px' }}>
              {driver.domicile}, {driver.city}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '6px', opacity: 0.6, fontFamily: 'monospace' }}>
          {isId ? 'VALID' : 'EXP: 12/2027'}
        </div>
      </div>
      {/* Zoom hint */}
      <div style={{
        position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.2s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0)'; }}
      >
        <ZoomIn size={20} color="white" style={{ opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as SVGElement).style.opacity = '1'; }}
        />
      </div>
    </div>
  );
}

// Document lightbox
function DocumentLightbox({ type, driver, onClose }: { type: 'id' | 'license'; driver: Driver; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const isId = type === 'id';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[
            { label: '−', action: () => setZoom(z => Math.max(0.5, z - 0.25)) },
            { label: '+', action: () => setZoom(z => Math.min(3, z + 0.25)) },
            { label: <RotateCw size={14} />, action: () => setRotation(r => r + 90) },
            { label: 'Reset', action: () => { setZoom(1); setRotation(0); } },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              padding: '6px 12px', borderRadius: 'var(--radius)',
              border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              {btn.label}
            </button>
          ))}
          <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: '13px', cursor: 'pointer' }}>
            Close
          </button>
        </div>
        {/* Document */}
        <div style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.25s', transformOrigin: 'center' }}>
          <div style={{
            width: '480px', height: '300px',
            background: isId
              ? 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #10b981 100%)',
            borderRadius: '12px', padding: '28px 32px', color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, letterSpacing: '0.12em', opacity: 0.85, textTransform: 'uppercase' }}>
                  {isId ? 'Kartu Tanda Penduduk' : 'Surat Izin Mengemudi'}
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-family-geist)', fontWeight: 400, opacity: 0.7, marginTop: '2px' }}>
                  REPUBLIK INDONESIA
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isId ? <User size={24} color="white" /> : <Car size={24} color="white" />}
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '70px', height: '90px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} color="rgba(255,255,255,0.5)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-family-geist)', fontWeight: 700, marginBottom: '8px' }}>{driver.name}</div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', opacity: 0.9, marginBottom: '4px' }}>
                  {isId ? driver.nationalId : driver.driverLicense}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-geist)', opacity: 0.75, marginBottom: '3px' }}>
                  {driver.domicile}, {driver.city}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-family-geist)', opacity: 0.7 }}>
                  {formatDate(driver.birthDate)}
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '16px', right: '20px', fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>
              {isId ? 'BERLAKU SEUMUR HIDUP' : 'MASA BERLAKU: 12/2027'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-family-geist)' }}>
          Zoom: {Math.round(zoom * 100)}% · Click outside to close
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface DriverDetailDrawerProps {
  driver: Driver | null;
  open: boolean;
  onClose: () => void;
  onEdit: (d: Driver) => void;
  onVerifyDocument: (d: Driver, type: 'id' | 'license') => void;
  onAction: (action: string, driverId: string) => void;
}

// ── Main Drawer ────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Personal',  Icon: User       },
  { label: 'Identity',  Icon: FileText   },
  { label: 'Vehicle',   Icon: Car        },
  { label: 'Banking',   Icon: CreditCard },
  { label: 'Activity',  Icon: ChartBar   },
  { label: 'Status',    Icon: Shield     },
  { label: 'Performance', Icon: Trophy },
];

export function DriverDetailDrawer({ driver, open, onClose, onEdit, onVerifyDocument, onAction }: DriverDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [masked, setMasked]       = useState(true);
  const [lightbox, setLightbox]   = useState<'id' | 'license' | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Reset tab on driver change
  useEffect(() => { setActiveTab(0); setMasked(true); }, [driver?.id]);

  if (!driver) return null;

  // Computed mock data
  const seed = parseInt(driver.id.replace('DRV-', ''));
  const campaignsJoined = seededVal(seed, 99, 5, 48);
  const bankName = BANKS[seededVal(seed, 88, 0, BANKS.length - 1)];
  const monthlyPoints = [
    { month: 'Sep', points: seededVal(seed, 0, 300, 3000) },
    { month: 'Oct', points: seededVal(seed, 1, 300, 3000) },
    { month: 'Nov', points: seededVal(seed, 2, 300, 3000) },
    { month: 'Dec', points: seededVal(seed, 3, 300, 3000) },
    { month: 'Jan', points: seededVal(seed, 4, 300, 3000) },
    { month: 'Feb', points: seededVal(seed, 5, 300, 3000) },
  ];
  const campaigns = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: CAMPAIGN_NAMES[seededVal(seed, i, 0, CAMPAIGN_NAMES.length - 1)],
    points: seededVal(seed, i + 10, 150, 2200),
    date: new Date(2024, seededVal(seed, i + 20, 0, 11), seededVal(seed, i + 30, 1, 28))
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: (['Completed', 'Completed', 'Completed', 'Ended', 'Active'] as const)[seededVal(seed, i + 40, 0, 4)],
  }));
  const redemptions = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    item: seededVal(seed, i + 50, 0, 1) === 0 ? '🏦 Cash Transfer' : '📱 Mobile Credit',
    points: seededVal(seed, i + 60, 500, 5000),
    date: new Date(2024, seededVal(seed, i + 70, 0, 11), seededVal(seed, i + 80, 1, 28))
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: (['Paid', 'Paid', 'With Finance', 'Pending'] as const)[seededVal(seed, i + 90, 0, 3)],
  }));
  const registrationDate = new Date(2022, seededVal(seed, 200, 0, 11), seededVal(seed, 201, 1, 28))
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const lastLogin = new Date(2025, 1, seededVal(seed, 202, 1, 19))
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalSessions = seededVal(seed, 203, 50, 1200);
  const idVerified: 'verified' | 'pending' | 'rejected' =
    driver.profileCompletion > 70 ? 'verified' : driver.profileCompletion > 50 ? 'pending' : 'rejected';
  const licVerified: 'verified' | 'pending' | 'rejected' =
    driver.profileCompletion > 65 ? 'verified' : driver.profileCompletion > 45 ? 'pending' : 'rejected';

  const avatarColor = getAvatarColor(driver.name);
  const initials    = getInitials(driver.name);

  // ── Render tabs ────────────────────────────────────────────────────────────

  const renderPersonal = () => (
    <div style={{ padding: '20px 24px' }}>
      <InfoRow icon={User} label="Full Name">{driver.name}</InfoRow>
      <InfoRow icon={Mail} label="Email">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>{driver.email}</span>
          {driver.whatsappVerified && (
            <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34,197,94,0.1)', color: '#16A34A', fontWeight: 500 }}>
              ✓ Verified
            </span>
          )}
        </div>
      </InfoRow>
      <InfoRow icon={Phone} label="Mobile Number">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)' }}>{driver.mobile}</span>
          {driver.whatsappVerified && (
            <a href={`https://wa.me/${driver.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', padding: '1px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34,197,94,0.1)', color: '#16A34A', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <ExternalLink size={10} /> WhatsApp
            </a>
          )}
        </div>
      </InfoRow>
      <InfoRow icon={Calendar} label="Birth Date">
        {formatDate(driver.birthDate)} · Age {calcAge(driver.birthDate)}
      </InfoRow>
      <InfoRow icon={BookOpen} label="Religion">
        {driver.religion || '—'}
      </InfoRow>
      <InfoRow icon={MapPin} label="City">
        {driver.city}
      </InfoRow>
      <InfoRow icon={MapPin} label="Domicile">
        {driver.domicile}
      </InfoRow>
      <InfoRow icon={Users} label="Community">
        {driver.community || '—'}
      </InfoRow>
      <InfoRow icon={Activity} label="Driver Type">
        <span style={{
          padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
          backgroundColor: driver.driverType === 'Normal' ? 'rgba(59,130,246,0.1)' : driver.driverType === 'Replacement' ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.1)',
          color: driver.driverType === 'Normal' ? '#2563EB' : driver.driverType === 'Replacement' ? '#D97706' : '#7C3AED',
        }}>
          {driver.driverType}
        </span>
      </InfoRow>
    </div>
  );

  const VerificationBadge = ({ status }: { status: 'verified' | 'pending' | 'rejected' }) => {
    const cfg = {
      verified: { bg: 'rgba(34,197,94,0.1)', color: '#16A34A', label: '✓ Verified' },
      pending:  { bg: 'rgba(245,158,11,0.1)', color: '#D97706', label: '⏳ Pending' },
      rejected: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626', label: '✕ Rejected' },
    };
    const c = cfg[status];
    return (
      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, backgroundColor: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  const renderIdentity = () => (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* National ID */}
      <div>
        <SectionTitle>National ID (KTP)</SectionTitle>
        <DocumentCard type="id" driver={driver} onClick={() => setLightbox('id')} />
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>ID Number</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-14)', color: 'var(--color-foreground)', letterSpacing: '0.05em' }}>
                {driver.nationalId}
              </span>
              <CopyButton text={driver.nationalId} field="nationalId" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Status</span>
            <VerificationBadge status={idVerified} />
          </div>
          <button
            onClick={() => onVerifyDocument(driver, 'id')}
            style={{
              marginTop: '4px', padding: '7px 14px', borderRadius: 'var(--radius)',
              border: `1px solid ${idVerified === 'rejected' ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
              backgroundColor: 'transparent',
              color: idVerified === 'rejected' ? '#DC2626' : 'var(--color-foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center',
            }}
          >
            {idVerified === 'verified' ? <><Check size={13} /> Review Document</> : idVerified === 'rejected' ? <><RotateCw size={13} /> Request Re-upload</> : <><Eye size={13} /> Verify Document</>}
          </button>
        </div>
      </div>

      {/* Driver License */}
      <div>
        <SectionTitle>Driver License (SIM)</SectionTitle>
        <DocumentCard type="license" driver={driver} onClick={() => setLightbox('license')} />
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>License Number</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>
                {driver.driverLicense}
              </span>
              <CopyButton text={driver.driverLicense} field="license" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Expiry</span>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>31 Dec 2027</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>Status</span>
            <VerificationBadge status={licVerified} />
          </div>
          <button
            onClick={() => onVerifyDocument(driver, 'license')}
            style={{
              marginTop: '4px', padding: '7px 14px', borderRadius: 'var(--radius)',
              border: `1px solid ${licVerified === 'rejected' ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
              backgroundColor: 'transparent',
              color: licVerified === 'rejected' ? '#DC2626' : 'var(--color-foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center',
            }}
          >
            {licVerified === 'verified' ? <><Check size={13} /> Review Document</> : licVerified === 'rejected' ? <><RotateCw size={13} /> Request Re-upload</> : <><Eye size={13} /> Verify Document</>}
          </button>
        </div>
      </div>
    </div>
  );

  const renderVehicle = () => {
    const VEHICLE_COLOR_HEX: Record<string, string> = {
      'White': '#F5F5F4', 'Silver': '#A8A29E', 'Gray': '#6B7280', 'Black': '#1C1917',
      'Red': '#DC2626', 'Maroon': '#881337', 'Blue': '#2563EB', 'Dark Blue': '#1E3A8A',
      'Green': '#16A34A', 'Yellow': '#EAB308', 'Orange': '#EA580C',
      'Brown': '#92400E', 'Gold': '#D97706', 'Beige': '#D4B896',
    };

    // Build vehicles list: prefer vehicles array, fall back to flat fields
    const vehicleList: VehicleRecord[] = (driver.vehicles && driver.vehicles.length > 0)
      ? driver.vehicles
      : [{
          id: 'main',
          vehicleType: driver.vehicleType,
          plateNumber: driver.plateNumber,
          vehicleOwner: driver.vehicleOwner,
          vehicleColor: driver.vehicleColor,
          manufacturedYear: driver.manufacturedYear,
          odometerSticker: driver.odometerSticker,
          licenseNumberType: driver.licenseNumberType,
          stnkImage: driver.stnkImage,
          isActive: true,
        }];

    const VehicleCard = ({ v }: { v: VehicleRecord }) => {
      const colorHex = v.vehicleColor ? (VEHICLE_COLOR_HEX[v.vehicleColor] ?? '#888') : null;
      const isLightColor = ['White', 'Silver', 'Beige', 'Yellow'].includes(v.vehicleColor ?? '');
      const plateIsBlack = v.licenseNumberType !== 'Yellow';

      return (
        <div style={{
          borderRadius: 'var(--radius)', border: `1px solid ${v.isActive ? 'rgba(34,197,94,0.35)' : 'var(--color-border)'}`,
          backgroundColor: 'var(--color-card)', overflow: 'hidden',
        }}>
          {/* Card header: vehicle name + status badge */}
          <div style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: v.isActive ? 'rgba(34,197,94,0.04)' : 'var(--color-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius)', flexShrink: 0,
                backgroundColor: v.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Car size={18} style={{ color: v.isActive ? '#16A34A' : 'var(--color-muted-foreground)' }} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600,
                  color: 'var(--color-foreground)',
                }}>
                  {v.vehicleType}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  {/* Mini plate */}
                  <span style={{
                    padding: '1px 8px', borderRadius: '3px',
                    fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                    backgroundColor: plateIsBlack ? '#1C1917' : '#EAB308',
                    color: plateIsBlack ? '#FFF' : '#1C1917',
                    border: `1px solid ${plateIsBlack ? '#444' : '#CA8A04'}`,
                  }}>
                    {v.plateNumber.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            {/* Active / Inactive badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600,
              backgroundColor: v.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.1)',
              color: v.isActive ? '#16A34A' : 'var(--color-muted-foreground)',
              border: `1px solid ${v.isActive ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
              flexShrink: 0,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', flexShrink: 0 }} />
              {v.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* STNK Image Section */}
          <div style={{
            margin: '14px 16px',
            borderRadius: 'var(--radius)',
            border: `1px solid ${v.stnkImage ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.2)'}`,
            backgroundColor: v.stnkImage ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
            overflow: 'hidden',
          }}>
            {v.stnkImage ? (
              /* STNK uploaded — show document preview */
              <div>
                {/* Document header bar */}
                <div style={{
                  padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(34,197,94,0.15)',
                  backgroundColor: 'rgba(34,197,94,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <ImageIcon size={14} style={{ color: '#16A34A' }} />
                    <span style={{
                      fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: '#16A34A',
                    }}>
                      STNK — Surat Tanda Nomor Kendaraan
                    </span>
                  </div>
                  <span style={{
                    padding: '1px 7px', borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-family-geist)', fontSize: '10px', fontWeight: 600,
                    backgroundColor: 'rgba(34,197,94,0.15)', color: '#059669',
                  }}>
                    ✓ Verified
                  </span>
                </div>
                {/* Document body */}
                <div style={{ padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Document icon placeholder */}
                  <div style={{
                    width: '54px', height: '70px', borderRadius: '4px', flexShrink: 0,
                    backgroundColor: 'rgba(34,197,94,0.08)',
                    border: '1px dashed rgba(34,197,94,0.3)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    <ImageIcon size={20} style={{ color: '#16A34A', opacity: 0.6 }} />
                    <span style={{
                      fontFamily: 'var(--font-family-geist)', fontSize: '8px', color: '#16A34A',
                      opacity: 0.7, textAlign: 'center', lineHeight: 1.2,
                    }}>
                      STNK
                    </span>
                  </div>
                  {/* STNK details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[
                        { label: 'Plate No.', value: v.plateNumber.toUpperCase() },
                        { label: 'Vehicle', value: v.vehicleType },
                        { label: 'Owner', value: v.vehicleOwner || driver.name },
                        { label: 'Year', value: v.manufacturedYear ? String(v.manufacturedYear) : '—' },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '10px', color: 'var(--color-muted-foreground)', marginBottom: '1px' }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontFamily: item.label === 'Plate No.' ? 'monospace' : 'var(--font-family-geist)',
                            fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)',
                          }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STNK not uploaded */
              <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius)', flexShrink: 0,
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  border: '1px dashed rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ImageIcon size={16} style={{ color: '#DC2626', opacity: 0.7 }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 500, color: '#DC2626' }}>
                    STNK Not Uploaded
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '1px' }}>
                    Vehicle registration document is missing. Please request driver to upload.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle details rows */}
          <div style={{ padding: '0 16px 14px' }}>
            {/* Row helper */}
            {[
              v.vehicleOwner && { icon: Mail,    label: 'Owner',             val: v.vehicleOwner },
              v.vehicleColor && { icon: Palette,  label: 'Color',             val: v.vehicleColor, colorDot: colorHex, isLight: isLightColor },
              v.manufacturedYear && { icon: Calendar, label: 'Year',           val: String(v.manufacturedYear) },
              v.licenseNumberType && { icon: Tag,    label: 'Plate Type',       val: `${v.licenseNumberType} Plate` },
              v.odometerSticker && { icon: Hash,   label: 'Odometer Sticker', val: v.odometerSticker, isMono: true, isSticker: true },
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <row.icon size={13} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                    {row.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {row.colorDot && (
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      backgroundColor: row.colorDot, flexShrink: 0,
                      border: row.isLight ? '1px solid var(--color-border)' : '1px solid transparent',
                    }} />
                  )}
                  <span style={{
                    fontFamily: row.isMono ? 'monospace' : 'var(--font-family-geist)',
                    fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)',
                    letterSpacing: row.isMono ? '0.06em' : undefined,
                  }}>
                    {row.val}
                  </span>
                  {row.isSticker && (
                    <span style={{
                      padding: '1px 5px', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-family-geist)', fontSize: '9px', fontWeight: 600,
                      backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)',
                    }}>
                      Anti-fraud
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header: count + active indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600,
            color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {vehicleList.length} Vehicle{vehicleList.length !== 1 ? 's' : ''} Registered
          </div>
          <span style={{
            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600,
            backgroundColor: 'rgba(34,197,94,0.1)', color: '#16A34A',
            border: '1px solid rgba(34,197,94,0.25)',
          }}>
            {vehicleList.filter(v => v.isActive).length} Active
          </span>
        </div>
        {vehicleList.map(v => <VehicleCard key={v.id} v={v} />)}
      </div>
    );
  };

  const renderBanking = () => (
    <div style={{ padding: '20px 24px' }}>
      <InfoRow icon={CreditCard} label="Bank Name">
        <span style={{ fontFamily: 'var(--font-family-geist)', fontWeight: 500 }}>{bankName}</span>
      </InfoRow>
      <InfoRow icon={User} label="Account Name">
        {driver.bankAccountName}
      </InfoRow>
      <InfoRow icon={CreditCard} label="Account Number">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-14)', letterSpacing: '0.06em', color: 'var(--color-foreground)' }}>
            {masked
              ? '•••• •••• ' + driver.bankAccountNumber.slice(-4)
              : driver.bankAccountNumber.replace(/(\d{4})/g, '$1 ').trim()
            }
          </span>
          <button
            onClick={() => setMasked(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center' }}
          >
            {masked ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          {!masked && <CopyButton text={driver.bankAccountNumber} field="account" />}
        </div>
      </InfoRow>
      <InfoRow icon={User} label="Account Relation">
        <span style={{
          padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
          backgroundColor: driver.accountRelation === 'Self' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          color: driver.accountRelation === 'Self' ? '#16A34A' : '#D97706',
        }}>
          {driver.accountRelation}
        </span>
      </InfoRow>
      <InfoRow icon={Shield} label="Verification Status">
        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(34,197,94,0.1)', color: '#16A34A' }}>
          ✓ Verified
        </span>
      </InfoRow>
    </div>
  );

  const renderActivity = () => (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Points Chart */}
      <div>
        <SectionTitle>Points Earned — Last 6 Months</SectionTitle>
        <div style={{ height: '160px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyPoints} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${driver.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-geist)', fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: 'var(--font-family-geist)', fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ fontFamily: 'var(--font-family-geist)', fontSize: 12, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                labelStyle={{ color: 'var(--color-foreground)', fontWeight: 500 }}
              />
              <Area type="monotone" dataKey="points" stroke="#7C3AED" strokeWidth={2} fill={`url(#grad-${driver.id})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div>
        <SectionTitle>Recent Campaigns</SectionTitle>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                {['Campaign', 'Points', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)' }}>{c.name}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>{c.points.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{c.date}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      fontSize: '11px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 500,
                      backgroundColor: c.status === 'Completed' ? 'rgba(34,197,94,0.1)' : c.status === 'Active' ? 'rgba(59,130,246,0.1)' : 'rgba(115,115,115,0.1)',
                      color: c.status === 'Completed' ? '#16A34A' : c.status === 'Active' ? '#2563EB' : '#525252',
                      fontFamily: 'var(--font-family-geist)',
                    }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Redemptions */}
      <div>
        <SectionTitle>Recent Redemptions</SectionTitle>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                {['Item', 'Points', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-foreground)', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {redemptions.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)' }}>{r.item}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>{r.points.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{r.date}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      fontSize: '11px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 500,
                      backgroundColor: r.status === 'Paid' ? 'rgba(34,197,94,0.1)' : r.status === 'With Finance' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                      color: r.status === 'Paid' ? '#16A34A' : r.status === 'With Finance' ? '#2563EB' : '#D97706',
                      fontFamily: 'var(--font-family-geist)',
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last Active */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
        <Clock size={14} style={{ color: 'var(--color-muted-foreground)' }} />
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
          Last active: <span style={{ color: 'var(--color-foreground)', fontWeight: 500 }}>{lastLogin}</span>
        </span>
      </div>
    </div>
  );

  const TimelineDot = ({ color }: { color: string }) => (
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0, marginTop: '3px', zIndex: 1 }} />
  );

  const renderStatus = () => (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Registration Date', value: registrationDate },
          { label: 'Last Login', value: lastLogin },
          { label: 'Total Sessions', value: totalSessions.toLocaleString() },
          { label: 'Account Age', value: `${new Date().getFullYear() - 2022} yrs` },
        ].map(item => (
          <div key={item.label} style={{ padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', fontWeight: 500, color: 'var(--color-muted-foreground)', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Alert boxes */}
      {driver.status === 'suspended' && driver.suspendedReason && (
        <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', gap: '12px' }}>
          <TriangleAlert size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: '#D97706', marginBottom: '4px' }}>Account Suspended</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#D97706' }}>{driver.suspendedReason}</div>
          </div>
        </div>
      )}
      {driver.status === 'blacklisted' && driver.blacklistReason && (
        <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', gap: '12px' }}>
          <Ban size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', fontWeight: 600, color: '#DC2626', marginBottom: '4px' }}>Driver Blacklisted</div>
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: '#DC2626' }}>{driver.blacklistReason}</div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <SectionTitle>Status History</SectionTitle>
        <div>
          {(() => {
            const ADMINS = ['Andi K.', 'Sari M.', 'Rizky B.', 'Nanda F.', 'Bagas P.', 'Dita R.'];
            const fmtTime = (h: number, m: number) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} WIB`;
            const campAssignDate = (offset: number) => new Date(2024, seededVal(seed, 500+offset, 0, 10), seededVal(seed, 510+offset, 1, 28))
              .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const assignedBy = (offset: number) => ADMINS[seededVal(seed, 520+offset, 0, ADMINS.length - 1)];
            const camp1 = CAMPAIGN_NAMES[seededVal(seed, 530, 0, CAMPAIGN_NAMES.length - 1)];
            const camp2 = CAMPAIGN_NAMES[seededVal(seed, 531, 0, CAMPAIGN_NAMES.length - 1)];
            const camp3 = CAMPAIGN_NAMES[seededVal(seed, 532, 0, CAMPAIGN_NAMES.length - 1)];
            const t1h = seededVal(seed, 540, 8, 11); const t1m = seededVal(seed, 541, 0, 59);
            const t2h = seededVal(seed, 542, 13, 17); const t2m = seededVal(seed, 543, 0, 59);
            const t3h = seededVal(seed, 544, 9, 15); const t3m = seededVal(seed, 545, 0, 59);

            const events: { color: string; text: string; sub: string; time?: string; tag?: string; tagColor?: string }[] = [
              {
                color: '#22C55E',
                text: `Account registered — ${registrationDate}`,
                sub: 'Driver profile created and pending verification',
              },
              {
                color: '#22C55E',
                text: 'Identity documents verified',
                sub: `KTP & SIM reviewed and approved by ${ADMINS[seededVal(seed, 550, 0, ADMINS.length-1)]}`,
                tag: 'Verified', tagColor: '#059669',
              },
              {
                color: '#2563EB',
                text: `Assigned to campaign "${camp1}"`,
                sub: `${campAssignDate(0)} at ${fmtTime(t1h, t1m)} — by admin ${assignedBy(0)}`,
                tag: 'Campaign', tagColor: '#2563EB',
              },
              {
                color: '#6B7280',
                text: `Campaign "${camp1}" completed`,
                sub: `Successfully finished. Points awarded. Admin: ${assignedBy(1)}`,
                tag: 'Completed', tagColor: '#059669',
              },
              {
                color: '#2563EB',
                text: `Moved to campaign "${camp2}"`,
                sub: `${campAssignDate(1)} at ${fmtTime(t2h, t2m)} — by admin ${assignedBy(2)}`,
                tag: 'Campaign', tagColor: '#2563EB',
              },
              {
                color: '#6B7280',
                text: `Campaign "${camp2}" ended`,
                sub: `Campaign concluded. Reassignment pending. Admin: ${assignedBy(3)}`,
                tag: 'Ended', tagColor: '#D97706',
              },
              {
                color: '#2563EB',
                text: `Assigned to campaign "${camp3}"`,
                sub: `${campAssignDate(2)} at ${fmtTime(t3h, t3m)} — by admin ${assignedBy(4)}`,
                tag: 'Campaign', tagColor: '#2563EB',
              },
              ...(driver.isVIP ? [{
                color: '#F59E0B',
                text: 'VIP status granted',
                sub: `Promoted to VIP tier by admin ${ADMINS[seededVal(seed, 560, 0, ADMINS.length-1)]}`,
                tag: 'VIP', tagColor: '#D97706',
              }] : []),
              ...(driver.status === 'suspended' ? [{
                color: '#F59E0B',
                text: 'Account suspended',
                sub: driver.suspendedReason || '',
                tag: 'Suspended', tagColor: '#D97706',
              }] : []),
              ...(driver.status === 'blacklisted' ? [{
                color: '#EF4444',
                text: 'Driver blacklisted',
                sub: driver.blacklistReason || '',
                tag: 'Blacklisted', tagColor: '#DC2626',
              }] : []),
            ];

            return events.map((event, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px' }}>
                {/* Dot + connecting line — always centred on each other */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flexShrink: 0, width: '10px',
                }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: event.color, flexShrink: 0,
                    marginTop: '4px', zIndex: 1,
                  }} />
                  {i < events.length - 1 && (
                    <div style={{
                      flex: 1, width: '2px', minHeight: '16px',
                      marginTop: '4px',
                      backgroundColor: 'var(--color-border)',
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-13)', fontWeight: 600, color: 'var(--color-foreground)', flex: 1 }}>
                      {event.text}
                    </div>
                    {event.tag && (
                      <span style={{
                        padding: '1px 7px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                        fontFamily: 'var(--font-family-geist)', fontSize: '10px', fontWeight: 600,
                        backgroundColor: `${event.tagColor}18`, color: event.tagColor,
                        border: `1px solid ${event.tagColor}30`,
                      }}>
                        {event.tag}
                      </span>
                    )}
                  </div>
                  {event.sub && (
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '3px' }}>
                      {event.sub}
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );

  const TAB_CONTENT = [renderPersonal, renderIdentity, renderVehicle, renderBanking, renderActivity, renderStatus, () => <DriverPerformanceTab driver={driver} />];

  // ── Action buttons ─────────────────────────────────────────────────────────
  const btnStyle = (variant: 'outline' | 'danger' | 'success' | 'gold' | 'ghost'): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '9px 14px', borderRadius: 'var(--radius)',
      fontFamily: 'var(--font-family-geist)',
      fontSize: 'var(--text-14)',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.15s',
      whiteSpace: 'nowrap',
      border: 'none',
    };
    const variants: Record<string, React.CSSProperties> = {
      outline: { backgroundColor: 'var(--color-secondary)', color: 'var(--color-foreground)' },
      danger:  { backgroundColor: 'rgba(239,68,68,0.08)',   color: '#DC2626' },
      success: { backgroundColor: 'rgba(34,197,94,0.1)',    color: '#16A34A' },
      gold:    { backgroundColor: 'rgba(245,158,11,0.1)',   color: '#D97706' },
      ghost:   { backgroundColor: 'var(--color-secondary)', color: 'var(--color-muted-foreground)' },
    };
    return { ...base, ...variants[variant] };
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9998 }}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { type: 'tween', duration: 0.26, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.85 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: '600px', zIndex: 9999,
              backgroundColor: 'var(--color-card)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                width: '30px', height: '30px', borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-muted-foreground)',
              }}
            >
              <X size={15} />
            </button>

            {/* ── Header ── */}
            <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingRight: '40px' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    backgroundColor: avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-family-geist)', fontSize: '20px', fontWeight: 700,
                    color: 'white', letterSpacing: '0.02em',
                  }}>
                    {initials}
                  </div>
                  {driver.isVIP && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-card)' }}>
                      <Star size={10} color="white" fill="white" />
                    </div>
                  )}
                </div>

                {/* Name + ID + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h2 style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>
                      {driver.name}
                    </h2>
                    {driver.isVIP && (
                      <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245,158,11,0.12)', color: '#D97706', fontFamily: 'var(--font-family-geist)', fontWeight: 600, border: '1px solid rgba(245,158,11,0.25)' }}>
                        ⭐ VIP
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-muted-foreground)', marginBottom: '8px' }}>
                    {driver.id}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Status */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
                      backgroundColor: { active: 'rgba(34,197,94,0.1)', inactive: 'rgba(115,115,115,0.1)', suspended: 'rgba(245,158,11,0.1)', blacklisted: 'rgba(239,68,68,0.1)' }[driver.status],
                      color: { active: '#16A34A', inactive: '#525252', suspended: '#D97706', blacklisted: '#DC2626' }[driver.status],
                      fontFamily: 'var(--font-family-geist)',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                      {{ active: 'Active', inactive: 'Inactive', suspended: 'Suspended', blacklisted: 'Blacklisted' }[driver.status]}
                    </span>
                    {/* Channel */}
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                      backgroundColor: { GTI: 'rgba(59,130,246,0.1)', TPI: 'rgba(124,58,237,0.1)', 'NON GRAB': 'rgba(115,115,115,0.1)' }[driver.channel],
                      color: { GTI: '#2563EB', TPI: '#7C3AED', 'NON GRAB': '#525252' }[driver.channel],
                      fontFamily: 'var(--font-family-geist)', border: `1px solid ${{ GTI: 'rgba(59,130,246,0.2)', TPI: 'rgba(124,58,237,0.2)', 'NON GRAB': 'rgba(115,115,115,0.2)' }[driver.channel]}`,
                    }}>
                      {driver.channel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', margin: '16px 0 0' }}>
                {[
                  {
                    label: 'Total Points',
                    value: driver.totalPoints.toLocaleString(),
                    sub: 'pts earned',
                  },
                  {
                    label: 'Campaigns',
                    value: campaignsJoined.toString(),
                    sub: 'joined',
                  },
                  {
                    label: 'Profile',
                    value: `${driver.profileCompletion}%`,
                    sub: 'completion',
                  },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '12px', borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)',
                    display: 'flex', flexDirection: 'column', gap: '2px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Tab navigation */}
              <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-border)', marginTop: '16px', overflow: 'hidden' }}>
                {TABS.map(({ label }, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '10px 12px',
                      border: 'none', borderBottom: activeTab === i ? '2px solid #7C3AED' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      color: activeTab === i ? '#7C3AED' : 'var(--color-muted-foreground)',
                      fontFamily: 'var(--font-family-geist)', fontSize: '12px',
                      fontWeight: activeTab === i ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                      marginBottom: '-1px',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable tab content */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {TAB_CONTENT[activeTab]()}
            </div>

            {/* ── Action Footer ── */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', gap: '8px',
              flexShrink: 0,
              backgroundColor: 'var(--color-card)',
            }}>
              {/* Primary row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={() => onEdit(driver)} style={{ ...btnStyle('outline'), width: '100%' }}>
                  <Edit size={15} /> Edit Profile
                </button>
                <button onClick={() => onAction('message', driver.id)} style={{ ...btnStyle('outline'), width: '100%' }}>
                  <MessageSquare size={15} /> Send Message
                </button>
              </div>

              {/* Status action row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {driver.status === 'active' ? (
                  <button onClick={() => onAction('suspend', driver.id)} style={{ ...btnStyle('danger'), width: '100%' }}>
                    <Ban size={15} /> Suspend
                  </button>
                ) : driver.status === 'suspended' ? (
                  <button onClick={() => onAction('activate', driver.id)} style={{ ...btnStyle('success'), width: '100%' }}>
                    <UserCheck size={15} /> Activate
                  </button>
                ) : (
                  <div /> /* empty cell for alignment */
                )}
                {driver.status !== 'blacklisted' ? (
                  <button onClick={() => onAction('blacklist', driver.id)} style={{ ...btnStyle('danger'), width: '100%' }}>
                    <Ban size={15} /> Blacklist
                  </button>
                ) : (
                  <button onClick={() => onAction('unblacklist', driver.id)} style={{ ...btnStyle('success'), width: '100%' }}>
                    <UserCheck size={15} /> Remove Blacklist
                  </button>
                )}
              </div>

              {/* VIP + Export row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {driver.isVIP ? (
                  <button onClick={() => onAction('unvip', driver.id)} style={{ ...btnStyle('ghost'), width: '100%' }}>
                    <StarOff size={15} /> Remove VIP
                  </button>
                ) : (
                  <button onClick={() => onAction('vip', driver.id)} style={{ ...btnStyle('gold'), width: '100%' }}>
                    <Star size={15} /> Mark VIP
                  </button>
                )}
                <button onClick={() => onAction('export', driver.id)} style={{ ...btnStyle('outline'), width: '100%' }}>
                  <Download size={15} /> Export
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}