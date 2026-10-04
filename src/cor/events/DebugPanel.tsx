/**
 * DebugPanel.tsx — نمایش زنده‌ی Event Bus (فقط dev)
 *
 * فعال‌سازی: localhost:3000/?debug=bus
 */
import { useState, useEffect } from 'react';
import { bus } from './bus';
import type { BusHistoryEntry } from './types';

export default function DebugPanel() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'bus') {
        setActive(true);
        bus.setDevMode(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTick(x => x + 1), 500);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  const history = bus.getHistory();
  const listeners = bus.getListeners();
  const filtered = filter
    ? history.filter(h => h.event.includes(filter) || h.meta.source.includes(filter))
    : history;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 100, left: 10, zIndex: 500,
          padding: '8px 12px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 11,
          fontWeight: 700, cursor: 'pointer',
        }}
      >
        🐛 Bus ({history.length})
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.85)', color: '#fff',
      fontFamily: 'monospace', fontSize: 11,
      display: 'flex', flexDirection: 'column',
      direction: 'ltr',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <strong style={{ fontSize: 13 }}>🐛 Event Bus Debug</strong>
        <span style={{ opacity: 0.7 }}>({history.length} events)</span>
        <span style={{ opacity: 0.7 }}>·</span>
        <span style={{ opacity: 0.7 }}>{listeners.length} listeners</span>
        <div style={{ flex: 1 }} />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="filter..."
          style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
            padding: '4px 8px', fontFamily: 'inherit', fontSize: 11,
            outline: 'none', width: 140,
          }}
        />
        <button
          type="button"
          onClick={() => bus.clearHistory()}
          style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: 'none', borderRadius: 6, padding: '4px 8px',
            fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
          }}
        >clear</button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            background: 'transparent', color: '#fff',
            border: 'none', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }}
        >✕</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {filtered.length === 0 ? (
          <div style={{ opacity: 0.5, padding: 20, textAlign: 'center' }}>
            No events yet. Do something in the app.
          </div>
        ) : (
          filtered.map((h, i) => (
            <EventRow key={i} entry={h} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.15)',
        opacity: 0.6, fontSize: 10,
      }}>
        💡 activate: ?debug=bus · click 🐛 button to reopen
      </div>
    </div>
  );
}

function EventRow({ entry }: { entry: BusHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const t = new Date(entry.meta.timestamp);
  const time = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
  const hasErr = entry.errors && entry.errors.length > 0;

  return (
    <div style={{
      marginBottom: 4, borderLeft: `3px solid ${hasErr ? '#f87171' : '#60a5fa'}`,
      paddingLeft: 8, cursor: 'pointer',
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ opacity: 0.6 }}>{time}</span>
        <span style={{ color: '#60a5fa', fontWeight: 700 }}>{entry.event}</span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>·{entry.meta.source}</span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>·{entry.meta.handlerCount} handlers</span>
        {entry.meta.duration !== undefined && (
          <span style={{ opacity: 0.5, fontSize: 10 }}>·{entry.meta.duration.toFixed(1)}ms</span>
        )}
        {hasErr && <span style={{ color: '#f87171', fontWeight: 700 }}>ERROR</span>}
        <div style={{ flex: 1 }} />
        <span style={{ opacity: 0.5, fontSize: 10 }}>{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <pre style={{
          margin: '4px 0 8px 0', padding: '6px 8px',
          background: 'rgba(255,255,255,0.05)', borderRadius: 4,
          fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
{JSON.stringify({ data: entry.data, traceId: entry.meta.traceId, handlers: entry.listenerIds, errors: entry.errors }, null, 2)}
        </pre>
      )}
    </div>
  );
}
