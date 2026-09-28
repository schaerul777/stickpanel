interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  helperText?: string;
}

export function Switch({ checked, onChange, label, helperText }: SwitchProps) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <span
          onClick={() => onChange(!checked)}
          style={{
            width: 34, height: 20, borderRadius: 999, position: 'relative', flexShrink: 0,
            backgroundColor: checked ? '#7C3AED' : 'var(--color-border)', transition: 'background-color 0.15s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: checked ? 16 : 2, width: 16, height: 16, borderRadius: '50%',
            backgroundColor: 'white', transition: 'left 0.15s',
          }} />
        </span>
        {label && <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-foreground)' }}>{label}</span>}
      </label>
      {helperText && <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: 4 }}>{helperText}</div>}
    </div>
  );
}
