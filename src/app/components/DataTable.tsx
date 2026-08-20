import { useState } from 'react';
import { Search, Check, X as XIcon, Upload, Download, RotateCcw } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { StatusTabs } from './StatusTabs';
import { DateRangePicker } from './DateRangePicker';
import { Checkbox } from './Checkbox';

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
  processedAt?: string;
}

interface StatusTab {
  label: string;
  value: string;
  count: number;
}

interface DataTableProps {
  transactions: Transaction[];
  onRowClick: (transaction: Transaction) => void;
  onApproveSelected: (ids: string[]) => void;
  onMarkCompleted: (id: string) => void;
  onMarkFailed: (id: string) => void;
  onUploadResults: () => void;
  onExport: () => void;
  statusTabs: StatusTab[];
  activeStatusTab: string;
  onStatusTabChange: (value: string) => void;
}

export function DataTable({
  transactions,
  onRowClick,
  onApproveSelected,
  onMarkCompleted,
  onMarkFailed,
  onUploadResults,
  onExport,
  statusTabs,
  activeStatusTab,
  onStatusTabChange,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driver.phone.includes(searchQuery);
    
    const matchesDateRange = (!dateRange.start && !dateRange.end) ||
      (dateRange.start && dateRange.end && 
        new Date(t.requestedAt) >= new Date(dateRange.start) &&
        new Date(t.requestedAt) <= new Date(dateRange.end));
    
    return matchesSearch && matchesDateRange;
  });

  const totalItems = filteredTransactions.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const hasActiveFilters = searchQuery !== '' || dateRange.start !== '' || dateRange.end !== '';

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = filteredTransactions.filter(t => t.status === 'new').map(t => t.id);
      setSelectedIds(new Set(newIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectedTransactions = Array.from(selectedIds).map(id => 
    transactions.find(t => t.id === id)
  ).filter(Boolean) as Transaction[];

  const selectedTotalValue = selectedTransactions.reduce((sum, t) => sum + t.points, 0);

  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      {/* Status Tabs - Full Width */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ padding: '0 24px' }}>
          <StatusTabs
            tabs={statusTabs}
            activeTab={activeStatusTab}
            onTabChange={onStatusTabChange}
          />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted-foreground)',
            }} />
            <input
              type="text"
              placeholder="Search by ID, driver name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-input-background)',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                color: 'var(--color-foreground)',
              }}
            />
          </div>

          {/* Date Range Filter and Clear Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Date Range */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />

            {/* Clear/Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-card)';
                }}
              >
                <RotateCcw size={16} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Count Info */}
      <div style={{ 
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)',
          fontWeight: 'var(--font-weight-normal)',
          color: 'var(--color-muted-foreground)',
        }}>
          Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems.toLocaleString()} items
        </span>
      </div>

      {/* Selection Banner */}
      {selectedIds.size > 0 && (
        <div style={{
          padding: '12px 24px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-geist)',
            fontSize: 'var(--text-14)',
            fontWeight: 'var(--font-weight-medium)',
            color: '#3B82F6',
          }}>
            {selectedIds.size} selected • Total: {formatIDR(selectedTotalValue)}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                backgroundColor: 'transparent',
                color: '#3B82F6',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={() => onApproveSelected(Array.from(selectedIds))}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: '#7C3AED',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Approve {selectedIds.size} →
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--color-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
                width: '40px',
              }}>
                <Checkbox
                  onChange={handleSelectAll}
                  checked={selectedIds.size > 0 && selectedIds.size === filteredTransactions.filter(t => t.status === 'new').length}
                />
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Transaction ID
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Driver
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Redeem Item
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Points
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Status
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Requested At
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-family-geist)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-muted-foreground)',
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => onRowClick(transaction)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td
                  style={{ padding: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {transaction.status === 'new' && (
                    <Checkbox
                      checked={selectedIds.has(transaction.id)}
                      onChange={() => handleSelectRow(transaction.id)}
                    />
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#3B82F6',
                  }}>
                    {transaction.id}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-foreground)',
                    }}>
                      {transaction.driver.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-muted-foreground)',
                    }}>
                      {transaction.driver.phone}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--color-foreground)',
                  }}>
                    {transaction.redeemItem === 'cash' ? '🏦 Cash Transfer' : '📱 Mobile Credit'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                  }}>
                    {transaction.points.toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <StatusBadge status={transaction.status} />
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--color-muted-foreground)',
                  }}>
                    {new Date(transaction.requestedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </td>
                <td
                  style={{ padding: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {transaction.status === 'new' && (
                    <button
                      onClick={() => onApproveSelected([transaction.id])}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid #3B82F6',
                        backgroundColor: 'transparent',
                        color: '#3B82F6',
                        fontFamily: 'var(--font-family-geist)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {transaction.status === 'submitted' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onMarkCompleted(transaction.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius)',
                          border: '1px solid #22C55E',
                          backgroundColor: 'transparent',
                          color: '#22C55E',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => onMarkFailed(transaction.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius)',
                          border: '1px solid #EF4444',
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  )}
                  {(transaction.status === 'paid' || transaction.status === 'failed') && (
                    <span style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: '12px',
                      color: 'var(--color-muted-foreground)',
                    }}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}