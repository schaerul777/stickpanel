import { Database, ShieldCheck } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { CORE_META, type CoreId } from '../core/coreConfig';

interface CorePlaceholderPageProps {
  core: CoreId;
  section: 'Master' | 'Account';
}

const SECTION_ICON = { Master: Database, Account: ShieldCheck };

export function CorePlaceholderPage({ core, section }: CorePlaceholderPageProps) {
  const coreLabel = CORE_META[core].label;
  const Icon = SECTION_ICON[section];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
            {coreLabel}
          </span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>
            {section}
          </span>
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-24)',
          fontWeight: 700,
          color: 'var(--color-foreground)',
          lineHeight: 1.2,
        }}>
          {section}
        </h1>
      </div>

      <EmptyState
        icon={Icon}
        title={`No ${section.toLowerCase()} data yet`}
        description={`${section} data for ${coreLabel} will be available here`}
      />
    </div>
  );
}
