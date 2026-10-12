/**
 * CategoryPicker — انتخاب دسته‌ی تجهیز (Bottom Sheet + Portal)
 */
import { createPortal } from 'react-dom';
import { CategoryIcon, CATEGORY_COLORS } from '../../../shr/icons/equipment';
import { CATEGORY_LABELS } from '../store';
import { ALL_CATS } from '../_equipHelpers';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (cat: string) => void;
  grouped: Record<string, any[]>;
}

export default function CategoryPicker({ open, onClose, onPick, grouped }: Props) {
  if (!open) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="افزودن دسته تجهیز"
      data-sheet-open="true"
      onClick={onClose}
      onPointerDownCapture={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
      onTouchStartCapture={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMoveCapture={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'var(--overlay)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        touchAction: 'none', overscrollBehavior: 'contain',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card-solid)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: '100%', maxWidth: 540, maxHeight: '70vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 'var(--r-sm)', background: 'var(--border)' }} />
        </div>
        <div style={{
          padding: '8px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>افزودن دسته تجهیز</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>کدام دسته؟</div>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن" style={{
            width: 40, height: 40, borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--muted)', fontSize: 'var(--fs-md)', cursor: 'pointer',
          }}>✕</button>
        </div>
        <div
          onPointerDownCapture={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onTouchStartCapture={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onTouchMoveCapture={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          style={{
            padding: 'var(--sp-3)', overflowY: 'auto', flex: 1,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}>
          {ALL_CATS.map(cat => {
            const color = (CATEGORY_COLORS as any)[cat] || 'var(--cat-auxiliary)';
            const soft = (CATEGORY_COLORS as any)[cat + '-soft'] || 'var(--input-bg)';
            const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
            const count = (grouped[cat] || []).length;
            return (
              <button key={cat} type="button" onClick={() => onPick(cat)} style={{
                width: '100%', padding: '10px 12px', minHeight: 52,
                background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
                fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right',
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: soft, color,
                }}>
                  <CategoryIcon category={cat} size={18} weight="duotone" color={color} />
                </span>
                <span style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                {count > 0 && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{toFa(count)} مورد</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
