import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
      }}>
        <Icon size={36} style={{ color: 'var(--color-muted-foreground)' }} />
      </div>
      <h2 style={{
        fontFamily: 'var(--font-family-geist)',
        fontSize: 'var(--text-24)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-foreground)',
        marginBottom: '12px',
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: 'var(--font-family-geist)',
        fontSize: 'var(--text-16)',
        fontWeight: 'var(--font-weight-normal)',
        color: 'var(--color-muted-foreground)',
        maxWidth: '480px',
      }}>
        {description}
      </p>
    </div>
  );
}
