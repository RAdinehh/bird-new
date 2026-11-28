import { useState } from 'react';
import { Modal } from './ui';
import { OptionIcon } from './OptionIcon';
import { ICON_KEYS, type AppIconKey } from '../icons/AppIcons';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (iconKey: string) => void;
  title?: string;
}

const GROUPS: { id: string; name: string; icon: AppIconKey; keys: AppIconKey[] }[] = [
  {
    id: 'bird',
    name: 'پرنده و تخم',
    icon: 'chicken',
    keys: ['chicken', 'duck', 'turkey', 'egg', 'fertile_egg', 'broken_egg', 'soft_egg', 'dirty_egg', 'rotten_egg', 'incubator', 'candling', 'hatch'],
  },
  {
    id: 'feed',
    name: 'خوراک و آب',
    icon: 'feed',
    keys: ['feed', 'corn', 'wheat', 'barley', 'bran', 'soybean_meal', 'canola_meal', 'sunflower_meal', 'sesame_meal', 'fish_meal', 'alfalfa', 'oil', 'premix', 'water'],
  },
  {
    id: 'health',
    name: 'سلامت و محیط',
    icon: 'meds',
    keys: ['meds', 'herbal', 'mortality', 'climate', 'ventilation', 'lighting', 'cooling', 'heating', 'litter'],
  },
  {
    id: 'equip',
    name: 'تجهیزات و انبار',
    icon: 'equipment',
    keys: ['equipment', 'inventory', 'feeder', 'drinker', 'hall', 'zone', 'cage', 'weighing', 'bag', 'vial', 'liquid', 'dose', 'pack'],
  },
  {
    id: 'finance',
    name: 'مالی و گزارش',
    icon: 'cash',
    keys: ['cash', 'invoice', 'payment_promise', 'profit_trend', 'stats', 'target', 'compare', 'alert_bell', 'alert_info', 'alert_critical', 'reminder', 'daily_log', 'contact_user'],
  },
];

export default function EmojiPicker({ open, onClose, onPick, title }: Props) {
  const [tab, setTab] = useState(GROUPS[0].id);
  const g = GROUPS.find(x => x.id === tab) || GROUPS[0];
  const validKeys = g.keys.filter(k => ICON_KEYS.includes(k));

  return (
    <Modal open={open} onClose={onClose} title={title || 'انتخاب آیکون'}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {GROUPS.map(x => (
          <button
            type="button"
            key={x.id}
            onClick={() => setTab(x.id)}
            title={x.name}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid ' + (tab === x.id ? 'var(--accent-border)' : 'var(--border)'),
              background: tab === x.id ? 'var(--accent-soft)' : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <OptionIcon icon={x.icon} size={18} />
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
        {validKeys.map(k => (
          <button
            type="button"
            key={k}
            title={k}
            onClick={() => { onPick(k); onClose(); }}
            style={{
              padding: 8,
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <OptionIcon icon={k} size={22} />
          </button>
        ))}
      </div>
    </Modal>
  );
}
