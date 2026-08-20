import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { ApproveModal } from '../components/ApproveModal';
import { UploadResultsModal } from '../components/UploadResultsModal';
import { DetailDrawer } from '../components/DetailDrawer';

interface Transaction {
  id: string;
  driver: { name: string; phone: string };
  redeemItem: 'cash' | 'credit';
  points: number;
  status: 'new' | 'submitted' | 'paid' | 'failed';
  requestedAt: string;
  bankAccount?: string;
  bankName?: string;
  phoneNumber?: string;
  notes?: string;
  approvedAt?: string;
  processedAt?: string;
}

// Mock data
const initialTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    driver: { name: 'Ahmad Wijaya', phone: '+62 812-3456-7890' },
    redeemItem: 'cash',
    points: 500,
    status: 'new',
    requestedAt: '2025-02-17T08:30:00',
    bankAccount: '1234567890',
    bankName: 'Bank Mandiri',
  },
  {
    id: 'TXN-002',
    driver: { name: 'Siti Nurhaliza', phone: '+62 813-4567-8901' },
    redeemItem: 'credit',
    points: 250,
    status: 'new',
    requestedAt: '2025-02-17T09:15:00',
    phoneNumber: '+62 813-4567-8901',
  },
  {
    id: 'TXN-003',
    driver: { name: 'Budi Santoso', phone: '+62 821-5678-9012' },
    redeemItem: 'cash',
    points: 750,
    status: 'submitted',
    requestedAt: '2025-02-16T14:20:00',
    approvedAt: '2025-02-16T15:30:00',
    bankAccount: '9876543210',
    bankName: 'BCA',
  },
  {
    id: 'TXN-004',
    driver: { name: 'Dewi Lestari', phone: '+62 822-6789-0123' },
    redeemItem: 'cash',
    points: 1000,
    status: 'submitted',
    requestedAt: '2025-02-16T11:45:00',
    approvedAt: '2025-02-16T12:15:00',
    bankAccount: '5555666677',
    bankName: 'BNI',
  },
  {
    id: 'TXN-005',
    driver: { name: 'Eko Prasetyo', phone: '+62 823-7890-1234' },
    redeemItem: 'credit',
    points: 300,
    status: 'paid',
    requestedAt: '2025-02-15T16:00:00',
    approvedAt: '2025-02-15T16:30:00',
    processedAt: '2025-02-15T17:45:00',
    phoneNumber: '+62 823-7890-1234',
    notes: 'Transfer successful',
  },
  {
    id: 'TXN-006',
    driver: { name: 'Fitri Handayani', phone: '+62 824-8901-2345' },
    redeemItem: 'cash',
    points: 600,
    status: 'paid',
    requestedAt: '2025-02-15T10:30:00',
    approvedAt: '2025-02-15T11:00:00',
    processedAt: '2025-02-15T14:20:00',
    bankAccount: '1111222233',
    bankName: 'Bank Mandiri',
    notes: 'Transfer successful',
  },
  {
    id: 'TXN-007',
    driver: { name: 'Gunawan Tan', phone: '+62 825-9012-3456' },
    redeemItem: 'cash',
    points: 400,
    status: 'failed',
    requestedAt: '2025-02-14T13:20:00',
    approvedAt: '2025-02-14T14:00:00',
    processedAt: '2025-02-14T15:30:00',
    bankAccount: '9999888877',
    bankName: 'BRI',
    notes: 'Invalid account number',
  },
  {
    id: 'TXN-008',
    driver: { name: 'Hendra Kusuma', phone: '+62 826-0123-4567' },
    redeemItem: 'credit',
    points: 200,
    status: 'new',
    requestedAt: '2025-02-17T10:00:00',
    phoneNumber: '+62 826-0123-4567',
  },
  {
    id: 'TXN-009',
    driver: { name: 'Indah Permata', phone: '+62 827-1234-5678' },
    redeemItem: 'cash',
    points: 850,
    status: 'new',
    requestedAt: '2025-02-17T11:30:00',
    bankAccount: '4444333322',
    bankName: 'BCA',
  },
  {
    id: 'TXN-010',
    driver: { name: 'Joko Widodo', phone: '+62 828-2345-6789' },
    redeemItem: 'credit',
    points: 350,
    status: 'submitted',
    requestedAt: '2025-02-16T15:45:00',
    approvedAt: '2025-02-16T16:00:00',
    phoneNumber: '+62 828-2345-6789',
  },
];

export function RedeemTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionsToApprove, setTransactionsToApprove] = useState<Transaction[]>([]);
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  // Calculate stats
  const stats = {
    pendingReview: {
      count: transactions.filter(t => t.status === 'new').length,
      value: transactions.filter(t => t.status === 'new').reduce((sum, t) => sum + t.points, 0),
    },
    withFinance: {
      count: transactions.filter(t => t.status === 'submitted').length,
      value: transactions.filter(t => t.status === 'submitted').reduce((sum, t) => sum + t.points, 0),
    },
    completed: {
      count: transactions.filter(t => t.status === 'paid').length,
      value: transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.points, 0),
    },
    failed: {
      count: transactions.filter(t => t.status === 'failed').length,
      value: transactions.filter(t => t.status === 'failed').reduce((sum, t) => sum + t.points, 0),
    },
  };

  // Filter transactions by active tab
  const filteredTransactions = activeStatusTab === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === activeStatusTab);

  // Prepare tabs data
  const statusTabs = [
    { label: 'All Transactions', value: 'all', count: transactions.length },
    { label: 'Pending Review', value: 'new', count: stats.pendingReview.count },
    { label: 'With Finance', value: 'submitted', count: stats.withFinance.count },
    { label: 'Paid', value: 'paid', count: stats.completed.count },
    { label: 'Failed', value: 'failed', count: stats.failed.count },
  ];

  const handleApproveSelected = (ids: string[]) => {
    const toApprove = transactions.filter(t => ids.includes(t.id));
    setTransactionsToApprove(toApprove);
    setIsApproveModalOpen(true);
  };

  const handleApprove = (batchRef: string) => {
    const idsToApprove = transactionsToApprove.map(t => t.id);
    setTransactions(prev => 
      prev.map(t => 
        idsToApprove.includes(t.id) ? { ...t, status: 'submitted' as const, approvedAt: new Date().toISOString() } : t
      )
    );
    setTransactionsToApprove([]);
  };

  const handleMarkCompleted = (id: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: 'paid' as const, processedAt: new Date().toISOString(), notes: 'Transfer successful' } : t
      )
    );
    setIsDrawerOpen(false);
  };

  const handleMarkFailed = (id: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: 'failed' as const, processedAt: new Date().toISOString(), notes: 'Transfer failed' } : t
      )
    );
    setIsDrawerOpen(false);
  };

  const handleUploadResults = (results: Array<{ id: string; status: 'paid' | 'failed'; notes: string }>) => {
    setTransactions(prev =>
      prev.map(t => {
        const result = results.find(r => r.id === t.id);
        return result ? { ...t, status: result.status, notes: result.notes } : t;
      })
    );
  };

  const handleExport = () => {
    const csv = [
      ['Transaction ID', 'Driver Name', 'Phone', 'Redeem Item', 'Points', 'Status', 'Requested At'],
      ...transactions.map(t => [
        t.id,
        t.driver.name,
        t.driver.phone,
        t.redeemItem === 'cash' ? 'Cash Transfer' : 'Mobile Credit',
        t.points.toString(),
        t.status,
        t.requestedAt,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redeem-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDrawerOpen(true);
  };

  return (
    <>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '12px',
            color: 'var(--color-muted-foreground)', cursor: 'default',
          }}>Operations</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>Redeem Transactions</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-24)',
              fontWeight: 700,
              color: 'var(--color-foreground)',
              lineHeight: 1.2,
            }}>
              Redeem Transactions
            </h1>
            <p style={{
              margin: '4px 0 0',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 400,
              color: 'var(--color-muted-foreground)',
            }}>
              Manage driver redemption requests and track their status
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
            >
              <Upload size={15} />
              Upload Results
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: '#7C3AED',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        transactions={filteredTransactions}
        onRowClick={handleRowClick}
        onApproveSelected={handleApproveSelected}
        onMarkCompleted={handleMarkCompleted}
        onMarkFailed={handleMarkFailed}
        onUploadResults={() => setIsUploadModalOpen(true)}
        onExport={handleExport}
        statusTabs={statusTabs}
        activeStatusTab={activeStatusTab}
        onStatusTabChange={setActiveStatusTab}
      />

      {/* Modals and Drawer */}
      <ApproveModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        transactions={transactionsToApprove}
        onApprove={handleApprove}
      />
      <UploadResultsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadResults}
      />
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transaction={selectedTransaction}
        onApprove={(id) => {
          handleApproveSelected([id]);
          setIsDrawerOpen(false);
        }}
        onMarkCompleted={handleMarkCompleted}
        onMarkFailed={handleMarkFailed}
      />
    </>
  );
}