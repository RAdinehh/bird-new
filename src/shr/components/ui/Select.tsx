/** components/ui/Select.tsx */
import React from 'react';

export function Select({ children, style, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', height: 38, background: 'var(--input-bg)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
      padding: '0 12px', display: 'flex', alignItems: 'center', overflow: 'hidden'
    }}>
      <select {...rest} style={{
        flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none',
        outline: 'none', color: 'var(--text)', fontFamily: 'inherit',
        fontSize: 'var(--fs-base)', ...style
      }}>{children}</select>
    </div>
  );
}
