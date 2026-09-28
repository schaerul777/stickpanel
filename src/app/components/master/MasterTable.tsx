import type { ReactNode, CSSProperties } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { secondaryButtonStyle } from './styles';

export interface MasterColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render: (row: T) => ReactNode;
}

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface MasterTableProps<T> {
  columns: MasterColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  emptyState?: EmptyStateConfig;
  rowStyle?: (row: T) => CSSProperties;
}

const th: CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-family-geist)',
  fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)',
  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
};

const td: CSSProperties = {
  padding: '14px 16px', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
  color: 'var(--color-foreground)', borderBottom: '1px solid var(--color-border)',
};

export function MasterTable<T>({
  columns, rows, getRowId, loading, page, pageSize, total, onPageChange,
  sortKey, sortDir, onSortChange, emptyState, rowStyle,
}: MasterTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div style={{
      backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>
          Showing {total > 0 ? startIndex : 0}-{endIndex} of {total.toLocaleString()} items
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
              {columns.map(col => (
                <th key={col.key} style={{ ...th, width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={() => col.sortable && onSortChange?.(col.key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                        : <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                {columns.map(col => (
                  <td key={col.key} style={td}>
                    <div style={{ height: 14, borderRadius: 4, backgroundColor: 'var(--color-secondary)', width: '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && rows.length === 0 && emptyState && (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0, borderBottom: 'none' }}>
                  <EmptyState icon={emptyState.icon} title={emptyState.title} description={emptyState.description} />
                  {emptyState.actionLabel && emptyState.onAction && (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 32 }}>
                      <button onClick={emptyState.onAction} style={{ ...secondaryButtonStyle, borderColor: '#7C3AED', color: '#7C3AED' }}>
                        {emptyState.actionLabel}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {!loading && rows.map(row => (
              <tr key={getRowId(row)} style={rowStyle?.(row)}>
                {columns.map(col => (
                  <td key={col.key} style={td}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{ ...secondaryButtonStyle, padding: '6px 10px', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{ ...secondaryButtonStyle, padding: '6px 10px', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
