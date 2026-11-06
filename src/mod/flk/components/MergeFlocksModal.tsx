/**
 * MergeFlocksModal.tsx — ادغام گروهی گله‌ها
 * گله‌ها بر اساس پرنده + نوع خودکار گروه‌بندی می‌شوند.
 * هر گروه فعال/غیرفعال + رنگ مجزا.
 */
import { useEffect, useMemo, useState } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { useFlk, getAgeDays, type Flock } from '../store';
import { useBrd } from '../../brd/store';
import { toFa } from '../../../shr/utils/fa';

const _KIND_LBL: Record<string, string> = { chicken: 'مرغ', duck: 'اردک', turkey: 'بوقلمون', quail: 'بلدرچین', goose: 'غاز' };
const _TYPE_LBL: Record<string, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };

type GroupColor = 'accent' | 'info' | 'purple' | 'warn';
const GROUP_COLOR_CYCLE: GroupColor[] = ['accent', 'info', 'purple', 'warn'];

interface Props {
  open: boolean;
  onClose: () => void;
  flockIds: string[];
  onMergeGroup: (targetId: string, sourceIds: string[]) => void;
}

interface Group {
  key: string;
  flocks: Flock[];
  label: string;
  color: GroupColor;
}

export default function MergeFlocksModal({ open, onClose, flockIds, onMergeGroup }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const breeds = useBrd((s: any) => s.breeds);
  const [showAll, setShowAll] = useState(false);
  const [targets, setTargets] = useState<Map<string, string>>(new Map());
  const [disabledGroups, setDisabledGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setShowAll(false);
      setTargets(new Map());
      setDisabledGroups(new Set());
    }
  }, [open]);

  const breedKindMap = useMemo(() => {
    const m = new Map<string, string>();
    (breeds || []).forEach((b: any) => {
      if (b.id && b.birdKind) m.set(b.id, b.birdKind);
    });
    return m;
  }, [breeds]);

  const getKindOf = (f: Flock): string => {
    return breedKindMap.get((f as any).breedId || '') || '';
  };

  const activeFlocks = useMemo(() => allFlocks.filter(f => f.status === 'active'), [allFlocks]);

  const candidates = useMemo(() => {
    if (showAll) return activeFlocks;
    return flockIds.map(id => allFlocks.find(f => f.id === id)).filter(Boolean) as Flock[];
  }, [showAll, activeFlocks, allFlocks, flockIds]);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Flock[]>();
    for (const f of candidates) {
      const kind = getKindOf(f) || 'unknown';
      const key = `${kind}|${f.type}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return Array.from(map.entries()).map(([key, flocks], idx) => {
      const f0 = flocks[0];
      const kindLbl = _KIND_LBL[getKindOf(f0)] || 'نامشخص';
      const typeLbl = _TYPE_LBL[f0.type] || f0.type;
      return {
        key, flocks,
        label: `${kindLbl} — ${typeLbl}`,
        color: GROUP_COLOR_CYCLE[idx % GROUP_COLOR_CYCLE.length],
      };
    });
  }, [candidates, breedKindMap]);

  const multiGroups = groups.filter(g => g.flocks.length >= 2);
  const singles = groups.filter(g => g.flocks.length === 1);
  const enabledMultiGroups = multiGroups.filter(g => !disabledGroups.has(g.key));

  const getTargetId = (g: Group): string => {
    const stored = targets.get(g.key);
    if (stored && g.flocks.some(f => f.id === stored)) return stored;
    return g.flocks[0].id;
  };

  const setGroupTarget = (key: string, flockId: string) => {
    setTargets(prev => {
      const next = new Map(prev);
      next.set(key, flockId);
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setDisabledGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMerge = async () => {
    if (enabledMultiGroups.length === 0) return;
    const toMerge = enabledMultiGroups.map(g => {
      const targetId = getTargetId(g);
      const sourceIds = g.flocks.filter(f => f.id !== targetId).map(f => f.id);
      const target = g.flocks.find(f => f.id === targetId)!;
      return { targetId, sourceIds, target, groupFlocks: g.flocks };
    });

    const totalFlocks = toMerge.reduce((s, x) => s + x.groupFlocks.length, 0);
    const msg = enabledMultiGroups.length === 1
      ? `${toFa(toMerge[0].groupFlocks.length)} گله در «${toMerge[0].target.name}» ادغام می‌شود.`
      : `${toFa(enabledMultiGroups.length)} گروه (${toFa(totalFlocks)} گله) ادغام می‌شود. از طریق 🔓 بازگردانی قابل بازگشت است.`;

    const ok = await showConfirmAsync('تأیید ادغام', msg, { confirmText: 'ادغام' });
    if (!ok) return;

    try {
      for (const m of toMerge) {
        onMergeGroup(m.targetId, m.sourceIds);
      }
      toastMsg.success(`${toFa(totalFlocks)} گله در ${toFa(enabledMultiGroups.length)} گروه ادغام شد`);
      onClose();
    } catch (e) {
      console.error('[merge batch]', e);
      toastMsg.error('خطا در ادغام');
    }
  };

  const infoBox = (
    <div style={{
      padding: 'var(--pad-normal)',
      background: 'var(--info-soft, rgba(2,132,199,.08))',
      border: '1px solid var(--info, #0284c7)',
      borderRadius: 'var(--r-md)',
      fontSize: 'var(--fs-sm)',
      marginBottom: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div>گله‌ها بر اساس پرنده و نوع خودکار گروه‌بندی می‌شوند. هر گروه با تیک خودش فعال می‌شود.</div>
      {!showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            alignSelf: 'flex-start',
            padding: '4px 10px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--accent)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + نمایش همه گله‌های فعال ({toFa(activeFlocks.length)})
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          style={{
            alignSelf: 'flex-start',
            padding: '4px 10px',
            background: 'var(--btn-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--muted)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          − فقط انتخاب‌شده‌ها ({toFa(flockIds.length)})
        </button>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🔗 ادغام گله‌ها"
      footer={
        enabledMultiGroups.length > 0 ? (
          <BtnRow>
            <Btn variant="primary" onClick={handleMerge}>
              🔗 {enabledMultiGroups.length === 1 ? `ادغام ${toFa(enabledMultiGroups[0].flocks.length)} گله` : `ادغام ${toFa(enabledMultiGroups.length)} گروه`}
            </Btn>
            <Btn onClick={onClose}>لغو</Btn>
          </BtnRow>
        ) : (
          <BtnRow>
            <Btn onClick={onClose}>بستن</Btn>
          </BtnRow>
        )
      }
    >
      {infoBox}

      {multiGroups.map((g) => {
        const isEnabled = !disabledGroups.has(g.key);
        const targetId = getTargetId(g);
        const total = g.flocks.reduce((s, f) => s + (f.currentCount || 0), 0);
        const targetFlock = g.flocks.find(f => f.id === targetId);
        return (
          <div key={g.key} style={{
            marginBottom: 12,
            padding: 'var(--pad-normal)',
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-md)',
            borderTop: `3px solid var(--${g.color})`,
            opacity: isEnabled ? 1 : 0.5,
            transition: 'opacity 150ms',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              color: `var(--${g.color})`,
              marginBottom: 6,
              paddingBottom: 4,
              borderBottom: `1px dashed var(--${g.color})`,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggleGroup(g.key)}
                style={{ accentColor: `var(--${g.color})`, cursor: 'pointer' }}
              />
              <span style={{ flex: 1 }}>{g.label} ({toFa(g.flocks.length)} گله)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {g.flocks.map(f => {
                const isTarget = f.id === targetId;
                const age = getAgeDays(f);
                return (
                  <label key={f.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    padding: 'var(--pad-tight)',
                    background: isTarget && isEnabled ? `var(--${g.color}-soft, var(--input-bg))` : 'transparent',
                    border: '1px solid ' + (isTarget && isEnabled ? `var(--${g.color})` : 'transparent'),
                    borderRadius: 'var(--r-sm)',
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                  }}>
                    <input
                      type="radio"
                      name={'target-' + g.key}
                      checked={isTarget}
                      onChange={() => { if (isEnabled) setGroupTarget(g.key, f.id); }}
                      disabled={!isEnabled}
                      style={{ accentColor: `var(--${g.color})`, cursor: isEnabled ? 'pointer' : 'not-allowed' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                        {f.name}
                        {isTarget && <span style={{ marginRight: 6, fontSize: 'var(--fs-xs)', color: `var(--${g.color})`, fontWeight: 700 }}>هدف</span>}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                        {toFa(f.currentCount || 0)} پرنده · {toFa(age)} روز
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {isEnabled && (
              <div style={{
                marginTop: 6,
                padding: 'var(--pad-tight)',
                background: `var(--${g.color}-soft, var(--input-bg))`,
                borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)',
                color: `var(--${g.color})`,
                fontWeight: 600,
              }}>
                ℹ️ نتیجه: {toFa(total)} پرنده در «{targetFlock?.name}»
              </div>
            )}
          </div>
        );
      })}

      {singles.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: 'var(--pad-normal)',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)',
          opacity: 0.7,
        }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
            گله‌های تنها (بدون ادغام)
          </div>
          {singles.map(g => (
            <div key={g.key} style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '2px 0' }}>
              • {g.flocks[0].name} — {toFa(g.flocks[0].currentCount || 0)} پرنده
            </div>
          ))}
        </div>
      )}

      {multiGroups.length === 0 && (
        <div style={{
          padding: 'var(--pad-normal)',
          background: 'var(--danger-soft)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--danger)',
          textAlign: 'center',
          marginTop: 12,
        }}>
          ⚠️ هیچ گروه قابل ادغامی نیست — برای ادغام، حداقل ۲ گله از یک پرنده و نوع لازم است.
        </div>
      )}
    </Modal>
  );
}
