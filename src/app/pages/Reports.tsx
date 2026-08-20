import { FileText } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function Reports() {
  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-30)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-foreground)',
          marginBottom: '8px',
        }}>
          Reports
        </h1>
        <p style={{
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)',
          fontWeight: 'var(--font-weight-normal)',
          color: 'var(--color-muted-foreground)',
        }}>
          Generate and view analytics reports for operations and finance
        </p>
      </div>

      <EmptyState
        icon={FileText}
        title="No Reports Available"
        description="Reports and analytics will be generated here to help you track performance, transactions, and campaign metrics."
      />
    </>
  );
}
