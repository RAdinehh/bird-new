import { useCustomOptions } from '../../shr/store/customOptions';
import { Empty, Btn, PageContainer } from '../../shr/components/ui';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';

const KEY_LABELS: Record<string, string> = {
  'hal.equip.type.ventilation': 'تجهیزات → تهویه',
  'hal.equip.type.feeding':     'تجهیزات → تغذیه',
  'hal.equip.type.drinking':    'تجهیزات → آبخوری',
  'hal.equip.type.heating':     'تجهیزات → گرمایش',
  'hal.equip.type.lighting':    'تجهیزات → روشنایی',
  'hal.equip.type.litter':      'تجهیزات → بستر',
  'hal.equip.type.power':       'تجهیزات → برق‌رسانی',
  'hal.equip.type.auxiliary':   'تجهیزات → جانبی',
  'hal.hall.vent':              'سالن → تهویه',
  'hal.hall.feeder':            'سالن → دانخوری',
  'hal.hall.drinker':           'سالن → آبخوری',
  'hal.hall.litter':            'سالن → بستر',
};

function keyLabel(key: string) {
  return KEY_LABELS[key] || key;
}

export default function HiddenOptionsTab() {
  const { getHidden, unhideOption, deleteOption } = useCustomOptions();
  const hidden = getHidden();

  if (hidden.length === 0) {
    return (
      <PageContainer>
        <Empty
          icon={<span style={{ fontSize: 30 }}>🗂</span>}
          title="چیزی مخفی نشده"
          desc="وقتی آیتم سفارشی رو حذف کنی، اینجا نگه‌داری می‌شه تا بتونی برگردونی."
        />
      </PageContainer>
    );
  }

  const grouped: Record<string, typeof hidden> = {};
  hidden.forEach(o => {
    if (!grouped[o.key]) grouped[o.key] = [];
    grouped[o.key].push(o);
  });

  const handleUnhide = (id: string, name: string) => {
    unhideOption(id);
    showToast('«' + name + '» بازگردانی شد', 'success', 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await showConfirmAsync('حذف کامل', '«' + name + '» برای همیشه پاک بشه؟', { danger: true });
    if (!ok) return;
    deleteOption(id);
    showToast('«' + name + '» حذف شد', 'info', 2000);
  };

  return (
    <PageContainer>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.8 }}>
        آیتم‌هایی که از لیست انتخاب مخفی شدن. می‌تونی بازشون گردونی یا برای همیشه پاکشون کنی.
      </div>
      {Object.keys(grouped).map(k => (
        <div key={k} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--muted)',
            letterSpacing: '.6px', padding: '8px 4px',
          }}>{keyLabel(k)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grouped[k].map(o => (
              <div key={o.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', minHeight: 52,
                background: 'var(--card-solid)',
                border: '1.5px solid var(--border)',
                borderRadius: 14,
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: 'var(--input-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0, opacity: .6,
                }}>{o.icon}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{o.name}</span>
                <Btn size="sm" onClick={() => handleUnhide(o.id, o.name)}>بازگردانی</Btn>
                <Btn size="sm" variant="danger" onClick={() => handleDelete(o.id, o.name)}>حذف کامل</Btn>
              </div>
            ))}
          </div>
        </div>
      ))}
    </PageContainer>
  );
}
