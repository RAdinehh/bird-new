/**
 * index.tsx — بخش fed
 */
import { useState } from 'react';
import { useCarousel } from '../../shr/hooks/useCarousel';
import IngredientsPage from './IngredientsPage';
import RequirementsPage from './RequirementsPage';
import FormulasPage from './FormulasPage';

const tabs = [
  { id: 'ingredients', label: 'مواد اولیه' },
  { id: 'requirements', label: 'نیازها' },
  { id: 'formulas', label: 'جیره‌ها' }
] as const;

type TabId = typeof tabs[number]['id'];

const TAB_IDS = ['ingredients', 'requirements', 'formulas'];

export default function Fed() {
  const [tab, setTab] = useState<TabId>('ingredients');
  const { containerRef, trackRef, setInstant } = useCarousel(
    TAB_IDS,
    tab,
    (id) => setTab(id as TabId)
  );

  return (
    <div>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 8px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => { setInstant(); setTab(t.id); }}
            style={{
              padding: '11px 12px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            {tab === t.id ? (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 12, left: 12, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0',
              }} />
            ) : null}
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          width: '100%',
          minHeight: 'calc(100vh - 120px)',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            touchAction: 'pan-y',
          }}
        >
          <div key="ingredients" style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <IngredientsPage />
          </div>
          <div key="requirements" style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <RequirementsPage />
          </div>
          <div key="formulas" style={{ minWidth: '100%', flexShrink: 0, direction: 'rtl', contain: 'layout paint' }}>
            <FormulasPage />
          </div>
        </div>
      </div>
    </div>
  );
}
