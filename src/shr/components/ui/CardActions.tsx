import { useState } from 'react';
import { Btn } from './index';
import { ActionMenu } from './ActionMenu';

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'subtle' | 'danger-outline';
  hidden?: boolean;
  disabled?: boolean;
  /** وزن دکمه برای مرتب‌سازی هوشمند (کمتر = جلوتر) */
  priority?: number;
  /** نام گروه: دکمه‌هایی که هم‌گروهند هرگز از هم جدا نمی‌شوند (همیشه با هم در ردیف اصلی یا با هم در «بیشتر») */
  group?: string;
}

function getLayout(total: number): { cols: number[][]; visible: number; more: number } {
  if (total === 0) return { cols: [], visible: 0, more: 0 };
  if (total === 1) return { cols: [[1]], visible: 1, more: 0 };
  if (total === 2) return { cols: [[2]], visible: 2, more: 0 };
  if (total === 3) return { cols: [[3]], visible: 3, more: 0 };
  if (total === 4) return { cols: [[3], [1]], visible: 4, more: 0 };
  if (total === 5) return { cols: [[3], [2]], visible: 5, more: 0 };
  if (total === 6) return { cols: [[3], [3]], visible: 6, more: 0 };
  return { cols: [[3], [3]], visible: 6, more: total - 6 };
}

export function CardActions({ actions }: { actions: CardAction[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // 🆕 مرتب‌سازی هوشمند بر اساس وزن (اولویت) و نوع دکمه
  const getPriority = (a: CardAction) => {
    if (a.priority !== undefined) return a.priority;
    if (a.variant === 'danger' || a.variant === 'danger-outline') return 99; // مخرب‌ها همیشه آخر
    if (a.variant === 'primary') return 10; // اقدامات اصلی اول
    if (a.variant === 'subtle') return 50;  // اقدامات کم‌اهمیت‌تر
    return 20; // outline (پیش‌فرض)
  };

  // ۱. فیلتر دکمه‌های مخفی
  const visible = actions.filter(a => !a.hidden);
  if (visible.length === 0) return null;

  // ۲. گروه‌بندی
  const groups = new Map<string, CardAction[]>();
  const singles: CardAction[] = [];

  visible.forEach(a => {
    if (a.group) {
      if (!groups.has(a.group)) groups.set(a.group, []);
      groups.get(a.group)!.push(a);
    } else {
      singles.push(a);
    }
  });

  // ۳. ساخت واحدهای قابل مرتب‌سازی (تک دکمه‌ها یا گروه‌ها)
  const units = [
    ...singles.map(a => ({ items: [a], weight: getPriority(a) })),
    ...Array.from(groups.values()).map(grp => ({
      items: grp,
      weight: Math.min(...grp.map(getPriority))
    }))
  ];

  // ۴. مرتب‌سازی واحدها
  units.sort((a, b) => a.weight - b.weight);

  // ۵. محاسبه حد مجاز دکمه‌های قابل نمایش
  const theoreticalLayout = getLayout(visible.length);
  const maxVisible = theoreticalLayout.visible;

  // ۶. تخصیص واحدها به ردیف اصلی یا منوی بیشتر (با حفظ گروه‌ها)
  const mainActions: CardAction[] = [];
  const hiddenActions: CardAction[] = [];

  for (const unit of units) {
    if (mainActions.length + unit.items.length <= maxVisible) {
      mainActions.push(...unit.items);
    } else {
      hiddenActions.push(...unit.items);
    }
  }

  // ۷. چیدمان نهایی بر اساس تعداد واقعی دکمه‌های اصلی
  const layout = getLayout(mainActions.length);
  const rows: CardAction[][] = [];
  let idx = 0;
  for (const rowCols of layout.cols) {
    const count = rowCols[0];
    rows.push(mainActions.slice(idx, idx + count));
    idx += count;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingTop: 'var(--sp-2)', width: '100%' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(' + row.length + ', 1fr)', gap: 'var(--sp-2)' }}>
            {row.map((action, i) => (
              <Btn
                key={i}
                size="sm"
                variant={action.variant || 'outline'}
                disabled={action.disabled}
                onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                style={{ width: '100%', justifyContent: 'center', padding: '8px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {action.label}
              </Btn>
            ))}
          </div>
        ))}
        {hiddenActions.length > 0 && (
          <Btn
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '8px 4px', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: 'var(--info)',
              borderColor: 'var(--accent)'
            }}
          >
            بیشتر
          </Btn>
        )}
      </div>
      <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={hiddenActions} />
    </>
  );
}
