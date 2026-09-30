import { useState } from 'react';
import IngredientsPage from './IngredientsPage';
import RequirementsPage from './RequirementsPage';
import FormulasPage from './FormulasPage';

const tabs = [
  { id: 'ingredients', label: 'مواد اولیه' },
  { id: 'requirements', label: 'نیازها' },
  { id: 'formulas', label: 'جیره‌ها' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Fed() {
  const [tab, setTab] = useState<TabId>('ingredients');

  return (
    <div>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 8px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
        overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '11px 12px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
            {tab === t.id ? (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 12, left: 12, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            ) : null}
          </div>
        ))}
      </div>

      {tab === 'ingredients' ? <IngredientsPage /> : null}
      {tab === 'requirements' ? <RequirementsPage /> : null}
      {tab === 'formulas' ? <FormulasPage /> : null}
    </div>
  );
}
