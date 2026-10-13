/**
 * FlockCard.tsx — کارت نمایش یک گله
 */
import {
  type Flock, SOURCE_LABEL, getAgeDays, getLifecycle,
  sexRatio, daysUntilLaying, isLayingReady, calcCosts,
  DEFAULT_LAYING_START,
} from '../store';
import { getSchedule } from '../../cal/vaccineSchedules';
import { toFa } from '../../../shr/utils/fa';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { Row } from '../helpers';
import { showPromptAsync } from '../../../cor/store/dialog';

export interface FlockCardProps {
  flock: Flock;
  index: number;
  bird: any;
  breed: any;
  hall: any;
  zone: any;
  invoiceRevenue: number;
  vaccineEnabled: boolean;
  isOpen: boolean;
  ms: any;
  fmt: any;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: (reason: string) => void;
  onRestore: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
  onTogglePaused: () => void;
}

export default function FlockCard(props: FlockCardProps) {
  const {
    flock: f, index: i, bird, breed, hall, zone,
    invoiceRevenue, vaccineEnabled, isOpen, ms, fmt,
    onToggle, onEdit, onArchive, onRestore, onDelete,
    onToggleHidden, onTogglePaused,
  } = props;

  const ageDays = getAgeDays(f);
  const lc = getLifecycle(f.type, ageDays, f.endOfCycleDay ?? null, bird?.cycleDays ?? null);
  const isArchived = f.status === 'archived' || f.status === 'sold';
  const ready = isLayingReady(f);
  const untilLay = daysUntilLaying(f);
  const costs = calcCosts(f);
  const accentColor: any = isArchived ? 'dim' : lc.color;

  const handleArchive = async () => {
    const reason = await showPromptAsync(
      'آرشیو گله',
      'آرشیو «' + f.name + '»؟ این گله به بخش آرشیو منتقل می‌شود.',
      {
        label: 'دلیل آرشیو',
        placeholder: 'مثلاً: فروش، پایان چرخه، تلفات کامل...',
        required: true,
        multiline: true,
        rows: 2,
        confirmText: 'آرشیو کن',
      }
    );
    if (reason === null || !reason.trim()) return;
    onArchive(reason.trim());
  };

  const handleDelete = () => {
    onDelete();
  };

  return (
    <ExpandableCard
      id={f.id}
      ms={ms}
      accent={accentColor}
      index={toFa(i + 1)}
      iconEmoji="🐔"
      title={f.name}
      subtitle={[bird?.name || '—', breed?.name, hall?.name].filter(Boolean).join('  |  ')}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={<>
        <Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : lc.color === 'blue' ? 'blue' : 'gray'}>{isArchived ? 'آرشیو' : lc.label}</Tag>
        {f.sourceInvoiceId && <Tag tone="blue">🛒 فاکتور</Tag>}
        {f.hidden && <Tag tone="gray">👁 پنهان</Tag>}
        {f.paused && <Tag tone="amber">⏸ غیرفعال</Tag>}
        {!f.hallId && <Tag tone="amber">🏠 بدون سالن</Tag>}
        {ready && !isArchived && (f.type === 'layer' || f.type === 'breeder') && <Tag tone="green">✅ آماده</Tag>}
      </>}
      stats={<>
        {ageDays > 0 && <span>🎂 <b style={{ color: 'var(--text)' }}>{fmt.int(ageDays)} روز</b></span>}
        {f.currentCount && <span>🐔 <b style={{ color: 'var(--text)' }}>{fmt.int(f.currentCount)}</b></span>}
        {f.initialCount != null && f.currentCount != null && (f.initialCount - f.currentCount) > 0 && (() => {
          const deaths = f.initialCount - f.currentCount;
          const deathsPct = f.initialCount > 0 ? (deaths / f.initialCount) * 100 : 0;
          const danger = deathsPct > 5;
          return (
            <span style={{ color: danger ? 'var(--danger)' : 'var(--warn)', fontWeight: danger ? 700 : 500 }}>
              💀 <b>{fmt.int(deaths)}</b> {danger ? `(${fmt.int(Math.round(deathsPct))}٪)` : ''}
            </span>
          );
        })()}
        {costs.perBird > 0 && <span>💰 <b style={{ color: 'var(--text)' }}>{fmt.money(Math.round(costs.perBird))}</b></span>}
        {!ready && !isArchived && untilLay > 0 && (
          <span style={{ color: 'var(--warn)' }}>⏳ <b>{fmt.int(untilLay)} روز</b></span>
        )}
      </>}
    >
      {/* نوار پیشرفت */}
      {!isArchived && (
        <div style={{ height: 36, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, lc.progress)}%`,
            background: lc.color === 'green' ? 'linear-gradient(90deg, var(--accent), #16a34a)' : lc.color === 'amber' ? 'linear-gradient(90deg, var(--warn), #dc2626)' : 'linear-gradient(90deg, var(--accent), #16a34a)',
            borderRadius: 4
          }} />
        </div>
      )}

      {/* تاریخ‌ها */}
      {(f.hatchDate || f.purchaseDate || f.startDate) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📅 تاریخ‌ها</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {f.hatchDate && <Row l="هچ" v={toFa(f.hatchDate)} autoFrom={f.sourceInvoiceId ? 'فاکتور خرید' : undefined} />}
            {f.purchaseDate && <Row l="خرید" v={toFa(f.purchaseDate)} />}
            {f.startDate && <Row l="شروع نگهداری" v={toFa(f.startDate)} />}
          </div>
        </>
      )}

      {/* مشخصات */}
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📊 مشخصات</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ageDays > 0 && <Row l="سن (روز)" v={`${fmt.int(ageDays)} روز`} />}
        {f.initialCount && <Row l="تعداد اولیه" v={toFa(f.initialCount)} autoFrom={f.sourceInvoiceId ? 'فاکتور خرید' : undefined} />}
        {f.currentCount && <Row l="تعداد فعلی" v={fmt.int(f.currentCount)} />}
        {f.initialCount && f.currentCount && f.initialCount !== f.currentCount && (
          <Row l="تلفات" v={`${fmt.int(f.initialCount - f.currentCount)} (${toFa(((f.initialCount - f.currentCount) / f.initialCount * 100).toFixed(1))}٪)`} />
        )}
        {f.type === 'breeder' && f.maleCount != null && f.femaleCount != null && f.maleCount > 0 && f.femaleCount > 0 && (
          <>
            <Row l="تعداد خروس" v={fmt.int(f.maleCount)} />
            <Row l="تعداد مرغ" v={fmt.int(f.femaleCount)} />
            <Row l="نسبت خروس/مرغ" v={sexRatio(f.maleCount, f.femaleCount)} />
          </>
        )}
        {breed && <Row l="نژاد" v={breed.name} autoFrom={f.sourceInvoiceId ? 'فاکتور خرید' : undefined} />}
        {hall && <Row l="سالن" v={hall.name} />}
        {zone && <Row l="بخش" v={zone.name} />}
        <Row l="منبع" v={SOURCE_LABEL[f.source] || '—'} />
        {f.endOfCycleDay && <Row l="چرخه زندگی" v={`${fmt.int(f.endOfCycleDay)} روز`} />}
        {(() => {
          if (f.type !== 'layer' && f.type !== 'breeder') return null;
          const layStart = f.layingStartDay || DEFAULT_LAYING_START;
          const fromStd = !f.layingStartDay;
          return <Row l="سن تخم‌گذاری" v={`${fmt.int(layStart)} روز${fromStd ? ' (پیش‌فرض)' : ''}`} />;
        })()}
        {vaccineEnabled && f.vaccineScheduleId && (() => {
          const sch = getSchedule(f.vaccineScheduleId);
          if (!sch) return null;
          return <Row l="برنامه واکسن" v={`${sch.label} · ${toFa(sch.items.length)} مرحله`} />;
        })()}
      </div>

      {/* هزینه‌ها */}
      {costs.total > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>💰 هزینه‌ها</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {costs.birdCost > 0 && <Row l="قیمت پرنده‌ها" v={fmt.money(costs.birdCost)} autoFrom={f.sourceInvoiceId ? 'فاکتور خرید' : undefined} />}
            {costs.delivery > 0 && <Row l="هزینه حمل" v={fmt.money(costs.delivery)} autoFrom={f.sourceInvoiceId ? 'فاکتور خرید' : undefined} />}
            {costs.other > 0 && <Row l="سایر" v={fmt.money(costs.other)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
              <span>جمع کل:</span>
              <span>{fmt.money(costs.total)}</span>
            </div>
            {costs.perBird > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                <span>💰 هر پرنده:</span>
                <span>{fmt.money(Math.round(costs.perBird))}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* درآمد و ROI */}
      {(() => {
        const revenue = invoiceRevenue;
        if (revenue === 0 && costs.total === 0) return null;
        const profit = revenue - costs.total;
        const roi = costs.total > 0 ? (profit / costs.total) * 100 : 0;
        const isProfit = profit >= 0;
        const color = isProfit ? 'var(--accent)' : 'var(--danger)';
        return (
          <>
            <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📊 درآمد و سود</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Row l="فروش کل" v={fmt.money(revenue)} />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                background: isProfit ? 'var(--accent-soft)' : 'var(--danger-soft)',
                color: color, borderRadius: 'var(--r-sm)', fontWeight: 700,
              }}>
                <span>{isProfit ? '📈 سود خالص:' : '📉 زیان:'}</span>
                <span>{fmt.money(Math.abs(profit))}</span>
              </div>
              {costs.total > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                  background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontWeight: 700,
                }}>
                  <span>ROI:</span>
                  <span style={{ color }}>{toFa(roi.toFixed(1))}٪</span>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* دلیل آرشیو */}
      {isArchived && f.archivedReason && (
        <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', color: 'var(--warn)' }}>
          <b>دلیل آرشیو:</b> {f.archivedReason}
        </div>
      )}

      {/* کنترل گله */}
      {!isArchived && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🎛 کنترل گله</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn size="sm" onClick={onToggleHidden} style={{ flex: 1 }}>
              {f.hidden ? '👁 نمایان' : '👁 پنهان'}
            </Btn>
            <Btn size="sm" onClick={onTogglePaused} style={{ flex: 1 }}>
              {f.paused ? '▶️ فعال' : '⏸ غیرفعال'}
            </Btn>
          </div>
        </>
      )}

      {/* یادداشت */}
      {f.notes && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
        </>
      )}

      {/* دکمه‌ها */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        {isArchived ? (
          <>
            <Btn size="sm" onClick={onRestore} style={{ flex: 1 }}>بازگردانی</Btn>
            <Btn size="sm" onClick={handleDelete} style={{ flex: 1 }}>حذف</Btn>
          </>
        ) : (
          <>
            <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
            <Btn size="sm" onClick={handleArchive} style={{ flex: 1 }}>آرشیو</Btn>
          </>
        )}
      </div>
    </ExpandableCard>
  );
}
