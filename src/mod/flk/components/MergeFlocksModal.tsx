/**
 * MergeFlocksModal.tsx — انتخاب گله هدف برای ادغام
 */
import { useMemo, useState } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { useFlk, getAgeDays, type Flock } from '../store';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  flockIds: string[];
  onConfirm: (targetId: string) => void;
}

export default function MergeFlocksModal({ open, onClose, flockIds, onConfirm }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const [targetId, setTargetId] = useState<string>(flockIds[0] || '');

  const candidates = useMemo(
    () => flockIds.map(id => allFlocks.find(f => f.id === id)).filter(Boolean) as Flock[],
    [flockIds, allFlocks]
  );

  const target = candidates.find(f => f.id === targetId);
  const others = candidates.filter(f => f.id !== targetId);

  return (
    <Modal open={open} onClose={onClose} title="🔗 ادغام گله‌ها">
      <div style={{ padding: 'var(--pad-normal)', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', marginBottom: 12 }}>
        گله‌های دیگر به گله هدف اضافه می‌شوند و وضعیت‌شان «ادغام‌شده» می‌شود.
      </div>

      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
        گله هدف را انتخاب کنید:
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {candidates.map(f => {
          const age = getAgeDays(f);
          const isTarget = f.id === targetId;
          return (
            <label
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--pad-normal)',
                background: isTarget ? 'var(--accent-soft)' : 'var(--input-bg)',
                border: '1px solid ' + (isTarget ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="merge-target"
                checked={isTarget}
                onChange={() => setTargetId(f.id)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{f.name}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {toFa(f.currentCount || 0)} پرنده · {toFa(age)} روز · {f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر'}
                </div>
              </div>
              {isTarget && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>هدف</span>}
            </label>
          );
        })}
      </div>

      {target && others.length > 0 && (
        <div style={{ marginTop: 12, padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>
          ⚠️ {toFa(others.length)} گله به «{target.name}» ادغام می‌شود. این عمل قابل بازگشت نیست (از طریق Undo).
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={() => onConfirm(targetId)} disabled={!targetId}>
          🔗 ادغام {toFa(others.length + 1)} گله
        </Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
