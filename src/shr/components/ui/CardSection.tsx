import type { ReactNode } from 'react';
import { SectionTitle } from './Layout';

interface CardSectionProps {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  first?: boolean;
}

export function CardSection({ title, meta, children, first }: CardSectionProps) {
  return (
    <>
      <SectionTitle first={first}>
        {title}
        {meta && (
          <span style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--muted)',
            fontWeight: 600,
            letterSpacing: 0,
            marginRight: 6,
          }}>
            {meta}
          </span>
        )}
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        {children}
      </div>
    </>
  );
}
