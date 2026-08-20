import { useState } from 'react';
import { Plus, Download, LayoutGrid, Users, Coins, Zap } from 'lucide-react';
import { CampaignsTable, type Campaign } from '../components/CampaignsTable';
import { CampaignDetailDrawer } from '../components/CampaignDetailDrawer';
import { CreateEditCampaignModal } from '../components/CreateEditCampaignModal';
import { useToast, ToastContainer } from '../components/Toast';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockCampaigns: Campaign[] = [
  {
    id: 'CMP-2501',
    name: 'Gojek Ramadan Q1',
    client: 'Gojek Indonesia',
    contactPerson: 'Andi Wijaya',
    channel: 'GTI',
    cities: ['Jakarta', 'Depok', 'Bekasi'],
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    status: 'active',
    driversEnrolled: 847,
    pointsBudget: 5000000,
    pointsUsed: 2340000,
    pointsPerTrip: 50,
    minTrips: 10,
    targetTrips: 100,
    totalTripsCompleted: 46800,
    description: 'Ramadan special campaign with bonus points for completing trip milestones during Ramadan period. Drivers earn additional points on peak hours.',
    createdAt: '2025-02-15',
    vehicleTypes: ['Toyota Calya', 'Honda Brio', 'Daihatsu Ayla'],
  },
  {
    id: 'CMP-2502',
    name: 'Tokopedia Summer Sale',
    client: 'Tokopedia',
    contactPerson: 'Sari Dewi',
    channel: 'TPI',
    cities: ['Jakarta', 'Surabaya'],
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'active',
    driversEnrolled: 512,
    pointsBudget: 3500000,
    pointsUsed: 2890000,
    pointsPerTrip: 75,
    minTrips: 8,
    targetTrips: 80,
    totalTripsCompleted: 38533,
    description: 'Summer sale campaign with drivers carrying Tokopedia branded car wraps and stickers.',
    createdAt: '2025-01-20',
    vehicleTypes: ['Toyota Calya', 'Honda Brio'],
  },
  {
    id: 'CMP-2503',
    name: 'Shopee 4.4 Mega Campaign',
    client: 'Shopee Indonesia',
    contactPerson: 'Budi Santosa',
    channel: 'NON GRAB',
    cities: ['Bandung', 'Semarang', 'Yogyakarta'],
    startDate: '2025-04-01',
    endDate: '2025-04-15',
    status: 'draft',
    driversEnrolled: 0,
    pointsBudget: 2500000,
    pointsUsed: 0,
    pointsPerTrip: 60,
    minTrips: 5,
    targetTrips: 60,
    totalTripsCompleted: 0,
    description: 'Shopee 4.4 mega sale event campaign targeting non-Grab drivers in Central Java cities.',
    createdAt: '2025-02-10',
  },
  {
    id: 'CMP-2504',
    name: 'Grab Eid al-Fitr Special',
    client: 'Grab Indonesia',
    contactPerson: 'Dewi Kusuma',
    channel: 'GTI',
    cities: ['Jakarta', 'Bandung', 'Surabaya', 'Medan'],
    startDate: '2025-03-28',
    endDate: '2025-04-07',
    status: 'draft',
    driversEnrolled: 0,
    pointsBudget: 8000000,
    pointsUsed: 0,
    pointsPerTrip: 80,
    minTrips: 15,
    targetTrips: 150,
    totalTripsCompleted: 0,
    description: 'Eid al-Fitr campaign with special bonus multipliers during peak festive hours.',
    createdAt: '2025-02-18',
    vehicleTypes: ['Toyota Calya', 'Daihatsu Ayla', 'Toyota Agya'],
  },
  {
    id: 'CMP-2505',
    name: 'GoPay Cashback Q1',
    client: 'GoPay',
    contactPerson: 'Rudi Hartono',
    channel: 'GTI',
    cities: ['Jakarta', 'Tangerang'],
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    status: 'paused',
    driversEnrolled: 380,
    pointsBudget: 2000000,
    pointsUsed: 850000,
    pointsPerTrip: 45,
    minTrips: 10,
    targetTrips: 80,
    totalTripsCompleted: 18888,
    description: 'GoPay cashback promotion with driver incentive program for Q1 2025.',
    createdAt: '2025-01-05',
    vehicleTypes: ['Honda Brio', 'Toyota Calya'],
  },
  {
    id: 'CMP-2506',
    name: 'Lazada 12.12 Mega Sale',
    client: 'Lazada Indonesia',
    contactPerson: 'Ahmad Yani',
    channel: 'TPI',
    cities: ['Jakarta', 'Bandung', 'Surabaya', 'Denpasar'],
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    status: 'completed',
    driversEnrolled: 1243,
    pointsBudget: 10000000,
    pointsUsed: 9870000,
    pointsPerTrip: 100,
    minTrips: 20,
    targetTrips: 120,
    totalTripsCompleted: 98700,
    description: 'Year-end mega sale campaign with highest points per trip incentive.',
    createdAt: '2024-11-01',
    vehicleTypes: ['Toyota Calya', 'Honda Brio', 'Daihatsu Ayla', 'Toyota Agya', 'Daihatsu Sigra'],
  },
  {
    id: 'CMP-2507',
    name: 'OVO Cashback Festival',
    client: 'OVO',
    contactPerson: 'Linda Setiawan',
    channel: 'NON GRAB',
    cities: ['Surabaya', 'Malang'],
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'completed',
    driversEnrolled: 298,
    pointsBudget: 1500000,
    pointsUsed: 1320000,
    pointsPerTrip: 55,
    minTrips: 8,
    targetTrips: 60,
    totalTripsCompleted: 24000,
    description: 'New Year cashback festival campaign for non-Grab drivers in East Java.',
    createdAt: '2024-12-15',
  },
  {
    id: 'CMP-2508',
    name: 'Dana Promo Nasional',
    client: 'Dana Indonesia',
    contactPerson: 'Yusuf Prasetyo',
    channel: 'GTI',
    cities: ['Jakarta', 'Bandung', 'Semarang', 'Yogyakarta', 'Surabaya'],
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    status: 'completed',
    driversEnrolled: 956,
    pointsBudget: 7500000,
    pointsUsed: 7120000,
    pointsPerTrip: 70,
    minTrips: 12,
    targetTrips: 100,
    totalTripsCompleted: 101714,
    description: 'National Dana digital payment promotion campaign across major Indonesian cities.',
    createdAt: '2024-10-10',
    vehicleTypes: ['Toyota Calya', 'Honda Brio', 'Daihatsu Ayla', 'Suzuki Ertiga'],
  },
  {
    id: 'CMP-2509',
    name: 'Blibli Harbolnas 11.11',
    client: 'Blibli',
    contactPerson: 'Nita Arianto',
    channel: 'TPI',
    cities: ['Jakarta', 'Depok', 'Bekasi'],
    startDate: '2024-11-01',
    endDate: '2024-11-11',
    status: 'completed',
    driversEnrolled: 487,
    pointsBudget: 3000000,
    pointsUsed: 2950000,
    pointsPerTrip: 65,
    minTrips: 10,
    targetTrips: 80,
    totalTripsCompleted: 45384,
    description: '11.11 National Shopping Day campaign with maximum 11-day duration.',
    createdAt: '2024-10-20',
    vehicleTypes: ['Toyota Calya', 'Honda Brio'],
  },
  {
    id: 'CMP-2510',
    name: 'ShopeePay Merdeka',
    client: 'ShopeePay',
    contactPerson: 'Fitri Handayani',
    channel: 'NON GRAB',
    cities: ['Jakarta', 'Bandung'],
    startDate: '2025-02-10',
    endDate: '2025-03-20',
    status: 'paused',
    driversEnrolled: 234,
    pointsBudget: 1800000,
    pointsUsed: 690000,
    pointsPerTrip: 40,
    minTrips: 7,
    targetTrips: 70,
    totalTripsCompleted: 17250,
    description: 'ShopeePay campaign paused pending compliance review for new marketing materials.',
    createdAt: '2025-01-28',
    vehicleTypes: ['Toyota Calya', 'Daihatsu Ayla'],
  },
  {
    id: 'CMP-2511',
    name: 'Bukalapak Deals Program',
    client: 'Bukalapak',
    contactPerson: 'Gunawan Pranoto',
    channel: 'GTI',
    cities: ['Yogyakarta', 'Solo', 'Semarang'],
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    status: 'draft',
    driversEnrolled: 0,
    pointsBudget: 2200000,
    pointsUsed: 0,
    pointsPerTrip: 55,
    minTrips: 8,
    targetTrips: 75,
    totalTripsCompleted: 0,
    description: 'Bukalapak special deals program targeting Central Java driver communities.',
    createdAt: '2025-02-12',
    vehicleTypes: ['Toyota Calya', 'Daihatsu Sigra'],
  },
  {
    id: 'CMP-2512',
    name: 'Tokopedia Flash Sale Jan',
    client: 'Tokopedia',
    contactPerson: 'Sari Dewi',
    channel: 'TPI',
    cities: ['Medan', 'Palembang'],
    startDate: '2024-10-01',
    endDate: '2024-10-31',
    status: 'completed',
    driversEnrolled: 312,
    pointsBudget: 2000000,
    pointsUsed: 1890000,
    pointsPerTrip: 60,
    minTrips: 10,
    targetTrips: 75,
    totalTripsCompleted: 31500,
    description: 'Flash sale campaign targeting Sumatra island drivers for Q4 push.',
    createdAt: '2024-09-15',
  },
  {
    id: 'CMP-2513',
    name: 'Grab Merdeka Weekend',
    client: 'Grab Indonesia',
    contactPerson: 'Dewi Kusuma',
    channel: 'GTI',
    cities: ['Jakarta', 'Bandung', 'Surabaya'],
    startDate: '2025-02-14',
    endDate: '2025-04-30',
    status: 'active',
    driversEnrolled: 674,
    pointsBudget: 4500000,
    pointsUsed: 1100000,
    pointsPerTrip: 55,
    minTrips: 10,
    targetTrips: 90,
    totalTripsCompleted: 20000,
    description: 'Extended campaign running through Q1 with consistent driver engagement incentives.',
    createdAt: '2025-02-01',
    vehicleTypes: ['Toyota Calya', 'Honda Brio', 'Daihatsu Ayla'],
  },
  {
    id: 'CMP-2514',
    name: 'GoFood Special Delivery',
    client: 'GoFood',
    contactPerson: 'Andi Wijaya',
    channel: 'GTI',
    cities: ['Jakarta', 'Tangerang', 'Bekasi', 'Depok'],
    startDate: '2025-02-20',
    endDate: '2025-03-20',
    status: 'active',
    driversEnrolled: 428,
    pointsBudget: 3200000,
    pointsUsed: 640000,
    pointsPerTrip: 45,
    minTrips: 12,
    targetTrips: 100,
    totalTripsCompleted: 14222,
    description: 'GoFood special delivery zone campaign with bonus rewards for Jabodetabek coverage.',
    createdAt: '2025-02-08',
    vehicleTypes: ['Toyota Calya', 'Honda Brio', 'Daihatsu Ayla', 'Mitsubishi Xpander'],
  },
  {
    id: 'CMP-2515',
    name: 'Alfamart Payday Promo',
    client: 'Alfamart',
    contactPerson: 'Bambang Wicaksono',
    channel: 'NON GRAB',
    cities: ['Surabaya', 'Makassar', 'Denpasar'],
    startDate: '2025-03-25',
    endDate: '2025-04-25',
    status: 'draft',
    driversEnrolled: 0,
    pointsBudget: 1600000,
    pointsUsed: 0,
    pointsPerTrip: 40,
    minTrips: 6,
    targetTrips: 60,
    totalTripsCompleted: 0,
    description: 'Alfamart payday promotional campaign for Eastern Indonesia markets.',
    createdAt: '2025-02-17',
  },
];

// ── Stat Card Component ───────────────────────────────────────────────────────

interface CampaignStatCardProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sub: string;
  iconBg: string;
  iconColor: string;
}

function CampaignStatCard({ icon: Icon, label, value, sub, iconBg, iconColor }: CampaignStatCardProps) {
  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--elevation-sm)',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: 'var(--radius)',
        backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
          fontWeight: 'var(--font-weight-medium)', color: 'var(--color-muted-foreground)',
          marginBottom: '4px',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)',
          marginBottom: '2px',
        }}>
          {value}
        </div>
        <div style={{
          fontFamily: 'var(--font-family-geist)', fontSize: '12px',
          fontWeight: 'var(--font-weight-normal)', color: 'var(--color-muted-foreground)',
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const { toasts, showToast, dismiss } = useToast();
  const [drawerCampaign, setDrawerCampaign] = useState<Campaign | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Stats ──
  const activeCampaigns     = campaigns.filter(c => c.status === 'active');
  const totalEnrolled       = activeCampaigns.reduce((sum, c) => sum + c.driversEnrolled, 0);
  const totalPointsDistrib  = campaigns.reduce((sum, c) => sum + c.pointsUsed, 0);

  const fmtPoints = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  // ── Handlers ──
  const handleRowClick = (campaign: Campaign) => {
    setDrawerCampaign(campaign);
    setDrawerOpen(true);
  };

  const handleCampaignAction = (action: string, campaignId: string) => {
    switch (action) {
      case 'view': {
        const c = campaigns.find(x => x.id === campaignId);
        if (c) { setDrawerCampaign(c); setDrawerOpen(true); }
        break;
      }
      case 'edit': {
        const c = campaigns.find(x => x.id === campaignId);
        if (c) { setEditCampaign(c); setModalOpen(true); }
        break;
      }
      case 'duplicate': {
        const c = campaigns.find(x => x.id === campaignId);
        if (c) {
          showToast('success', 'Campaign Duplicated', `A copy of "${c.name}" has been created as a draft.`);
          const dupe: Campaign = {
            ...c,
            id: `CMP-${Date.now().toString().slice(-4)}`,
            name: `${c.name} (Copy)`,
            status: 'draft',
            driversEnrolled: 0,
            pointsUsed: 0,
            totalTripsCompleted: 0,
            createdAt: new Date().toISOString().split('T')[0],
          };
          setCampaigns(prev => [dupe, ...prev]);
        }
        break;
      }
      case 'pause': {
        const cp = campaigns.find(x => x.id === campaignId);
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' as const } : c));
        if (drawerCampaign?.id === campaignId) setDrawerCampaign(prev => prev ? { ...prev, status: 'paused' } : prev);
        showToast('warning', 'Campaign Paused', `"${cp?.name}" has been paused.`);
        break;
      }
      case 'resume': {
        const cr = campaigns.find(x => x.id === campaignId);
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'active' as const } : c));
        if (drawerCampaign?.id === campaignId) setDrawerCampaign(prev => prev ? { ...prev, status: 'active' } : prev);
        showToast('success', 'Campaign Resumed', `"${cr?.name}" is now active.`);
        break;
      }
      case 'end': {
        const ce = campaigns.find(x => x.id === campaignId);
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'completed' as const } : c));
        if (drawerCampaign?.id === campaignId) setDrawerCampaign(prev => prev ? { ...prev, status: 'completed' } : prev);
        setDrawerOpen(false);
        showToast('info', 'Campaign Ended', `"${ce?.name}" has been marked as completed.`);
        break;
      }
    }
  };

  const handleSaveCampaign = (data: Partial<Campaign>) => {
    if (editCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editCampaign.id ? { ...c, ...data } : c));
      showToast('success', 'Campaign Updated', `"${data.name ?? editCampaign.name}" has been updated.`);
    } else {
      const newCampaign: Campaign = {
        id: `CMP-${Date.now().toString().slice(-4)}`,
        name: data.name ?? '',
        client: data.client ?? '',
        contactPerson: data.contactPerson,
        channel: data.channel ?? 'GTI',
        cities: data.cities ?? [],
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        status: 'draft',
        driversEnrolled: 0,
        pointsBudget: data.pointsBudget ?? 0,
        pointsUsed: 0,
        pointsPerTrip: data.pointsPerTrip ?? 50,
        minTrips: data.minTrips ?? 10,
        targetTrips: data.targetTrips ?? 100,
        totalTripsCompleted: 0,
        description: data.description,
        createdAt: new Date().toISOString().split('T')[0],
        vehicleTypes: data.vehicleTypes,
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      showToast('success', 'Campaign Created', `"${newCampaign.name}" has been created as a draft.`);
    }
    setEditCampaign(null);
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Client', 'Channel', 'Cities', 'Start', 'End', 'Status', 'Drivers', 'Budget', 'Used'];
    const rows = campaigns.map(c => [
      c.id, c.name, c.client, c.channel, c.cities.join('; '),
      c.startDate, c.endDate, c.status,
      c.driversEnrolled.toString(), c.pointsBudget.toString(), c.pointsUsed.toString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {/* ── Page Header ── */}
      <div style={{
        marginBottom: '28px',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-30)',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)',
            marginBottom: '6px',
          }}>
            Campaigns
          </h1>
          <p style={{
            fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
            fontWeight: 'var(--font-weight-normal)', color: 'var(--color-muted-foreground)',
          }}>
            Manage advertising campaigns, track driver participation and points distribution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={handleExport}
            style={{
              padding: '9px 16px', borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-medium)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => { setEditCampaign(null); setModalOpen(true); }}
            style={{
              padding: '9px 16px', borderRadius: 'var(--radius)',
              border: 'none', backgroundColor: '#7C3AED', color: 'white',
              fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-medium)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; }}
          >
            <Plus size={15} /> New Campaign
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <CampaignStatCard
          icon={LayoutGrid}
          label="Total Campaigns"
          value={campaigns.length}
          sub={`${campaigns.filter(c => c.status === 'draft').length} drafts pending launch`}
          iconBg="rgba(124,58,237,0.1)"
          iconColor="#7C3AED"
        />
        <CampaignStatCard
          icon={Zap}
          label="Active Now"
          value={activeCampaigns.length}
          sub={`${campaigns.filter(c => c.status === 'paused').length} paused`}
          iconBg="rgba(34,197,94,0.1)"
          iconColor="#16A34A"
        />
        <CampaignStatCard
          icon={Users}
          label="Drivers Enrolled"
          value={totalEnrolled.toLocaleString()}
          sub="across active campaigns"
          iconBg="rgba(59,130,246,0.1)"
          iconColor="#2563EB"
        />
        <CampaignStatCard
          icon={Coins}
          label="Points Distributed"
          value={`${fmtPoints(totalPointsDistrib)} pts`}
          sub="all-time across all campaigns"
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#D97706"
        />
      </div>

      {/* ── Campaigns Table ── */}
      <CampaignsTable
        campaigns={campaigns}
        onRowClick={handleRowClick}
        onCampaignAction={handleCampaignAction}
      />

      {/* ── Detail Drawer ── */}
      <CampaignDetailDrawer
        campaign={drawerCampaign}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={(c) => { setEditCampaign(c); setModalOpen(true); }}
        onAction={handleCampaignAction}
      />

      {/* ── Create / Edit Modal ── */}
      <CreateEditCampaignModal
        open={modalOpen}
        campaign={editCampaign}
        onClose={() => { setModalOpen(false); setEditCampaign(null); }}
        onSave={handleSaveCampaign}
      />
    </>
  );
}
