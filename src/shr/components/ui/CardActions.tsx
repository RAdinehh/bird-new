import { useState } from 'react';
import { Btn } from './index';
import { ActionMenu } from './ActionMenu';

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'subtle' | 'danger-outline';
  hidden?: boolean;
  disabled?: boolean;
}

function getLayout(total: number): { cols: number[][]; visible: number; more: number } {
  if (total === 0) return { cols: [], visible: 0, more: 0 };
  if (total === 1) return { cols: [[1]], visible: 1, more: 0 };
  if (total === 2) return { cols: [[2]], visible: 2, more: 0 };
  if (total === 3) return { cols: [[3]], visible: 3, more: 0 };
  if (total === 4) return { cols: [[2], [2]], visible: 4, more: 0 };
  if (total === 5) return { cols: [[3], [2]], visible: 5, more: 0 };
  if (total === 6) return { cols: [[3], [3]], visible: 6, more: 0 };
  return { cols: [[3], [3]], visible: 6, more: total - 6 };
}

export function CardActions({ actions }: { actions: CardAction[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleActions = actions.filter(a => !a.hidden);
  if (visibleActions.length === 0) return null;

  const layout = getLayout(visibleActions.length);
  const mainActions = visibleActions.slice(0, layout.visible);
  const hiddenActions = visibleActions.slice(layout.visible);

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
        {layout.more > 0 && (
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
