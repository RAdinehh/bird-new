/** components/ui/Btn.tsx */
import React, { forwardRef } from 'react';

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'outline';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'md' | 'sm';
  full?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(({  variant = 'ghost', size = 'md', full, style, children, icon, loading, disabled, ...rest  }, ref) => {
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--avatar-text)' },
    ghost: { background: 'var(--btn-bg)', color: 'var(--muted)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: '#fff' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }
  };
  const isDisabled = disabled || loading;
  return (
    <button ref={ref} {...rest} disabled={isDisabled} style={{
      height: size === 'sm' ? 32 : 38,
      padding: size === 'sm' ? '0 12px' : '0 16px',
      borderRadius: 'var(--r-md)', fontFamily: 'inherit',
      fontSize: size === 'sm' ? 'var(--fs-sm)' : 'var(--fs-base)',
      fontWeight: 600,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.55 : 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: full ? '100%' : undefined,
      ...variants[variant], ...style
    }}>
      {loading ? <span style={{ display: 'inline-flex' }}>⏳</span> : icon ? <span style={{ display: 'inline-flex' }}>{icon}</span> : null}
      {children}
    </button>
  );
});
Btn.displayName = 'Btn';
export function BtnRow({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-2)', width: '100%' }}>
      {items.map((child, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
                style: { flex: 1, ...((child as React.ReactElement<{ style?: React.CSSProperties }>).props.style || {}) },
              })
            : child}
        </div>
      ))}
    </div>
  );
}
export function DeleteBtn({ onClick, title = 'حذف', size = 'md' }: {
  onClick: () => void; title?: string; size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 44 : 44;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger)',
        color: 'var(--danger)',
        cursor: 'pointer',
        borderRadius: 'var(--r-sm)',
        width: dim,
        height: dim,
        minWidth: dim,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'sm' ? 11 : 13,
        lineHeight: 1,
        padding: 0,
        flexShrink: 0,
        fontFamily: 'inherit',
        fontWeight: 700,
      }}
    >
      ✕
    </button>
  );
}
