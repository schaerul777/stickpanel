import { Handshake } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { CORE_META } from '../core/coreConfig';
import { useCore } from '../core/CoreContext';

export function Deal() {
  const { activeCore } = useCore();
  return (
    <div style={{ fontFamily: 'var(--font-family-geist)', maxWidth: '100%' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
          {CORE_META[activeCore].label} / Deal Testing / Deal
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>
          Deal
        </h1>
      </div>

      <EmptyState
        icon={Handshake}
        title="Nothing here yet"
        description="Deals will appear here once available."
      />
    </div>
  );
}
