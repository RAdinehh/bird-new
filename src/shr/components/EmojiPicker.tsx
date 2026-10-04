import { useState } from 'react';
import { Modal } from './ui';
import { EMOJI_GROUPS } from '../data/emojis';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  title?: string;
}

export default function EmojiPicker({ open, onClose, onPick, title }: Props) {
  const [tab, setTab] = useState(EMOJI_GROUPS[0].id);
  const g = EMOJI_GROUPS.find(x => x.id === tab) || EMOJI_GROUPS[0];
  return (
    <Modal open={open} onClose={onClose} title={title || 'انتخاب آیکن'}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {EMOJI_GROUPS.map(x => (
          <button
            key={x.id}
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
        gap: 4,
        maxHeight: '50vh',
        overflowY: 'auto',
      }}>
        {g.emojis.map(em => (
          <button
            key={em}
            onClick={() => { onPick(em); onClose(); }}
            style={{
              padding: 8,
              fontSize: 22,
              lineHeight: 1,
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
            }}
          >
            {em}
          </button>
        ))}
      </div>
    </Modal>
  );
}
