import { useState } from 'react';
import { EMOJI_GROUPS } from '../data/emojis';

interface Props {
  onPick: (emoji: string) => void;
  value?: string;
}

export default function EmojiGrid({ onPick, value }: Props) {
  const [tab, setTab] = useState(EMOJI_GROUPS[0].id);
  const g = EMOJI_GROUPS.find(x => x.id === tab) || EMOJI_GROUPS[0];
  return (
    <>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {EMOJI_GROUPS.map(x => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            title={x.name}
            style={{
              padding: '6px 10px',
              fontSize: 18,
              borderRadius: 'var(--r-sm)',
              border: '1px solid ' + (tab === x.id ? 'var(--accent-border)' : 'var(--border)'),
              background: tab === x.id ? 'var(--accent-soft)' : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {x.icon}
          </button>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
        gap: 4,
      }}>
        {g.emojis.map(em => {
          const selected = value === em;
          return (
            <button
              key={em}
              type="button"
              onClick={() => onPick(em)}
              style={{
                padding: 8,
                fontSize: 22,
                lineHeight: 1,
                background: selected ? 'var(--accent-soft)' : 'var(--input-bg)',
                border: '1px solid ' + (selected ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
              }}
            >
              {em}
            </button>
          );
        })}
      </div>
    </>
  );
}
