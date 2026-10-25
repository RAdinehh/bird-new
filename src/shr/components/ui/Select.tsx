/** components/ui/Select.tsx */
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  error?: string;
  warn?: string;
}

export function Select({ children, style, error, warn, ...rest }: SelectProps) {
  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';

  return (
    <div style={{
      ...style, // استایل سفارشی به بیرونی‌ترین لایه منتقل شد
      width: '100%', height: 38, background: 'var(--input-bg)',
      border: `1px solid ${borderColor}`, borderRadius: 'var(--r-md)',
      padding: '0 12px', display: 'flex', alignItems: 'center',
      overflow: 'hidden', boxSizing: 'border-box'
    }}>
      <select {...rest} style={{
        flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none',
        outline: 'none', color: 'var(--text)', fontFamily: 'inherit',
        fontSize: 'var(--fs-base)'
      }}>{children}</select>
    </div>
  );
}
