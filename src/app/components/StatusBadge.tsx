type Status = 'new' | 'submitted' | 'paid' | 'failed';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig = {
  new: {
    label: 'New',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  submitted: {
    label: 'With Finance',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  paid: {
    label: 'Paid',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  failed: {
    label: 'Failed',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new; // Fallback to 'new' if status is invalid

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '999px',
      backgroundColor: config.bgColor,
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: config.color,
      }} />
      <span style={{
        fontFamily: 'var(--font-family-geist)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-medium)',
        color: config.color,
      }}>
        {config.label}
      </span>
    </div>
  );
}