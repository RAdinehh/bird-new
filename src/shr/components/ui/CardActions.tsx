import { Btn } from './index';

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'outline';
  hidden?: boolean;
}

export function CardActions({ actions }: { actions: CardAction[] }) {
  const visibleActions = actions.filter(a => !a.hidden);
  if (visibleActions.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: 'var(--sp-2)',
      paddingTop: 'var(--sp-2)',
      width: '100%',
    }}>
      {visibleActions.map((action, i) => (
        <Btn
          key={i}
          size="sm"
          variant={action.variant || 'outline'}
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
