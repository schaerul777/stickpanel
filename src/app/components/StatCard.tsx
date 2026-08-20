interface StatCardProps {
  title: string;
  count: number;
  value: number;
  color: string;
}

export function StatCard({ title, count, value, color }: StatCardProps) {
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--elevation-sm)',
    }}>
      <div style={{
        fontFamily: 'var(--font-family-geist)',
        fontSize: 'var(--text-14)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-muted-foreground)',
        marginBottom: '12px',
      }}>
        {title}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '12px',
        marginBottom: '8px',
      }}>
        <div style={{
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-30)',
          fontWeight: 'var(--font-weight-semibold)',
          color: color,
        }}>
          {count}
        </div>
        <div style={{
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)',
          fontWeight: 'var(--font-weight-normal)',
          color: 'var(--color-muted-foreground)',
        }}>
          requests
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-family-geist)',
        fontSize: 'var(--text-16)',
        fontWeight: 'var(--font-weight-medium)',
        color: '#22C55E',
      }}>
        {formatIDR(value)}
      </div>
    </div>
  );
}
