import { useState } from 'react';
import BirdsPage from './BirdsPage';
import BreedsPage from './BreedsPage';

export default function Brd() {
  const [tab, setTab] = useState<'birds' | 'breeds'>('birds');
  return (
    <div>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 12px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11
      }}>
        {(['birds', 'breeds'] as const).map(t => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '11px 14px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color .15s'
            }}
          >
            {t === 'birds' ? 'پرنده‌ها' : 'نژادها'}
            {tab === t && (
              <div style={{
                position: 'absolute', bottom: 0, right: 14, left: 14,
                height: 3, background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            )}
          </div>
        ))}
      </div>
      {tab === 'birds' ? <BirdsPage /> : <BreedsPage />}
    </div>
  );
}
