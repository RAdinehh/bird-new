import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toFa } from '../../utils/fa';

export interface BadgeItem {
  key: string;
  node: React.ReactNode;
}

interface Props {
  badges: BadgeItem[];
  max?: number;
  modalTitle?: string;
}

export function BadgeOverflow({ badges, max = 2, modalTitle = 'برچسب‌ها' }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = badges.slice(0, max);
  const hidden = badges.slice(max);

  return (
    <>
      {visible.map(b => <span key={b.key}>{b.node}</span>)}
      {hidden.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
          title={'نمایش ' + toFa(hidden.length) + ' برچسب دیگر'}
          aria-label={'نمایش ' + toFa(hidden.length) + ' برچسب دیگر'}
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 7px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontSize: 10, fontWeight: 700,
            color: 'var(--muted)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          +{toFa(hidden.length)}
        </button>
      )}
      {showAll && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowAll(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 5000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-solid)',
              borderRadius: 'var(--r-lg)',
              padding: 16,
              maxWidth: 360, width: '100%',
              maxHeight: '80vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)' }}>{modalTitle}</div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                aria-label="بستن"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)', fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
              onClickCapture={() => setShowAll(false)}
            >
              {badges.map(b => <span key={b.key}>{b.node}</span>)}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
