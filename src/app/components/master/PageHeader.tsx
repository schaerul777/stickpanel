import type { ReactNode } from 'react';
import { CORE_META, type CoreId } from '../../core/coreConfig';

interface PageHeaderProps {
  core: CoreId;
  trail: string[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ core, trail, title, subtitle, actions }: PageHeaderProps) {
  const crumbs = [CORE_META[core].label, ...trail];
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {crumbs.map((label, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>}
            <span style={{
              fontFamily: 'var(--font-family-geist)', fontSize: '12px',
              color: i === crumbs.length - 1 ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
              fontWeight: i === crumbs.length - 1 ? 500 : 400,
            }}>
              {label}
            </span>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-24)',
            fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '4px 0 0', fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)',
              fontWeight: 400, color: 'var(--color-muted-foreground)',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}
