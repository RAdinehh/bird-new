import type { ReactNode } from 'react';

export function FieldsGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 8px',
    }}>
      {children}
    </div>
  );
}
