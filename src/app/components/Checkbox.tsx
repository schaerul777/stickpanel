import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onChange(!checked);
        }
      }}
      style={{
        width: '18px',
        height: '18px',
        borderRadius: 'var(--radius-sm)',
        border: checked ? '2px solid #7C3AED' : '2px solid var(--color-border)',
        backgroundColor: checked ? '#7C3AED' : 'var(--color-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !checked) {
          e.currentTarget.style.borderColor = '#7C3AED';
          e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !checked) {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-card)';
        }
      }}
    >
      {checked && (
        <Check 
          size={14} 
          color="white" 
          strokeWidth={3}
        />
      )}
    </div>
  );
}