/**
 * ArchivePage — تب آرشیو hal (سالن + بخش + تجهیز)
 * الگو: Material 3 Segmented Control
 */
import { useState, useMemo } from 'react';
import { useHal, type Hall, type Zone, type Equipment } from '../store';
import { useFlk } from '../../flk/store';
import { Btn, Empty, PageContainer, Tag } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { logAction } from '../../../cor/logger/auditLog';
import { toFa } from '../../../shr/utils/fa';

type Seg = 'halls' | 'zones' | 'equip';

interface Props { active?: boolean }

export default function ArchivePage({ active = true }: Props = {}) {
  const { halls, zones, equipment, updateHall, updateZone, updateEquip, deleteHall, deleteZone, deleteEquip } = useHal();
  const { flocks, update: updateFlock } = useFlk();
  const [seg, setSeg] = useState<Seg>('halls');

  const archivedHalls = useMemo(() => halls.filter(h => h.archived), [halls]);
  const archivedZones = useMemo(() => zones.filter(z => z.archived), [zones]);
  const archivedEquip = useMemo(() => equipment.filter(e => e.status === 'archived'), [equipment]);

  if (!active) return null;

  const total = archivedHalls.length + archivedZones.length + archivedEquip.length;

  const restoreHall = async (h: Hall) => {
    const ok = await showConfirmAsync('بازگردانی', `سالن «${h.name}» بازگردانی شود؟`);
    if (!ok) return;
    updateHall(h.id, { archived: false });
    toastMsg.restoredBulk(1, 'سالن');
    logAction('update', 'hal', 'بازگردانی سالن: ' + h.name);
  };

  const restoreZone = async (z: Zone) => {
    const ok = await showConfirmAsync('بازگردانی', `بخش «${z.name}» بازگردانی شود؟`);
    if (!ok) return;
    updateZone(z.id, { archived: false });
    toastMsg.restoredBulk(1, 'بخش');
  };

  const restoreEquip = async (e: Equipment) => {
    const ok = await showConfirmAsync('بازگردانی', `تجهیز «${e.name}» بازگردانی شود؟`);
    if (!ok) return;
    updateEquip(e.id, { status: 'active' });
    toastMsg.restoredBulk(1, 'تجهیز');
  };

  const permDeleteHall = async (h: Hall) => {
    const hasFlocks = flocks.some((f) => f.hallId === h.id && f.status === 'active');
    if (hasFlocks) {
      toastMsg.error('این سالن گله فعال دارد — ابتدا گله را منتقل کنید');
      return;
    }
    const ok = await showConfirmAsync('حذف دائمی', `سالن «${h.name}» برای همیشه حذف شود؟`, { danger: true });
    if (!ok) return;
    deleteHall(h.id);
    toastMsg.deleted('سالن');
  };

  const permDeleteZone = async (z: Zone) => {
    const hasFlocks = flocks.some((f) => f.zoneId === z.id);
    if (hasFlocks) {
      toastMsg.error('این بخش گله دارد — ابتدا گله را منتقل کنید');
      return;
    }
    const ok = await showConfirmAsync('حذف دائمی', `بخش «${z.name}» برای همیشه حذف شود؟`, { danger: true });
    if (!ok) return;
    deleteZone(z.id);
    toastMsg.deleted('بخش');
  };

  const permDeleteEquip = async (e: Equipment) => {
    const ok = await showConfirmAsync('حذف دائمی', `تجهیز «${e.name}» برای همیشه حذف شود؟`, { danger: true });
    if (!ok) return;
    deleteEquip(e.id);
    toastMsg.deleted('تجهیز');
  };

  const segmented: { id: Seg; label: string; count: number }[] = [
    { id: 'halls', label: '🏭 سالن‌ها', count: archivedHalls.length },
    { id: 'zones', label: '📦 بخش‌ها', count: archivedZones.length },
    { id: 'equip', label: '🔧 تجهیزات', count: archivedEquip.length },
  ];

  return (
    <PageContainer>
      {total === 0 ? (
        <Empty
          icon={<span style={{ fontSize: 32 }}>📦</span>}
          title="آرشیو خالی است"
          desc="سالن، بخش یا تجهیز آرشیو شده‌ای وجود ندارد."
        />
      ) : (
        <>
          {/* Segmented Control */}
          <div style={{
            display: 'flex',
            gap: 0,
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-md)',
            padding: 3,
            border: '1px solid var(--border)',
          }}>
            {segmented.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeg(s.id)}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  border: 'none',
                  background: seg === s.id ? 'var(--card-solid)' : 'transparent',
                  color: seg === s.id ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: 700,
                  fontSize: 'var(--fs-sm)',
                  fontFamily: 'inherit',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  boxShadow: seg === s.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                  transition: 'all var(--dur-fast)',
                }}
              >
                {s.label} ({toFa(s.count)})
              </button>
            ))}
          </div>

          {/* halls */}
          {seg === 'halls' && (
            archivedHalls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--pad-loose)', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
                سالن آرشیوی نیست
              </div>
            ) : (
              archivedHalls.map(h => (
                <div key={h.id} style={{
                  padding: 'var(--pad-tight)',
                  background: 'var(--card-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  flexWrap: 'wrap',
                }}>
                  <Tag tone="gray">🏭 آرشیو</Tag>
                  <span style={{ flex: 1, fontWeight: 700 }}>{h.name}</span>
                  <Btn size="sm" variant="primary" onClick={() => restoreHall(h)}>بازگردانی</Btn>
                  <Btn size="sm" onClick={() => permDeleteHall(h)}>حذف</Btn>
                </div>
              ))
            )
          )}

          {/* zones */}
          {seg === 'zones' && (
            archivedZones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--pad-loose)', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
                بخش آرشیوی نیست
              </div>
            ) : (
              archivedZones.map(z => (
                <div key={z.id} style={{
                  padding: 'var(--pad-tight)',
                  background: 'var(--card-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  flexWrap: 'wrap',
                }}>
                  <Tag tone="gray">📦 آرشیو</Tag>
                  <span style={{ flex: 1, fontWeight: 700 }}>{z.name}</span>
                  <Btn size="sm" variant="primary" onClick={() => restoreZone(z)}>بازگردانی</Btn>
                  <Btn size="sm" onClick={() => permDeleteZone(z)}>حذف</Btn>
                </div>
              ))
            )
          )}

          {/* equip */}
          {seg === 'equip' && (
            archivedEquip.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--pad-loose)', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
                تجهیز آرشیوی نیست
              </div>
            ) : (
              archivedEquip.map(e => (
                <div key={e.id} style={{
                  padding: 'var(--pad-tight)',
                  background: 'var(--card-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  flexWrap: 'wrap',
                }}>
                  <Tag tone="gray">🔧 آرشیو</Tag>
                  <span style={{ flex: 1, fontWeight: 700 }}>{e.name}</span>
                  <Btn size="sm" variant="primary" onClick={() => restoreEquip(e)}>بازگردانی</Btn>
                  <Btn size="sm" onClick={() => permDeleteEquip(e)}>حذف</Btn>
                </div>
              ))
            )
          )}
        </>
      )}
    </PageContainer>
  );
}
