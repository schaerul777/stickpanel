import type { CSSProperties } from 'react';

export const inputStyle: CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-background)',
  color: 'var(--color-foreground)', fontFamily: 'var(--font-family-geist)',
  fontSize: 'var(--text-14)', outline: 'none', boxSizing: 'border-box',
};

// Native <select> with a custom chevron so we control the gap between the
// arrow and the box edge — the browser-default arrow sits flush against the
// padding with no breathing room after it.
export const selectStyle: CSSProperties = {
  ...inputStyle,
  paddingRight: 34,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2714%27 height=%2714%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23737373%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '14px',
  cursor: 'pointer',
};

export const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 700,
  color: 'var(--color-foreground)', display: 'block', marginBottom: 5,
};

export const helperStyle: CSSProperties = {
  fontFamily: 'var(--font-family-geist)', fontSize: '12px',
  color: 'var(--color-muted-foreground)', marginTop: 4,
};

export const errorTextStyle: CSSProperties = {
  fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#EF4444', marginTop: 4,
};

export const primaryButtonStyle: CSSProperties = {
  padding: '9px 16px', borderRadius: 'var(--radius)', border: 'none',
  backgroundColor: '#7C3AED', color: 'white', fontFamily: 'var(--font-family-geist)',
  fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.15s',
};

export const secondaryButtonStyle: CSSProperties = {
  padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)',
  fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.15s',
};

export const dangerButtonStyle: CSSProperties = {
  padding: '9px 16px', borderRadius: 'var(--radius)', border: 'none',
  backgroundColor: '#EF4444', color: 'white', fontFamily: 'var(--font-family-geist)',
  fontSize: 'var(--text-14)', fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '7px',
};

export function withHoverBg(base: string, hover: string) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = hover; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = base; },
  };
}
