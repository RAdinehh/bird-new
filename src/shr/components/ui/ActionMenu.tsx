import { Sheet, Btn } from './index';
import type { CardAction } from './CardActions';

interface ActionMenuProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: CardAction[];
}

export function ActionMenu({ open, onClose, title = 'عملیات بیشتر', actions }: ActionMenuProps) {
  const visible = actions.filter(a => !a.hidden);
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map((action, i) => (
          <Btn
            key={i}
            variant={action.variant || 'outline'}
            onClick={() => { onClose(); action.onClick(); }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            {action.label}
          </Btn>
        ))}
      </div>
    </Sheet>
  );
}
