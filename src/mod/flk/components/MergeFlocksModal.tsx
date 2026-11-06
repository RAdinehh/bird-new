/**
 * MergeFlocksModal.tsx — انتخاب گله هدف برای ادغام
 */
import { useMemo, useState } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { useFlk, getAgeDays, type Flock } from '../store';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  flockIds: string[];
  onConfirm: (targetId: string, sourceIds: string[]) => void;
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

  const _KIND_LBL: Record<string, string> = { chicken: 'مرغ', duck: 'اردک', turkey: 'بوقلمون', quail: 'بلدرچین', goose: 'غاز' };
  const _TYPE_LBL: Record<string, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };
  const _kindLbl = (k: string) => _KIND_LBL[k] || k;
  const _typeLbl = (t: string) => _TYPE_LBL[t] || t;

  const incompatMap = new Map<string, string>();
  if (target) {
    for (const src of others) {
      if ((src as any).birdKind && (target as any).birdKind && (src as any).birdKind !== (target as any).birdKind) {
        incompatMap.set(src.id, 'پرنده: ' + _kindLbl((src as any).birdKind) + ' ≠ ' + _kindLbl((target as any).birdKind));
        continue;
      }
      if (src.type !== target.type) {
        incompatMap.set(src.id, 'نوع: ' + _typeLbl(src.type) + ' ≠ ' + _typeLbl(target.type));
      }
    }
  }
  const hasIncompat = incompatMap.size > 0;
  const compatibleCount = others.length - incompatMap.size;

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
          const _inc = incompatMap.get(f.id);
          return (
            <label
              key={f.id}
              onClick={(e) => { if (_inc) e.preventDefault(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--pad-normal)',
                background: isTarget ? 'var(--accent-soft)' : _inc ? 'var(--danger-soft)' : 'var(--input-bg)',
                border: '1px solid ' + (isTarget ? 'var(--accent)' : _inc ? 'var(--danger)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                cursor: _inc ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                type="radio"
                name="merge-target"
                checked={isTarget}
                onChange={() => { if (!_inc) setTargetId(f.id); }}
                disabled={!!_inc}
                style={{ accentColor: 'var(--accent)', cursor: _inc ? 'not-allowed' : 'pointer' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{f.name}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {toFa(f.currentCount || 0)} پرنده · {toFa(age)} روز · {f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر'}
                </div>
                  {_inc && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 600, marginTop: 4 }}>⚠️ {_inc}</div>}
              </div>
              {isTarget && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>هدف</span>}
            </label>
          );
        })}
      </div>

      {hasIncompat && (
        <div style={{ marginTop: 12, padding: 'var(--pad-normal)', background: compatibleCount === 0 ? 'var(--danger-soft)' : 'var(--warn-soft)', border: '1px solid ' + (compatibleCount === 0 ? 'var(--danger)' : 'var(--warn)'), borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: compatibleCount === 0 ? 'var(--danger)' : 'var(--warn)' }}>
          {compatibleCount === 0
            ? '⚠️ هیچ گله سازگاری نیست — همه متفاوت با هدف هستند.'
            : '⚠️ ' + toFa(incompatMap.size) + ' گله ناسازگار از ادغام کنار گذاشته می‌شود.'}
        </div>
      )}
      {!hasIncompat && target && others.length > 0 && (
        <div style={{ marginTop: 12, padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>
          {toFa(others.length)} گله به «{target.name}» ادغام می‌شود. از طریق «🔓 بازگردانی» در کارت گله قابل بازگشت است.
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={async () => {
          if (!target) return;
          const _compatSrc = others.filter(o => !incompatMap.has(o.id)).map(o => o.id);
          if (_compatSrc.length === 0) return;
          const _skipped = others.length - _compatSrc.length;
          const _msg = (_compatSrc.length + 1) + ' گله در «' + target.name + '» ادغام می‌شود.' +
                       (_skipped > 0 ? '\n⚠️ ' + _skipped + ' گله ناسازگار کنار گذاشته می‌شود.' : '') +
                       '\nاز طریق 🔓 بازگردانی قابل بازگشت است.';
          const ok = await showConfirmAsync('تأیید ادغام', _msg, { confirmText: 'ادغام' });
          if (ok) onConfirm(targetId, _compatSrc);
        }} disabled={!targetId || compatibleCount === 0}>
          🔗 {compatibleCount > 0 ? 'ادغام ' + toFa(compatibleCount + 1) + ' گله' : 'گله سازگار نیست'}
        </Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
