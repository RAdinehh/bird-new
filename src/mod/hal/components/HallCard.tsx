/**
 * HallCard — کارت نمایش یک سالن (با محاسبات هوشمند)
 */
import { toFa } from '../../../shr/utils/fa';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { Row, RowWithStatus, isFanLike, isLampLike } from '../helpers';
import { getAgeDays, type Flock } from '../../flk/store';
import type { Hall, Zone, Equipment } from '../store';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { HallEquipSection } from '../HallEquipSection';
import EntityLink from '../../../shr/components/EntityLink';

export interface HallCardProps {
  h: Hall;
  i: number;
  zones: Zone[];
  equipment: Equipment[];
  flocks: Flock[];
  breedStd: ReturnType<typeof import('../../../shr/hooks/useBreedStandard').useBreedStandard>;
  fmt: ReturnType<typeof import('../../../shr/units/useFormat').useFormat>;
  isOpen: boolean;
  ms: import('../../../shr/multiSelect/useMultiSelect').MultiSelectState<Hall>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onUndo: (item: Hall) => void;
  birdNames?: Map<string, string>;
  breedNames?: Map<string, string>;
  workerNames?: Map<string, string>;
}

export default function HallCard(props: HallCardProps) {
  const { h, i, zones, equipment, flocks, breedStd, fmt, isOpen, ms, onToggle, onEdit, onDelete, onUndo,
        birdNames, breedNames, workerNames } = props;

  const area = (h.length || 0) * (h.width || 0);
  const volume = area * (h.height || 0);
  const zoneCount = zones.filter(z => z.hallId === h.id).length;
  const equipCount = equipment.filter(e => e.hallId === h.id).length;
  const equipValue = equipment.filter(e => e.hallId === h.id).reduce((a, e) => a + ((e.count || 0) * (e.unitPrice || 0)), 0);
  const hallEquips = equipment.filter(e => e.hallId === h.id);
  const totalAirflow = hallEquips.filter(e => isFanLike(e.type)).reduce((a, e) => a + ((e.count || 0) * (e.capacity || 0)), 0);
  const totalLightW = hallEquips.filter(e => isLampLike(e.type)).reduce((a, e) => a + ((e.count || 0) * (e.capacity || 0)), 0);

  const airChanges = volume > 0 && totalAirflow > 0 ? totalAirflow / volume : 0;
  const airAdvice = airChanges === 0 ? 'فنی ثبت نشده'
    : airChanges >= 30 ? 'مناسب تابستان' : airChanges >= 15 ? 'مناسب'
    : airChanges >= 8 ? 'ضعیف — احتمال گرمی' : 'بسیار ضعیف — خطر';
  const airIcon = airChanges === 0 ? '—' : airChanges >= 30 ? '❄️' : airChanges >= 15 ? '✅' : airChanges >= 8 ? '⚠️' : '🔥';

  // 🆕 بازده لامپ بر اساس نوع: LED=۱۰۰ lm/W, فلورسنت=۶۰, قدیمی=۱۵
  const lampLumensPerW = (type: string) => {
    if (type === 'lamp_led') return 100;
    if (type === 'lamp_fluorescent') return 60;
    return 15;
  };
  const totalLumens = hallEquips
    .filter(e => isLampLike(e.type))
    .reduce((a, e) => a + ((e.count || 0) * (e.capacity || 0) * lampLumensPerW(e.type)), 0);
  const lux = area > 0 && totalLumens > 0 ? totalLumens / area : 0;
  const lightAdvice = lux === 0 ? 'لامپی ثبت نشده'
    : lux >= 30 ? 'روشنایی قوی' : lux >= 20 ? 'مناسب تخم‌گذار'
    : lux >= 10 ? 'مناسب پرورش' : 'کم — احتمال افت تولید';
  const lightIcon = lux === 0 ? '—' : lux >= 30 ? '☀️' : lux >= 20 ? '🥚' : lux >= 10 ? '🐣' : '🌙';

  // 🆕 تراکم از استاندارد نژاد سالن (fallback: ۹)
  const hallStd = h.breedId ? breedStd.byBreedId(h.breedId) : null;
  const hallDensity = hallStd?.space?.densityMax ?? 9;
  const realCapacity = area > 0 && h.breedId ? Math.floor(area * hallDensity) : null;
  const hallFlocks = (flocks || []).filter((f: Flock) => f.hallId === h.id && f.status === 'active');
  const totalBirds = hallFlocks.reduce((sum: number, f: Flock) => sum + (f.currentCount || f.initialCount || 0), 0);
  const activeFlock = hallFlocks[0];
  const flockAgeDays = activeFlock ? getAgeDays(activeFlock) : 0;
  const flockBreedId = activeFlock?.breedId || h.breedId || null;
  const flockStandard = flockBreedId ? breedStd.byBreedId(flockBreedId) : null;

  const handleDelete = async () => {
    const ok = await showConfirmAsync('تأیید حذف', 'این سالن حذف شود؟', { danger: true });
    if (!ok) return;
    onUndo(h);
    onDelete(h.id);
    logAction('delete', 'hal', 'حذف از سالن‌ها');
    toastMsg.deleted('سالن');
  };

  return (
    <ExpandableCard key={h.id} id={h.id} ms={ms} accent="accent" index={fmt.int(i + 1)} iconEmoji="🏭"
      title={h.name + (h.code ? ` · ${h.code}` : '')}
      subtitle={h.length ? `${toFa(h.length)}×${toFa(h.width || 0)}×${toFa(h.height || 0)} متر` : 'ابعاد وارد نشده'}
      isOpen={isOpen} onToggle={onToggle}
      badge={<>
        {zoneCount > 0 ? <Tag tone="blue">{fmt.int(zoneCount)} بخش</Tag> : null}
        {hallFlocks.length > 0 ? <Tag tone="green">{fmt.int(hallFlocks.length)} گله</Tag> : null}
      </>}
      stats={<>
        {area > 0 && <span>مساحت: <b style={{ color: 'var(--text)' }}>{toFa(area.toFixed(1))} م²</b></span>}
        {h.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{fmt.int(h.capacity)}</b></span>}
        {equipCount > 0 && <span>تجهیز: <b style={{ color: 'var(--text)' }}>{fmt.int(equipCount)}</b></span>}
        {totalBirds > 0 && <span>پرنده: <b style={{ color: 'var(--text)' }}>{fmt.int(totalBirds)}</b></span>}
      </>}
    >
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📐 ابعاد و ظرفیت</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row l="مساحت" v={`${toFa(area.toFixed(1))} م²`} />
        <Row l="حجم" v={`${toFa(volume.toFixed(1))} م³`} />
        <Row l="ظرفیت" v={h.capacity ? `${fmt.int(h.capacity)} پرنده` : '—'} />
        {realCapacity && !h.capacity && (
          <Row l="ظرفیت پیشنهادی" v={`~${fmt.int(realCapacity)} پرنده (از مساحت)`} accent />
        )}
      </div>

      {(h.birdId || h.breedId || h.responsibleId) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🏷 هویت</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {h.birdId && <Row l="پرنده" v={<EntityLink type="bird" id={h.birdId} label={birdNames?.get(h.birdId) || '—'} />} />}
            {h.breedId && <Row l="نژاد" v={<EntityLink type="breed" id={h.breedId} label={breedNames?.get(h.breedId) || '—'} badge badgeBg="var(--purple-soft)" />} />}
            {h.responsibleId && <Row l="مسئول" v={<EntityLink type="party" id={h.responsibleId} label={workerNames?.get(h.responsibleId) || '—'} />} />}
          </div>
        </>
      )}

      {hallFlocks.length > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🐔 گله‌های فعال ({fmt.int(hallFlocks.length)})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {hallFlocks.map((fl: Flock) => (
              <Row key={fl.id} l={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{fl.paused ? '⏸ ' : ''}<EntityLink type="flock" id={fl.id} label={fl.name} /></span>} v={`${fmt.int(fl.currentCount || fl.initialCount || 0)} پرنده`} />
            ))}
            <Row l="جمع کل" v={`${fmt.int(totalBirds)} پرنده`} accent />
          </div>
        </>
      )}

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🌡 شرایط محیطی</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row l="دمای هدف" v={h.targetTemp != null ? fmt.temp(h.targetTemp) : '—'} />
        <Row l="رطوبت هدف" v={h.targetHumidity ? `${fmt.num(h.targetHumidity, { decimals: 0 })}٪` : '—'} />
        <RowWithStatus l="تهویه"
          v={
            totalAirflow > 0
              ? `${fmt.int(airChanges)} بار تعویض هوا در ساعت`
              : (h.ventilation && h.ventilation > 0)
                ? `${fmt.int(h.ventilation)} m³/h (دستی)`
                : 'ثبت نشده'
          }
          icon={totalAirflow > 0 ? airIcon : undefined}
          hint={totalAirflow > 0 ? airAdvice : undefined} />
        <RowWithStatus l="روشنایی"
          v={
            totalLightW > 0
              ? `${fmt.int(lux)} لوکس`
              : (h.light && h.light > 0)
                ? `${fmt.int(h.light)} لوکس (دستی)`
                : 'ثبت نشده'
          }
          icon={totalLightW > 0 ? lightIcon : undefined}
          hint={totalLightW > 0 ? lightAdvice : undefined} />
        {h.systemNotes && (
          <>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>📝 یادداشت سیستم‌ها</div>
            <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.systemNotes}</div>
          </>
        )}
      </div>

      <HallEquipSection hallId={h.id}
        needInput={{ birdCount: totalBirds, ageDays: flockAgeDays, areaM2: area, volumeM3: volume, standard: flockStandard, litterType: h.litterType }}
        legacy={{ ventilationSystem: h.ventilationSystem, feederType: h.feederType, drinkerType: h.drinkerType, litterType: h.litterType }} />

      {(h.builtAt || h.lastSanitizedAt || equipValue > 0) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📅 زمان‌ها و ارزش</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {h.builtAt && <Row l="تاریخ ساخت" v={toFa(h.builtAt)} />}
            {h.lastSanitizedAt && <Row l="آخرین ضدعفونی" v={toFa(h.lastSanitizedAt)} />}
            {h.sanitizeNotes && <Row l="روش ضدعفونی" v={h.sanitizeNotes} />}
            {equipValue > 0 && <Row l="ارزش تجهیزات" v={fmt.money(equipValue)} accent />}
          </div>
        </>
      )}

      {h.address && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
          <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.address}</div>
        </>
      )}

      {h.notes && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.notes}</div>
        </>
      )}

      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
        <Btn size="sm" onClick={handleDelete} style={{ flex: 1 }}>حذف</Btn>
      </div>
    </ExpandableCard>
  );
}
