import { useState } from 'react';
import ItemsPage from './ItemsPage';
import MovesPage from './MovesPage';
import WarningsPage from './WarningsPage';
import { useWhs, stockWarning, expiryWarning } from './store';
import { toFa } from '../../shr/utils/fa';

const tabs = [
  { id: 'items', label: 'اقلام' },
  { id: 'moves', label: 'ورود/خروج' },
  { id: 'warnings', label: 'هشدارها' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function Whs() {
  const [tab, setTab] = useState<TabId>('items');
  const { items } = useWhs();

  const warnCount = items.filter(i =>
    stockWarning(i) !== 'ok' || expiryWarning(i) !== 'ok'
  ).length;

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
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            {t.label}
            {t.id === 'warnings' && warnCount > 0 ? (
              <span style={{
                fontSize: 12,
                background: 'var(--danger)',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: 8,
                fontWeight: 700
              }}>{toFa(warnCount)}</span>
            ) : null}
            {tab === t.id ? (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 12, left: 12, height: 36.5,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0'
              }} />
            ) : null}
          </div>
        ))}
      </div>

      {tab === 'items' ? <ItemsPage /> : null}
      {tab === 'moves' ? <MovesPage /> : null}
      {tab === 'warnings' ? <WarningsPage /> : null}
    </div>
  );
}
