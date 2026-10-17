/**
 * FlockCapacityCard.tsx — کارت ظرفیت سالن + breakdown بخش‌ها
 */
import { toFa } from '../../../shr/utils/fa';

interface Props {
  hallCapacity: any;
}

export default function FlockCapacityCard({ hallCapacity }: Props) {
  if (!hallCapacity) return null;

  return (
    <div style={{
      padding: 'var(--pad-normal)',
      background: hallCapacity.ok ? 'var(--accent-soft)' : 'var(--warn-soft)',
      border: '1px solid ' + (hallCapacity.ok ? 'var(--accent-border)' : 'var(--warn)'),
      borderRadius: 'var(--r-md)',
      fontSize: 'var(--fs-xs)',
      color: hallCapacity.ok ? 'var(--accent)' : 'var(--warn)',
      fontWeight: 600,
      lineHeight: 1.7,
      direction: 'rtl',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
          {hallCapacity.ok ? '✅ ظرفیت کافیه' : '⚠️ اضافه‌بار ' + toFa(hallCapacity.over) + ' پرنده'}
        </span>
        <span style={{ opacity: 0.85 }}>سالن {hallCapacity.scopeName} · {toFa(hallCapacity.capacity)} ظرفیت</span>
      </div>

      {hallCapacity.breakdown && (
        <div style={{ paddingTop: 6, borderTop: '1px dashed currentColor', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', fontWeight: hallCapacity.breakdown.noZone.isCurrent ? 700 : 500 }}>
            <span>{hallCapacity.breakdown.noZone.isCurrent ? '👉 بدون بخش' : 'بدون بخش'}</span>
            <span style={{ display: 'flex', gap: 'var(--sp-3)', flexShrink: 0 }}>
              {hallCapacity.breakdown.noZone.used > 0 ? (
                <>
                  <span>{toFa(hallCapacity.breakdown.noZone.used)} پرنده</span>
                  <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(hallCapacity.breakdown.noZone.remaining)} خالی)</span>
                </>
              ) : (
                <>
                  <span style={{ opacity: 0.6 }}>خالی</span>
                  <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(hallCapacity.breakdown.noZone.capacity)} ظرفیت)</span>
                </>
              )}
            </span>
          </div>

          {hallCapacity.breakdown.zones.map((z: any) => {
            const isOccupied = z.used > 0 || z.isCurrent;
            return (
              <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', fontWeight: z.isCurrent ? 700 : 500 }}>
                <span>{'📦'} {z.name}{isOccupied ? ' 🔒' : ''}</span>
                <span style={{ display: 'flex', gap: 'var(--sp-3)', flexShrink: 0 }}>
                  {z.used > 0 ? (
                    <>
                      <span>{toFa(z.used)} از {toFa(z.capacity)}</span>
                      <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(z.remaining)} خالی)</span>
                    </>
                  ) : z.isCurrent ? (
                    <>
                      <span>این گله اینجا</span>
                      <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(z.capacity)} ظرفیت)</span>
                    </>
                  ) : (
                    <>
                      <span style={{ opacity: 0.6 }}>خالی</span>
                      <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(z.capacity)} ظرفیت)</span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ paddingTop: 6, marginTop: 6, borderTop: '1px dashed currentColor', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <span>این گله: <b>{toFa(hallCapacity.total - hallCapacity.current)}</b> پرنده</span>
        <span style={{ fontWeight: 700 }}>
          مجموع {toFa(hallCapacity.total)} از {toFa(hallCapacity.capacity)}
          {' · '}
          {hallCapacity.over > 0
            ? <span style={{ color: 'var(--danger)' }}>اضافه {toFa(hallCapacity.over)}</span>
            : <span>{toFa(hallCapacity.remaining)} خالی</span>}
        </span>
      </div>
    </div>
  );
}
