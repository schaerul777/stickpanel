type Tone = 'success' | 'neutral' | 'danger' | 'warning';

const TONE_STYLES: Record<Tone, { bg: string; color: string }> = {
  success: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  neutral: { bg: 'var(--color-secondary)', color: 'var(--color-muted-foreground)' },
  danger:  { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
  warning: { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
};

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const s = TONE_STYLES[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600,
      backgroundColor: s.bg, color: s.color,
      fontFamily: 'var(--font-family-geist)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
