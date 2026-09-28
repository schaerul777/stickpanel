import { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { ClientsTable } from '../components/ClientsTable';
import { ClientDetailDrawer } from '../components/ClientDetailDrawer';
import { AddEditClientModal } from '../components/AddEditClientModal';
import { DeleteClientModal } from '../components/DeleteClientModal';
import { ManageContactsModal } from '../components/ManageContactsModal';
import { UploadDocumentsModal } from '../components/UploadDocumentsModal';
import { BulkChangeSalesPersonModal } from '../components/BulkChangeSalesPersonModal';
import { useToast, ToastContainer } from '../components/Toast';
import { CORE_META } from '../core/coreConfig';
import { useCore } from '../core/CoreContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClientStatus = 'active' | 'inactive' | 'suspended';
export type Industry =
  | 'F&B' | 'Retail' | 'Technology' | 'Automotive' | 'Healthcare'
  | 'Finance' | 'Entertainment' | 'E-commerce' | 'Fashion' | 'Real Estate'
  | 'Education' | 'Hospitality' | 'Logistics' | 'Other';

export interface Brand {
  id: string;
  name: string;
  activeCampaigns: number;
  totalSpend: number;
}

export interface ContactPerson {
  id: string;
  name: string;
  position: string;
  email: string;
  mobile: string;
  isPrimary: boolean;
}

export interface ClientDoc {
  type: 'siup' | 'tdp' | 'domicili' | 'npwp';
  uploaded: boolean;
  filename?: string;
  size?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface Client {
  id: string;
  companyName: string;
  brands: Brand[];          // Multiple brands under one company
  industry: Industry;
  website?: string;
  salesPerson: { id: string; name: string; initials: string };
  contacts: ContactPerson[];
  documents: ClientDoc[];
  npwp?: string;
  status: ClientStatus;
  activeCampaigns: number;  // sum across all brands
  totalSpend: number;       // sum across all brands
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
}

// ── Industry Meta (no emojis) ──────────────────────────────────────────────────

export const INDUSTRY_META: Record<Industry, { bg: string; color: string }> = {
  'F&B':          { bg: 'rgba(234,88,12,0.1)',   color: '#EA580C' },
  'Retail':       { bg: 'rgba(37,99,235,0.1)',   color: '#2563EB' },
  'Technology':   { bg: 'rgba(124,58,237,0.1)',  color: '#7C3AED' },
  'Automotive':   { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
  'Healthcare':   { bg: 'rgba(22,163,74,0.1)',   color: '#16A34A' },
  'Finance':      { bg: 'rgba(202,138,4,0.1)',   color: '#CA8A04' },
  'Entertainment':{ bg: 'rgba(219,39,119,0.1)',  color: '#DB2777' },
  'E-commerce':   { bg: 'rgba(13,148,136,0.1)',  color: '#0D9488' },
  'Fashion':      { bg: 'rgba(168,85,247,0.1)',  color: '#A855F7' },
  'Real Estate':  { bg: 'rgba(71,85,105,0.1)',   color: '#475569' },
  'Education':    { bg: 'rgba(79,70,229,0.1)',   color: '#4F46E5' },
  'Hospitality':  { bg: 'rgba(245,158,11,0.1)',  color: '#D97706' },
  'Logistics':    { bg: 'rgba(100,116,139,0.1)', color: '#64748B' },
  'Other':        { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
};

export function countDocs(client: Client): { uploaded: number; total: number } {
  return { uploaded: client.documents.filter(d => d.uploaded).length, total: 4 };
}

// ── Sales Persons ─────────────────────────────────────────────────────────────

export const SALES_PERSONS = [
  { id: 'USR-001', name: 'Ahmad Rahman',  initials: 'AR' },
  { id: 'USR-002', name: 'Dewi Kusuma',   initials: 'DK' },
  { id: 'USR-003', name: 'Rudi Hartono',  initials: 'RH' },
  { id: 'USR-004', name: 'Siti Rahayu',   initials: 'SR' },
  { id: 'USR-005', name: 'Budi Santoso',  initials: 'BS' },
];

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockClients: Client[] = [
  {
    id: 'CLT-10001', companyName: 'PT Kopi Kenangan Indonesia',
    brands: [
      { id: 'BRD-001-1', name: 'Kenangan Coffee',   activeCampaigns: 2, totalSpend: 90_000_000 },
      { id: 'BRD-001-2', name: 'Kenangan Gold',      activeCampaigns: 1, totalSpend: 40_000_000 },
      { id: 'BRD-001-3', name: 'Kenangan Signature', activeCampaigns: 0, totalSpend: 20_000_000 },
    ],
    industry: 'F&B', website: 'kopikenangan.com',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    contacts: [
      { id: 'CON-001-1', name: 'Sarah Johnson',  position: 'Marketing Manager',    email: 'sarah.j@kenangan.co.id',  mobile: '0812-3456-7890', isPrimary: true  },
      { id: 'CON-001-2', name: 'Budi Santoso',   position: 'Campaign Coordinator', email: 'budi.s@kenangan.co.id',   mobile: '0821-9876-5432', isPrimary: false },
      { id: 'CON-001-3', name: 'Rina Marlina',   position: 'Finance Manager',      email: 'rina.m@kenangan.co.id',   mobile: '0878-1234-5678', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true,  filename: 'SIUP_PT_Kopi_Kenangan.pdf',  size: '2.3 MB', uploadedAt: 'Jan 15, 2025', uploadedBy: 'Ahmad Rahman' },
      { type: 'tdp',     uploaded: true,  filename: 'TDP_PT_Kopi_Kenangan.pdf',   size: '1.8 MB', uploadedAt: 'Jan 15, 2025', uploadedBy: 'Ahmad Rahman' },
      { type: 'domicili',uploaded: true,  filename: 'Domicili_Kopi_Kenangan.pdf', size: '1.2 MB', uploadedAt: 'Jan 15, 2025', uploadedBy: 'Ahmad Rahman' },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '01.234.567.8-901.234', status: 'active', activeCampaigns: 3, totalSpend: 150_000_000,
    createdAt: 'Jan 15, 2025', createdBy: 'Ahmad Rahman', lastUpdated: 'Feb 10, 2025',
  },
  {
    id: 'CLT-10002', companyName: 'PT Tokopedia Indonesia',
    brands: [
      { id: 'BRD-002-1', name: 'Tokopedia',     activeCampaigns: 3, totalSpend: 200_000_000 },
      { id: 'BRD-002-2', name: 'GoTo Financial', activeCampaigns: 2, totalSpend: 180_000_000 },
    ],
    industry: 'E-commerce', website: 'tokopedia.com',
    salesPerson: { id: 'USR-002', name: 'Dewi Kusuma', initials: 'DK' },
    contacts: [
      { id: 'CON-002-1', name: 'Budi Santoso', position: 'Partnership Manager', email: 'budi.santoso@tokopedia.com', mobile: '0821-1234-5678', isPrimary: true  },
      { id: 'CON-002-2', name: 'Clara Tan',     position: 'Marketing Lead',     email: 'clara.tan@tokopedia.com',   mobile: '0812-8765-4321', isPrimary: false },
      { id: 'CON-002-3', name: 'David Widjaja', position: 'Account Manager',    email: 'david.w@tokopedia.com',     mobile: '0857-3456-7890', isPrimary: false },
      { id: 'CON-002-4', name: 'Eva Putri',     position: 'Campaign Analyst',   email: 'eva.p@tokopedia.com',       mobile: '0878-9012-3456', isPrimary: false },
      { id: 'CON-002-5', name: 'Fahri Maulana', position: 'Finance Liaison',    email: 'fahri.m@tokopedia.com',     mobile: '0813-2345-6789', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true,  filename: 'SIUP_Tokopedia.pdf',    size: '3.1 MB', uploadedAt: 'Dec 5, 2024', uploadedBy: 'Dewi Kusuma' },
      { type: 'tdp',     uploaded: true,  filename: 'TDP_Tokopedia.pdf',     size: '2.0 MB', uploadedAt: 'Dec 5, 2024', uploadedBy: 'Dewi Kusuma' },
      { type: 'domicili',uploaded: true,  filename: 'Domicili_Tokopedia.pdf',size: '1.5 MB', uploadedAt: 'Dec 5, 2024', uploadedBy: 'Dewi Kusuma' },
      { type: 'npwp',    uploaded: false },
    ],
    status: 'active', activeCampaigns: 5, totalSpend: 380_000_000,
    createdAt: 'Dec 5, 2024', createdBy: 'Dewi Kusuma', lastUpdated: 'Feb 12, 2025',
  },
  {
    id: 'CLT-10003', companyName: 'PT Unilever Indonesia',
    brands: [
      { id: 'BRD-003-1', name: 'Dove',     activeCampaigns: 1, totalSpend: 80_000_000 },
      { id: 'BRD-003-2', name: 'Lifebuoy', activeCampaigns: 1, totalSpend: 70_000_000 },
      { id: 'BRD-003-3', name: 'Sunsilk',  activeCampaigns: 0, totalSpend: 70_000_000 },
    ],
    industry: 'Retail', website: 'unilever.co.id',
    salesPerson: { id: 'USR-003', name: 'Rudi Hartono', initials: 'RH' },
    contacts: [
      { id: 'CON-003-1', name: 'Maria Susanti', position: 'Brand Manager',   email: 'maria.s@unilever.com',  mobile: '0811-2345-6789', isPrimary: true  },
      { id: 'CON-003-2', name: 'Hendra Wijaya', position: 'Trade Marketing', email: 'hendra.w@unilever.com', mobile: '0812-9876-5432', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true, filename: 'SIUP_Unilever.pdf',    size: '2.7 MB', uploadedAt: 'Nov 20, 2024', uploadedBy: 'Rudi Hartono' },
      { type: 'tdp',     uploaded: true, filename: 'TDP_Unilever.pdf',     size: '1.9 MB', uploadedAt: 'Nov 20, 2024', uploadedBy: 'Rudi Hartono' },
      { type: 'domicili',uploaded: true, filename: 'Domicili_Unilever.pdf',size: '1.3 MB', uploadedAt: 'Nov 20, 2024', uploadedBy: 'Rudi Hartono' },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '02.345.678.9-012.345', status: 'active', activeCampaigns: 2, totalSpend: 220_000_000,
    createdAt: 'Nov 20, 2024', createdBy: 'Rudi Hartono', lastUpdated: 'Feb 5, 2025',
  },
  {
    id: 'CLT-10004', companyName: 'PT Gojek Indonesia',
    brands: [
      { id: 'BRD-004-1', name: 'Gojek',  activeCampaigns: 2, totalSpend: 150_000_000 },
      { id: 'BRD-004-2', name: 'GoFood', activeCampaigns: 1, totalSpend: 80_000_000  },
      { id: 'BRD-004-3', name: 'GoPay',  activeCampaigns: 1, totalSpend: 80_000_000  },
    ],
    industry: 'Technology', website: 'gojek.com',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    contacts: [
      { id: 'CON-004-1', name: 'Kevin Lauw',     position: 'Partnership Director', email: 'kevin.l@gojek.com',   mobile: '0821-5678-9012', isPrimary: true  },
      { id: 'CON-004-2', name: 'Lisa Tanaka',     position: 'Marketing Manager',   email: 'lisa.t@gojek.com',    mobile: '0878-3456-7890', isPrimary: false },
      { id: 'CON-004-3', name: 'Michael Suharto', position: 'Campaign Lead',       email: 'michael.s@gojek.com', mobile: '0813-7890-1234', isPrimary: false },
      { id: 'CON-004-4', name: 'Nadia Rahman',    position: 'Account Executive',   email: 'nadia.r@gojek.com',   mobile: '0857-2345-6789', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true, filename: 'SIUP_Gojek.pdf', size: '2.5 MB', uploadedAt: 'Oct 10, 2024', uploadedBy: 'Ahmad Rahman' },
      { type: 'tdp',     uploaded: false },
      { type: 'domicili',uploaded: false },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '03.456.789.0-123.456', status: 'active', activeCampaigns: 4, totalSpend: 310_000_000,
    createdAt: 'Oct 10, 2024', createdBy: 'Ahmad Rahman', lastUpdated: 'Feb 15, 2025',
  },
  {
    id: 'CLT-10005', companyName: 'PT Astra International',
    brands: [
      { id: 'BRD-005-1', name: 'Toyota',   activeCampaigns: 1, totalSpend: 100_000_000 },
      { id: 'BRD-005-2', name: 'Daihatsu', activeCampaigns: 1, totalSpend: 80_000_000  },
    ],
    industry: 'Automotive', website: 'toyota.astra.co.id',
    salesPerson: { id: 'USR-004', name: 'Siti Rahayu', initials: 'SR' },
    contacts: [
      { id: 'CON-005-1', name: 'Robert Halim',   position: 'Marketing Director', email: 'robert.h@astra.co.id', mobile: '0812-4567-8901', isPrimary: true  },
      { id: 'CON-005-2', name: 'Sandra Dewi',    position: 'Brand Manager',      email: 'sandra.d@astra.co.id', mobile: '0821-3456-7890', isPrimary: false },
      { id: 'CON-005-3', name: 'Taufik Hidayat', position: 'Campaign Manager',   email: 'taufik.h@astra.co.id', mobile: '0878-5678-9012', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true, filename: 'SIUP_Astra.pdf',    size: '3.2 MB', uploadedAt: 'Sep 5, 2024', uploadedBy: 'Siti Rahayu' },
      { type: 'tdp',     uploaded: true, filename: 'TDP_Astra.pdf',     size: '2.4 MB', uploadedAt: 'Sep 5, 2024', uploadedBy: 'Siti Rahayu' },
      { type: 'domicili',uploaded: true, filename: 'Domicili_Astra.pdf',size: '1.8 MB', uploadedAt: 'Sep 5, 2024', uploadedBy: 'Siti Rahayu' },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '04.567.890.1-234.567', status: 'active', activeCampaigns: 2, totalSpend: 180_000_000,
    createdAt: 'Sep 5, 2024', createdBy: 'Siti Rahayu', lastUpdated: 'Jan 28, 2025',
  },
  {
    id: 'CLT-10006', companyName: 'PT Bank Central Asia',
    brands: [
      { id: 'BRD-006-1', name: 'BCA',         activeCampaigns: 3, totalSpend: 250_000_000 },
      { id: 'BRD-006-2', name: 'BCA Digital', activeCampaigns: 2, totalSpend: 120_000_000 },
      { id: 'BRD-006-3', name: 'Blu by BCA',  activeCampaigns: 1, totalSpend: 80_000_000  },
    ],
    industry: 'Finance', website: 'bca.co.id',
    salesPerson: { id: 'USR-002', name: 'Dewi Kusuma', initials: 'DK' },
    contacts: [
      { id: 'CON-006-1', name: 'Anwar Prasetyo',  position: 'Digital Marketing Head', email: 'anwar.p@bca.co.id',  mobile: '0811-5678-9012', isPrimary: true  },
      { id: 'CON-006-2', name: 'Bella Oktavia',   position: 'Campaign Manager',       email: 'bella.o@bca.co.id',  mobile: '0812-6789-0123', isPrimary: false },
      { id: 'CON-006-3', name: 'Candra Putra',    position: 'Partnership Lead',       email: 'candra.p@bca.co.id', mobile: '0821-7890-1234', isPrimary: false },
      { id: 'CON-006-4', name: 'Diana Sari',      position: 'Legal Advisor',          email: 'diana.s@bca.co.id',  mobile: '0857-8901-2345', isPrimary: false },
      { id: 'CON-006-5', name: 'Edwin Kurniawan', position: 'Finance Officer',        email: 'edwin.k@bca.co.id',  mobile: '0878-9012-3456', isPrimary: false },
      { id: 'CON-006-6', name: 'Fenny Tan',       position: 'Account Manager',        email: 'fenny.t@bca.co.id',  mobile: '0813-0123-4567', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true, filename: 'SIUP_BCA.pdf',    size: '4.1 MB', uploadedAt: 'Aug 15, 2024', uploadedBy: 'Dewi Kusuma' },
      { type: 'tdp',     uploaded: true, filename: 'TDP_BCA.pdf',     size: '2.8 MB', uploadedAt: 'Aug 15, 2024', uploadedBy: 'Dewi Kusuma' },
      { type: 'domicili',uploaded: true, filename: 'Domicili_BCA.pdf',size: '2.1 MB', uploadedAt: 'Aug 15, 2024', uploadedBy: 'Dewi Kusuma' },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '05.678.901.2-345.678', status: 'active', activeCampaigns: 6, totalSpend: 450_000_000,
    createdAt: 'Aug 15, 2024', createdBy: 'Dewi Kusuma', lastUpdated: 'Feb 18, 2025',
  },
  {
    id: 'CLT-10007', companyName: 'PT Indofood CBP',
    brands: [
      { id: 'BRD-007-1', name: 'Indomie', activeCampaigns: 0, totalSpend: 55_000_000 },
      { id: 'BRD-007-2', name: 'Pop Mie', activeCampaigns: 0, totalSpend: 25_000_000 },
      { id: 'BRD-007-3', name: 'Chitato', activeCampaigns: 0, totalSpend: 15_000_000 },
    ],
    industry: 'F&B', website: 'indofood.com',
    salesPerson: { id: 'USR-001', name: 'Ahmad Rahman', initials: 'AR' },
    contacts: [
      { id: 'CON-007-1', name: 'Guntur Wibowo', position: 'Brand Director',    email: 'guntur.w@indofood.com', mobile: '0811-9012-3456', isPrimary: true  },
      { id: 'CON-007-2', name: 'Hana Pertiwi',  position: 'Marketing Manager', email: 'hana.p@indofood.com',   mobile: '0812-0123-4567', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: false },
      { type: 'tdp',     uploaded: false },
      { type: 'domicili',uploaded: false },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '06.789.012.3-456.789', status: 'inactive', activeCampaigns: 0, totalSpend: 95_000_000,
    createdAt: 'Jul 20, 2024', createdBy: 'Ahmad Rahman', lastUpdated: 'Jan 5, 2025',
  },
  {
    id: 'CLT-10008', companyName: 'PT Shopee International Indonesia',
    brands: [
      { id: 'BRD-008-1', name: 'Shopee',     activeCampaigns: 0, totalSpend: 180_000_000 },
      { id: 'BRD-008-2', name: 'ShopeeFood', activeCampaigns: 0, totalSpend: 95_000_000  },
    ],
    industry: 'E-commerce', website: 'shopee.co.id',
    salesPerson: { id: 'USR-005', name: 'Budi Santoso', initials: 'BS' },
    contacts: [
      { id: 'CON-008-1', name: 'Jimmy Lim',    position: 'Regional Head',     email: 'jimmy.l@shopee.com',   mobile: '0821-2345-6789', isPrimary: true  },
      { id: 'CON-008-2', name: 'Kartika Sari', position: 'Marketing Manager', email: 'kartika.s@shopee.com', mobile: '0812-3456-7890', isPrimary: false },
    ],
    documents: [
      { type: 'siup',    uploaded: true, filename: 'SIUP_Shopee.pdf',    size: '2.9 MB', uploadedAt: 'Jun 10, 2024', uploadedBy: 'Budi Santoso' },
      { type: 'tdp',     uploaded: true, filename: 'TDP_Shopee.pdf',     size: '2.1 MB', uploadedAt: 'Jun 10, 2024', uploadedBy: 'Budi Santoso' },
      { type: 'domicili',uploaded: false },
      { type: 'npwp',    uploaded: true },
    ],
    npwp: '07.890.123.4-567.890', status: 'suspended', activeCampaigns: 0, totalSpend: 275_000_000,
    createdAt: 'Jun 10, 2024', createdBy: 'Budi Santoso', lastUpdated: 'Feb 1, 2025',
  },
];

// ── Page Component ────────────────────────────────────────────────────────────

export function Clients() {
  const { activeCore } = useCore();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const { toasts, showToast, dismiss } = useToast();

  const [drawerClient,   setDrawerClient]   = useState<Client | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [addOpen,        setAddOpen]        = useState(false);
  const [editClient,     setEditClient]     = useState<Client | null>(null);
  const [editOpen,       setEditOpen]       = useState(false);
  const [deleteClient,   setDeleteClient]   = useState<Client | null>(null);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [contactsClient, setContactsClient] = useState<Client | null>(null);
  const [contactsOpen,   setContactsOpen]   = useState(false);
  const [docsClient,     setDocsClient]     = useState<Client | null>(null);
  const [docsOpen,       setDocsOpen]       = useState(false);
  const [bulkOpen,       setBulkOpen]       = useState(false);
  const [bulkClients,    setBulkClients]    = useState<Client[]>([]);

  // Keep drawer in sync when client data changes
  useEffect(() => {
    if (drawerClient) {
      const updated = clients.find(c => c.id === drawerClient.id);
      if (updated) setDrawerClient(updated);
    }
  }, [clients]);

  const handleRowClick = (client: Client) => { setDrawerClient(client); setDrawerOpen(true); };

  const handleAction = (action: string, clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    switch (action) {
      case 'view':       handleRowClick(client); break;
      case 'edit':       setEditClient(client); setEditOpen(true); break;
      case 'contacts':   setContactsClient(client); setContactsOpen(true); break;
      case 'documents':  setDocsClient(client); setDocsOpen(true); break;
      case 'deactivate':
        setClients(p => p.map(c => c.id === clientId ? { ...c, status: 'inactive' as const } : c));
        showToast('success', 'Client Deactivated', `${client.companyName} has been set to inactive.`);
        break;
      case 'activate':
        setClients(p => p.map(c => c.id === clientId ? { ...c, status: 'active' as const } : c));
        showToast('success', 'Client Activated', `${client.companyName} is now active.`);
        break;
      case 'delete':     setDeleteClient(client); setDeleteOpen(true); break;
    }
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    if (action === 'change-sales') {
      setBulkClients(clients.filter(c => ids.includes(c.id)));
      setBulkOpen(true);
    } else if (action === 'deactivate') {
      setClients(p => p.map(c => ids.includes(c.id) ? { ...c, status: 'inactive' as const } : c));
      showToast('success', 'Clients Deactivated', `${ids.length} client${ids.length > 1 ? 's' : ''} set to inactive.`);
    } else if (action === 'delete') {
      setClients(p => p.filter(c => !ids.includes(c.id)));
      showToast('success', 'Clients Deleted', `${ids.length} client${ids.length > 1 ? 's' : ''} removed.`);
    }
  };

  const handleSaveClient = (data: Partial<Client>) => {
    if (editClient) {
      setClients(p => p.map(c => c.id === editClient.id ? { ...c, ...data } : c));
      showToast('success', 'Client Updated', `${data.companyName ?? editClient.companyName} has been updated.`);
    } else {
      const brands = data.brands ?? [{ id: `BRD-${Date.now()}`, name: '', activeCampaigns: 0, totalSpend: 0 }];
      const newClient: Client = {
        id: `CLT-${10000 + clients.length + 1}`,
        companyName: data.companyName ?? '',
        brands,
        industry:    data.industry    ?? 'Other',
        website:     data.website,
        salesPerson: data.salesPerson ?? SALES_PERSONS[0],
        contacts:    data.contacts    ?? [],
        documents:   data.documents   ?? [
          { type: 'siup', uploaded: false }, { type: 'tdp', uploaded: false },
          { type: 'domicili', uploaded: false }, { type: 'npwp', uploaded: false },
        ],
        npwp: data.npwp, status: 'active',
        activeCampaigns: brands.reduce((s, b) => s + (b.activeCampaigns || 0), 0),
        totalSpend:      brands.reduce((s, b) => s + (b.totalSpend || 0), 0),
        createdAt: 'Feb 20, 2025', createdBy: 'Ahmad Rahman', lastUpdated: 'Feb 20, 2025',
      };
      setClients(p => [newClient, ...p]);
      showToast('success', 'Client Created', `${newClient.companyName} has been added successfully.`);
    }
    setEditClient(null); setEditOpen(false); setAddOpen(false);
  };

  const handleDelete = () => {
    if (deleteClient) {
      const name = deleteClient.companyName;
      setClients(p => p.filter(c => c.id !== deleteClient.id));
      if (drawerClient?.id === deleteClient.id) setDrawerOpen(false);
      showToast('success', 'Client Deleted', `${name} has been removed.`);
    }
    setDeleteOpen(false); setDeleteClient(null);
  };

  const handleExport = () => {
    const csv = [
      ['Client ID','Company','Brands','Industry','Sales Person','Status','Active Campaigns','Created'],
      ...clients.map(c => [c.id, c.companyName, c.brands.map(b => b.name).join('; '), c.industry, c.salesPerson.name, c.status, c.activeCampaigns.toString(), c.createdAt]),
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `clients-${new Date().toISOString().split('T')[0]}.csv`,
    });
    a.click();
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', cursor: 'default' }}>{CORE_META[activeCore].label}</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', cursor: 'default' }}>Sales</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>Clients</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)', fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1.2 }}>
              Clients
            </h1>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 400, color: 'var(--color-muted-foreground)' }}>
              Manage brand partnerships, legal documents, and campaign clients
            </p>
          </div>

          {/* Action Buttons */}
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
              onClick={() => { setEditClient(null); setAddOpen(true); }}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius)', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              <Plus size={15} /> Add Client
            </button>
          </div>
        </div>
      </div>

      {/* ── Clients Table ── */}
      <ClientsTable
        clients={clients}
        onRowClick={handleRowClick}
        onAction={handleAction}
        onBulkAction={handleBulkAction}
      />

      {/* ── Detail Drawer ── */}
      <ClientDetailDrawer
        open={drawerOpen}
        client={drawerClient}
        onClose={() => setDrawerOpen(false)}
        onEdit={c => { setDrawerOpen(false); setEditClient(c); setEditOpen(true); }}
        onAction={handleAction}
        onManageContacts={c => { setContactsClient(c); setContactsOpen(true); }}
        onUploadDocuments={c => { setDocsClient(c); setDocsOpen(true); }}
      />

      {/* ── Modals ── */}
      <AddEditClientModal
        open={addOpen || editOpen}
        client={editClient}
        onClose={() => { setAddOpen(false); setEditOpen(false); setEditClient(null); }}
        onSave={handleSaveClient}
      />
      <DeleteClientModal
        open={deleteOpen} client={deleteClient}
        onClose={() => { setDeleteOpen(false); setDeleteClient(null); }}
        onConfirm={handleDelete}
        onDeactivate={() => {
          if (deleteClient) setClients(p => p.map(c => c.id === deleteClient.id ? { ...c, status: 'inactive' as const } : c));
          setDeleteOpen(false); setDeleteClient(null);
        }}
      />
      <ManageContactsModal
        open={contactsOpen} client={contactsClient}
        onClose={() => { setContactsOpen(false); setContactsClient(null); }}
        onSave={contacts => {
          if (contactsClient) {
            setClients(p => p.map(c => c.id === contactsClient.id ? { ...c, contacts } : c));
            showToast('success', 'Contacts Updated', `Contacts for ${contactsClient.companyName} have been saved.`);
          }
        }}
      />
      <UploadDocumentsModal
        open={docsOpen} client={docsClient}
        onClose={() => { setDocsOpen(false); setDocsClient(null); }}
        onSave={(docs, npwp) => {
          if (docsClient) {
            setClients(p => p.map(c => c.id === docsClient.id ? { ...c, documents: docs, npwp } : c));
            showToast('success', 'Documents Updated', `Documents for ${docsClient.companyName} have been saved.`);
          }
        }}
      />
      <BulkChangeSalesPersonModal
        open={bulkOpen} clients={bulkClients}
        onClose={() => setBulkOpen(false)}
        onSave={sp => {
          const ids = bulkClients.map(c => c.id);
          setClients(p => p.map(c => ids.includes(c.id) ? { ...c, salesPerson: sp } : c));
          showToast('success', 'Sales Person Updated', `${bulkClients.length} client${bulkClients.length > 1 ? 's' : ''} reassigned to ${sp.name}.`);
          setBulkOpen(false);
        }}
      />
    </>
  );
}