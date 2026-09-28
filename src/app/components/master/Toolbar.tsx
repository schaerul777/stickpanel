import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { inputStyle } from './styles';

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  showDeleted: boolean;
  onToggleShowDeleted: (v: boolean) => void;
  filters?: ReactNode;
}

export function Toolbar({ search, onSearchChange, searchPlaceholder = 'Search…', showDeleted, onToggleShowDeleted, filters }: ToolbarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      padding: '16px', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)', marginBottom: '16px',
    }}>
      <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)' }} />
        <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder={searchPlaceholder} style={{ ...inputStyle, paddingLeft: 32 }} />
      </div>

      {filters}

      <label style={{
        display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginLeft: 'auto',
        padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-input-background)', boxSizing: 'border-box',
      }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>Show deleted</span>
        <span
          onClick={() => onToggleShowDeleted(!showDeleted)}
          style={{
            width: 34, height: 20, borderRadius: 999, position: 'relative', flexShrink: 0,
            backgroundColor: showDeleted ? '#7C3AED' : 'var(--color-border)', transition: 'background-color 0.15s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: showDeleted ? 16 : 2, width: 16, height: 16, borderRadius: '50%',
            backgroundColor: 'white', transition: 'left 0.15s',
          }} />
        </span>
      </label>
    </div>
  );
}
