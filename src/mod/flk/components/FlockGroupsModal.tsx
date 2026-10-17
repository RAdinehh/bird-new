/**
 * FlockGroupsModal.tsx — انتخاب گروه برای یک گله
 */
import { useMemo, useState } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { useFlk, type Flock, type FlockGroupType } from '../store';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock;
}

const TYPE_ICON: Record<FlockGroupType, string> = {
  season: '🗓', breed: '🧬', cohort: '👥', farm: '🏭', owner: '👤', custom: '📁', smart: '🤖',
};

export default function FlockGroupsModal({ open, onClose, flock }: Props) {
  const groups = useFlk(s => s.groups);
  const groupMembers = useFlk(s => s.groupMembers);
  const addToGroup = useFlk(s => s.addToGroup);
  const removeFromGroup = useFlk(s => s.removeFromGroup);

  const availableGroups = useMemo(
    () => groups.filter(g => !g.archived).sort((a, b) => a.name.localeCompare(b.name, 'fa')),
    [groups]
  );

  const memberSet = useMemo(() => {
    return new Set(
      groupMembers
        .filter(m => m.flockId === flock.id && !m.leftAt)
        .map(m => m.groupId)
    );
  }, [groupMembers, flock.id]);

  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(memberSet));

  const toggle = (groupId: string) => {
    setLocalSelected(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSave = () => {
    // اضافه‌ها
    for (const gid of localSelected) {
      if (!memberSet.has(gid)) addToGroup(gid, flock.id);
    }
    // حذف‌ها
    for (const gid of memberSet) {
      if (!localSelected.has(gid)) removeFromGroup(gid, flock.id);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={'📁 گروه‌های «' + flock.name + '»'}>
      {availableGroups.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
          <div>هنوز گروهی نساخته‌ای</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
            از منوی گله‌ها → «گروه‌ها» گروه بساز
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {availableGroups.map(g => {
            const isSmart = g.type === 'smart';
            const checked = localSelected.has(g.id);
            return (
              <label
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  padding: 'var(--pad-normal)',
                  background: isSmart
                    ? 'var(--purple-soft)'
                    : (checked ? 'var(--accent-soft)' : 'var(--input-bg)'),
                  border: '1px solid ' + (
                    isSmart
                      ? 'var(--purple)'
                      : (checked ? 'var(--accent)' : 'var(--border)')
                  ),
                  borderRadius: 'var(--r-md)',
                  cursor: isSmart ? 'default' : 'pointer',
                  opacity: isSmart ? 0.9 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => !isSmart && toggle(g.id)}
                  disabled={isSmart}
                  style={{ accentColor: isSmart ? 'var(--purple)' : 'var(--accent)' }}
                />
                <span style={{ fontSize: 14 }}>{TYPE_ICON[g.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                    {g.name}
                    {isSmart && (
                      <span style={{
                        marginRight: 6, fontSize: 9, fontWeight: 700,
                        color: 'var(--purple)', background: 'rgba(168,85,247,.15)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>🤖 خودکار</span>
                    )}
                  </div>
                  {g.description && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{g.description}</div>
                  )}
                  {isSmart && (
                    <div style={{ fontSize: 10, color: 'var(--purple)', fontStyle: 'italic', marginTop: 2 }}>
                      بر اساس قوانین گروه به‌صورت خودکار
                    </div>
                  )}
                </div>
                {checked && !isSmart && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>✓</span>}
              </label>
            );
          })}
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={handleSave}>
          ذخیره ({toFa(localSelected.size)} انتخاب)
        </Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
