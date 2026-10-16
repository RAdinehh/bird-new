/**
 * FlockCard.tsx — کارت نمایش یک گله
 * طراحی: Grid2 برای فیلدهای کوتاه + EntityLink بین‌ماژولی
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
import EntityLink from '../../../shr/components/EntityLink';
import { Row, RowGrid } from '../helpers';
import LifecycleBar from './LifecycleBar';
import { useState } from 'react';
import FlockHistoryModal from './FlockHistoryModal';
import type { Bird, Breed } from '../../brd/store';
import type { Hall, Zone } from '../../hal/store';
import type { useFormat } from '../../../shr/units';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';

type Fmt = ReturnType<typeof useFormat>;

export interface FlockCardProps {
  flock: Flock;
  index: number;
  bird: Bird | null | undefined;
  breed: Breed | null | undefined;
  hall: Hall | null | undefined;
  zone: Zone | null | undefined;
  invoiceRevenue: number;
  vaccineEnabled: boolean;
  isOpen: boolean;
  ms: MultiSelectState<Flock>;
  fmt: Fmt;
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

  const [historyOpen, setHistoryOpen] = useState(false);
  const ageDays = getAgeDays(f);
  const lc = getLifecycle(f.type, ageDays, f.endOfCycleDay ?? null, null);
  const isArchived = f.status === 'archived' || f.status === 'sold';
  const ready = isLayingReady(f);
  const untilLay = daysUntilLaying(f);
  const costs = calcCosts(f);
  const accentColor: 'accent' | 'dim' = isArchived ? 'dim' : 'accent';

  return (
    <ExpandableCard
      id={f.id}
      ms={ms}
      accent={accentColor}
      index={toFa(i + 1)}
      iconEmoji="🐔"
      title={f.name}
      subtitle={[bird?.name || '—', breed?.name, hall?.name].filter(Boolean).join(' • ')}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={<>
        {isArchived ? (
          <Tag tone="gray">📦 آرشیو</Tag>
        ) : (
          <Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : 'blue'}>
            {lc.label}
          </Tag>
        )}
        {f.hidden && <Tag tone="gray">👁</Tag>}
        {f.paused && <Tag tone="amber">⏸</Tag>}
      </>}
      stats={<>
        {ageDays > 0 && <span>🎂 <b style={{ color: 'var(--text)' }}>{fmt.int(ageDays)} روز</b></span>}
        {f.currentCount != null && <span>🐔 <b style={{ color: 'var(--text)' }}>{fmt.int(f.currentCount)}</b></span>}
        {f.initialCount != null && f.currentCount != null && (f.initialCount - f.currentCount) > 0 && (() => {
          const deaths = f.initialCount - f.currentCount;
          const deathsPct = f.initialCount > 0 ? (deaths / f.initialCount) * 100 : 0;
          const danger = deathsPct > 5;
          return (
            <span style={{ color: danger ? 'var(--danger)' : 'var(--warn)', fontWeight: danger ? 700 : 500 }}>
              💀 <b>{fmt.int(deaths)}</b>{danger ? ` (${fmt.int(Math.round(deathsPct))}٪)` : ''}
            </span>
          );
        })()}
        {costs.perBird > 0 && <span>💰 <b style={{ color: 'var(--text)' }}>{fmt.money(Math.round(costs.perBird))}</b></span>}
      </>}
    >
      {/* نوار چرخه زندگی — ۳ مرحله + نشانگر موقعیت */}
      {!isArchived && (
        <LifecycleBar
          type={f.type}
          ageDays={ageDays}
          endOfCycleDay={f.endOfCycleDay ?? null}
        />
      )}

      {/* 🐔 پرنده و نژاد */}
      {(bird || breed) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🐔 پرنده و نژاد</div>
          <RowGrid>
            {bird && <Row l="پرنده" v={<EntityLink type="bird" id={bird.id} label={bird.name} />} />}
            {breed && <Row l="نژاد" v={<EntityLink type="breed" id={breed.id} label={breed.name} badge badgeBg="var(--purple-soft)" />} />}
          </RowGrid>
        </>
      )}

      {/* 📍 مکان */}
      {(hall || zone) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 مکان</div>
          <RowGrid>
            {hall && <Row l="سالن" v={<EntityLink type="hall" id={hall.id} label={hall.name} />} />}
            {zone && <Row l="بخش" v={<EntityLink type="zone" id={zone.id} label={zone.name} />} />}
          </RowGrid>
        </>
      )}

      {/* 📊 مشخصات */}
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📊 مشخصات</div>
      <RowGrid>
        {ageDays > 0 && <Row l="سن" v={`${fmt.int(ageDays)} روز`} />}
        {f.initialCount != null && <Row l="تعداد اولیه" v={toFa(f.initialCount)} />}
        {f.currentCount != null && <Row l="تعداد فعلی" v={fmt.int(f.currentCount)} />}
        {f.initialCount != null && f.currentCount != null && f.initialCount !== f.currentCount && (
          <Row l="تلفات" v={`${fmt.int(f.initialCount - f.currentCount)} (${toFa(((f.initialCount - f.currentCount) / f.initialCount * 100).toFixed(1))}٪)`} />
        )}
        {f.type === 'breeder' && f.maleCount != null && f.femaleCount != null && f.maleCount > 0 && f.femaleCount > 0 && (
          <>
            <Row l="تعداد نر" v={fmt.int(f.maleCount)} />
            <Row l="تعداد ماده" v={fmt.int(f.femaleCount)} />
            <Row l="نسبت نر/ماده" v={sexRatio(f.maleCount, f.femaleCount)} />
          </>
        )}
        <Row l="منبع" v={SOURCE_LABEL[f.source] || '—'} />
        {f.endOfCycleDay && <Row l="چرخه زندگی" v={`${fmt.int(f.endOfCycleDay)} روز`} />}
        {(() => {
          if (f.type !== 'layer' && f.type !== 'breeder') return null;
          const layStart = f.layingStartDay || DEFAULT_LAYING_START;
          const fromStd = !f.layingStartDay;
          return <Row l="سن تخم‌گذاری" v={`${fmt.int(layStart)} روز${fromStd ? ' (استاندارد)' : ''}`} />;
        })()}
        {vaccineEnabled && f.vaccineScheduleId && (() => {
          const sch = getSchedule(f.vaccineScheduleId);
          if (!sch) return null;
          return <Row l="برنامه واکسن" v={`${sch.label} • ${toFa(sch.items.length)} مرحله`} />;
        })()}
      </RowGrid>

      {/* 📅 تاریخ‌ها */}
      {(f.hatchDate || f.purchaseDate || f.startDate) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📅 تاریخ‌ها</div>
          <RowGrid>
            {f.hatchDate && <Row l="هچ" v={toFa(f.hatchDate)} />}
            {f.purchaseDate && <Row l="خرید" v={toFa(f.purchaseDate)} />}
            {f.startDate && <Row l="شروع" v={toFa(f.startDate)} />}
          </RowGrid>
        </>
      )}

      {/* 💰 هزینه‌ها */}
      {costs.total > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>💰 هزینه‌ها</div>
          <RowGrid>
            {costs.birdCost > 0 && <Row l="قیمت پرنده‌ها" v={fmt.money(costs.birdCost)} />}
            {costs.delivery > 0 && <Row l="هزینه حمل" v={fmt.money(costs.delivery)} />}
            {costs.other > 0 && <Row l="سایر" v={fmt.money(costs.other)} />}
            <Row l="جمع کل" v={fmt.money(costs.total)} accent />
            {costs.perBird > 0 && <Row l="هر پرنده" v={fmt.money(Math.round(costs.perBird))} accent />}
          </RowGrid>
        </>
      )}

      {/* 📈 درآمد و سود */}
      {(() => {
        const revenue = invoiceRevenue;
        if (revenue === 0 && costs.total === 0) return null;
        const profit = revenue - costs.total;
        const roi = costs.total > 0 ? (profit / costs.total) * 100 : 0;
        const isProfit = profit >= 0;
        const color = isProfit ? 'var(--accent)' : 'var(--danger)';
        return (
          <>
            <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📈 درآمد و سود</div>
            <RowGrid>
              {f.sourceInvoiceId && (
                <Row l="فاکتور خرید" v={<EntityLink type="invoice" id={f.sourceInvoiceId} label="مشاهده" />} />
              )}
              <Row l="فروش کل" v={fmt.money(revenue)} />
              <Row l={isProfit ? 'سود خالص' : 'زیان'} v={fmt.money(Math.abs(profit))} accent={isProfit} />
              {costs.total > 0 && <Row l="ROI" v={`${toFa(roi.toFixed(1))}٪`} />}
            </RowGrid>
          </>
        );
      })()}

      {/* دلیل آرشیو */}
      {isArchived && f.archivedReason && (
        <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', color: 'var(--warn)' }}>
          <b>دلیل آرشیو:</b> {f.archivedReason}
        </div>
      )}

      {/* 📝 یادداشت */}
      {f.notes && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
        </>
      )}

      {/* دکمه‌ها */}
      {isArchived ? (
        <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-1)' }}>
          <Btn size="sm" onClick={onRestore} style={{ flex: 1 }}>بازگردانی</Btn>
          <Btn size="sm" onClick={onDelete} style={{ flex: 1 }}>حذف</Btn>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-1)' }}>
            <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
            <Btn size="sm" onClick={() => setHistoryOpen(true)} style={{ flex: 1 }}>📜 تاریخچه</Btn>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Btn size="sm" onClick={onToggleHidden} style={{ flex: 1 }}>
              {f.hidden ? '👁 نمایان' : '👁 پنهان'}
            </Btn>
            <Btn size="sm" onClick={onTogglePaused} style={{ flex: 1 }}>
              {f.paused ? '▶️ فعال' : '⏸ غیرفعال'}
            </Btn>
          </div>
        </>
      )}

      <FlockHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        flock={f}
      />
    </ExpandableCard>
  );
}
