import { Btn } from './index';

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'subtle' | 'danger-outline';
  hidden?: boolean;
  disabled?: boolean;
}

export function CardActions({ actions }: { actions: CardAction[] }) {
  const visibleActions = actions.filter(a => !a.hidden);
  if (visibleActions.length === 0) return null;

  const n = visibleActions.length;
  const cols = n === 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 2 : 3;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 'var(--sp-2)',
      paddingTop: 'var(--sp-2)',
      width: '100%',
    }}>
      {visibleActions.map((action, i) => (
        <Btn
          key={i}
          size="sm"
          variant={action.variant || 'outline'}
          disabled={action.disabled}
          onClick={(e) => { e.stopPropagation(); action.onClick(); }}
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '8px 4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {action.label}
        </Btn>
      ))}
    </div>
  );
}
