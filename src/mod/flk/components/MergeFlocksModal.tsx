/**
 * MergeFlocksModal.tsx — ادغام گروهی با انتخاب درون‌گروه
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

const GROUP_COLORS = [
  { soft: 'var(--accent-soft)', border: 'var(--accent-border)', text: 'var(--accent)' },
  { soft: 'var(--info-soft, rgba(2,132,199,.08))', border: 'var(--info, #0284c7)', text: 'var(--info, #0284c7)' },
  { soft: 'var(--purple-soft, rgba(147,51,234,.08))', border: 'var(--purple, #9333ea)', text: 'var(--purple, #9333ea)' },
  { soft: 'var(--warn-soft)', border: 'var(--warn)', text: 'var(--warn)' },
];

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
  color: typeof GROUP_COLORS[0];
}

export default function MergeFlocksModal({ open, onClose, flockIds, onMergeGroup }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const breeds = useBrd((s: any) => s.breeds);
  const [showAll, setShowAll] = useState(false);
  const [targets, setTargets] = useState<Map<string, string>>(new Map());
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());
  const [groupEnabled, setGroupEnabled] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (open) {
      setShowAll(false);
      setTargets(new Map());
      setSelected(new Map());
      setGroupEnabled(new Map());
    }
  }, [open]);

  const breedKindMap = useMemo(() => {
    const m = new Map<string, string>();
    (breeds || []).forEach((b: any) => {
      if (b.id && b.birdKind) m.set(b.id, b.birdKind);
    });
    return m;
  }, [breeds]);

  const getKindOf = (f: Flock): string => breedKindMap.get((f as any).breedId || '') || '';

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
        color: GROUP_COLORS[idx % GROUP_COLORS.length],
      };
    });
  }, [candidates, breedKindMap]);

  const multiGroups = groups.filter(g => g.flocks.length >= 2);

  const isGroupEnabled = (key: string): boolean => groupEnabled.get(key) ?? true;

  const getSelectedSet = (g: Group): Set<string> => {
    const stored = selected.get(g.key);
    if (stored) return stored;
    return new Set(g.flocks.map(f => f.id));
  };

  const getTargetId = (g: Group): string => {
    const sel = getSelectedSet(g);
    const stored = targets.get(g.key);
    if (stored && sel.has(stored)) return stored;
    return Array.from(sel)[0] || g.flocks[0].id;
  };

  const setGroupTarget = (key: string, flockId: string) => {
    setTargets(prev => { const n = new Map(prev); n.set(key, flockId); return n; });
  };

  const toggleGroup = (key: string) => {
    setGroupEnabled(prev => { const n = new Map(prev); n.set(key, !(prev.get(key) ?? true)); return n; });
  };

  const toggleFlock = (g: Group, flockId: string) => {
    const current = new Set(getSelectedSet(g));
    if (current.has(flockId)) current.delete(flockId);
    else current.add(flockId);
    setSelected(prev => { const n = new Map(prev); n.set(g.key, current); return n; });
    if (current.size > 0 && !current.has(getTargetId(g))) {
      setGroupTarget(g.key, Array.from(current)[0]);
    }
  };

  const enabledGroups = multiGroups
    .filter(g => isGroupEnabled(g.key))
    .map(g => {
      const sel = getSelectedSet(g);
      return { g, sel, targetId: getTargetId(g) };
    })
    .filter(x => x.sel.size >= 2 && x.sel.has(x.targetId));

  const handleMerge = async () => {
    if (enabledGroups.length === 0) return;
    const toMerge = enabledGroups.map(({ g, sel, targetId }) => {
      const target = g.flocks.find(f => f.id === targetId)!;
      const sourceIds = Array.from(sel).filter(id => id !== targetId);
      return { targetId, sourceIds, target, groupSize: sel.size };
    });
    const totalFlocks = toMerge.reduce((s, x) => s + x.groupSize, 0);
    const msg = enabledGroups.length === 1
      ? `${toFa(toMerge[0].groupSize)} گله در «${toMerge[0].target.name}» ادغام می‌شود.`
      : `${toFa(enabledGroups.length)} گروه (${toFa(totalFlocks)} گله) ادغام می‌شود.`;
    const ok = await showConfirmAsync('تأیید ادغام', msg + ' از طریق 🔓 بازگردانی قابل بازگشت است.', { confirmText: 'ادغام' });
    if (!ok) return;
    try {
      for (const m of toMerge) onMergeGroup(m.targetId, m.sourceIds);
      toastMsg.success(`${toFa(totalFlocks)} گله ادغام شد`);
      onClose();
    } catch (e) { console.error(e); toastMsg.error('خطا در ادغام'); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🔗 ادغام گله‌ها"
      footer={
        enabledGroups.length > 0 ? (
          <BtnRow>
            <Btn variant="primary" onClick={handleMerge}>
              🔗 {enabledGroups.length === 1 ? `ادغام ${toFa(enabledGroups[0].sel.size)} گله` : `ادغام ${toFa(enabledGroups.length)} گروه`}
            </Btn>
            <Btn onClick={onClose}>لغو</Btn>
          </BtnRow>
        ) : (
          <BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>
        )
      }
    >
      <div dir="rtl" style={{ padding: 'var(--pad-normal)', background: 'var(--info-soft, rgba(2,132,199,.08))', border: '1px solid var(--info, #0284c7)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>گله‌ها خودکار گروه‌بندی می‌شوند. با تیک هر گله، آن را به ادغام اضافه یا حذف کنید.</div>
        {!showAll ? (
          <button type="button" onClick={() => setShowAll(true)} style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + نمایش همه گله‌های فعال ({toFa(activeFlocks.length)})
          </button>
        ) : (
          <button type="button" onClick={() => setShowAll(false)} style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            − فقط انتخاب‌شده‌ها ({toFa(flockIds.length)})
          </button>
        )}
      </div>

      {multiGroups.map(g => {
        const enabled = isGroupEnabled(g.key);
        const sel = getSelectedSet(g);
        const targetId = getTargetId(g);
        const total = g.flocks.filter(f => sel.has(f.id)).reduce((s, f) => s + (f.currentCount || 0), 0);
        const targetFlock = g.flocks.find(f => f.id === targetId);
        const isValid = sel.size >= 2;
        return (
          <div key={g.key} dir="rtl" style={{
            marginBottom: 12, padding: 'var(--pad-normal)',
            background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
            borderRight: `3px solid ${g.color.border}`,
            opacity: enabled ? 1 : 0.5,
            transition: 'opacity 150ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 8, paddingBottom: 6, borderBottom: `1px dashed ${g.color.border}` }}>
              <input type="checkbox" checked={enabled} onChange={() => toggleGroup(g.key)} style={{ accentColor: g.color.text, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 'var(--fs-sm)', color: g.color.text }}>
                {g.label}
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', color: g.color.text, fontWeight: 600 }}>
                {toFa(sel.size)} از {toFa(g.flocks.length)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {g.flocks.map(f => {
                const isIncluded = sel.has(f.id);
                const isTarget = f.id === targetId && isIncluded;
                const age = getAgeDays(f);
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                    padding: 'var(--pad-tight)',
                    background: isTarget ? g.color.soft : 'transparent',
                    border: `1px solid ${isTarget ? g.color.border : 'transparent'}`,
                    borderRadius: 'var(--r-sm)',
                    opacity: isIncluded ? 1 : 0.4,
                  }}>
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => toggleFlock(g, f.id)}
                      disabled={!enabled}
                      style={{ accentColor: g.color.text, cursor: enabled ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                    />
                    <div
                      onClick={() => { if (enabled && isIncluded) setGroupTarget(g.key, f.id); }}
                      style={{ flex: 1, minWidth: 0, cursor: (enabled && isIncluded) ? 'pointer' : 'default' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {f.name}
                        {isTarget && (
                          <span style={{ fontSize: 'var(--fs-xs)', color: g.color.text, fontWeight: 700 }}>
                            ● هدف
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                        {toFa(f.currentCount || 0)} پرنده · {toFa(age)} روز
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {enabled && isValid && (
              <div style={{ marginTop: 6, padding: 'var(--pad-tight)', background: g.color.soft, borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: g.color.text, fontWeight: 600 }}>
                ℹ️ نتیجه: {toFa(total)} پرنده در «{targetFlock?.name}»
              </div>
            )}
            {enabled && !isValid && (
              <div style={{ marginTop: 6, padding: 'var(--pad-tight)', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 600 }}>
                ⚠️ حداقل ۲ گله برای ادغام لازم است
              </div>
            )}
          </div>
        );
      })}

      {multiGroups.length === 0 && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--warn)', textAlign: 'center', marginTop: 12 }}>
          {showAll
            ? '⚠️ هیچ گروهی با ۲ گله یا بیشتر وجود ندارد — ادغام ممکن نیست.'
            : 'ℹ️ برای ادغام، حداقل ۲ گله از یک پرنده و نوع انتخاب کنید.'}
        </div>
      )}
    </Modal>
  );
}
