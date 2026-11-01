/**
 * ModalFooter.tsx — دکمه‌های footer modal با API واضح
 * استاندارد RTL: primary راست، danger وسط، secondary چپ
 */
import { Btn } from './Btn';

export interface FooterAction {
  label: string;
  role: 'primary' | 'danger' | 'secondary';
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  actions: FooterAction[];
}

export function ModalFooter({ actions }: Props) {
  if (actions.length === 0) return null;

  // Sort: primary first (right in RTL), danger middle, secondary last (left)
  const rank = (r: FooterAction['role']) => (r === 'primary' ? 0 : r === 'danger' ? 1 : 2);
  const sorted = [...actions].sort((a, b) => rank(a.role) - rank(b.role));

  return (
    <div style={{ display: 'flex', gap: 'var(--sp-2)', width: '100%' }}>
      {sorted.map((a, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0 }}>
          <Btn
            variant={a.role === 'secondary' ? 'outline' : a.role}
            onClick={a.onClick}
            disabled={a.disabled}
            style={{ width: '100%' }}
          >
            {a.label}
          </Btn>
        </div>
      ))}
    </div>
  );
}
