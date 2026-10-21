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
import { useFlk, type FlockGroupType } from '../store';
import LifecycleBar from './LifecycleBar';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import FlockHistoryModal from './FlockHistoryModal';
import type { Bird, Breed } from '../../brd/store';
import type { Hall, Zone } from '../../hal/store';
import type { useFormat } from '../../../shr/units';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';

type Fmt = ReturnType<typeof useFormat>;

const GROUP_ICON: Record<FlockGroupType, string> = {
  season: '🗓', breed: '🧬', cohort: '👥', farm: '🏭', owner: '👤', custom: '📁', smart: '🤖',
};

const GROUP_COLORS: Record<FlockGroupType, { bg: string; fg: string; border: string }> = {
  breed:   { bg: 'var(--purple-soft)', fg: 'var(--purple)', border: 'var(--purple)' },
  cohort:  { bg: 'var(--accent-soft)', fg: 'var(--accent)', border: 'var(--accent-border)' },
  smart:   { bg: 'var(--info-soft)',   fg: 'var(--info)',   border: 'var(--info)' },
  farm:    { bg: 'var(--warn-soft)',   fg: 'var(--warn)',   border: 'var(--warn)' },
  owner:   { bg: 'var(--purple-soft)', fg: 'var(--purple)', border: 'var(--purple)' },
  season:  { bg: 'var(--info-soft)',   fg: 'var(--info)',   border: 'var(--info)' },
  custom:  { bg: 'var(--input-bg)',    fg: 'var(--muted)',  border: 'var(--border)' },
};

const GROUP_PRIORITY: Record<FlockGroupType, number> = {
  breed: 1, cohort: 2, smart: 3, farm: 4, owner: 5, season: 6, custom: 7,
};

const DEAL_BADGE: Record<string, { label: string; emoji: string }> = {
  partnership: { label: 'شراکتی', emoji: '🤝' },
  consignment: { label: 'امانی', emoji: '📦' },
  rent: { label: 'اجاره', emoji: '📋' },
};

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
  onOpenGroups: () => void;
}

export default function FlockCard(props: FlockCardProps) {
  const {
    flock: f, index: i, bird, breed, hall, zone,
    invoiceRevenue, vaccineEnabled, isOpen, ms, fmt,
    onToggle, onEdit, onArchive, onRestore, onDelete,
    onToggleHidden, onTogglePaused, onOpenGroups,
  } = props;

  const [historyOpen, setHistoryOpen] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const getGroupsForFlock = useFlk(s => s.getGroupsForFlock);
  const flockGroups = getGroupsForFlock(f.id).slice().sort(
    (a, b) => (GROUP_PRIORITY[a.type] || 99) - (GROUP_PRIORITY[b.type] || 99)
  );
  // 🆕 emoji بر اساس گونه پرنده
  const speciesEmoji = bird?.birdKind === 'duck' ? '🦆' :
                       bird?.birdKind === 'turkey' ? '🦃' :
                       bird?.birdKind === 'quail' ? '🐦' :
                       bird?.birdKind === 'goose' ? '🦢' :
                       bird?.birdKind === 'chicken' ? '🐔' :
                       '🐔';
  const ageDays = getAgeDays(f);
  const lc = getLifecycle(f.type, ageDays, f.endOfCycleDay ?? null, null);
  const isArchived = f.status === 'archived' || f.status === 'sold';
  const ready = isLayingReady(f);
  const untilLay = daysUntilLaying(f);
  const costs = calcCosts(f);
  // 🆕 deal display helpers
  const dealData = (f as any).dealData || {};
  const dealType = (f as any).dealType || 'own';
  const rentAmount = Number(dealData.rentAmount) || 0;
  const rentPeriodLabel: Record<string, string> = { monthly: 'ماهانه', season: 'فصلی', total: 'کل دوره' };
  const partnerShare = Number(dealData.partnerShare) || 0;
  const myShare = Math.max(0, 100 - partnerShare);
  const accentColor: 'accent' | 'dim' = isArchived ? 'dim' : 'accent';

  // 🆕 N Counter: ساخت آرایه badge با اولویت
  const allBadges: Array<{ key: string; node: React.ReactNode }> = [];

  if (!isArchived && !f.sourceInvoiceId && !f.hatchId) {
    allBadges.push({
      key: 'no-source',
      node: (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); setShowAllBadges(false); }}
          title="این گله به هیچ سند لینک نیست — کلیک برای اتصال"
          aria-label="اتصال گله به سند"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px',
            background: 'var(--warn-soft)', color: 'var(--warn)',
            border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)',
            fontSize: 10, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.6,
          }}
        >
          🔗 بدون سند
        </button>
      ),
    });
  }

  if (isArchived) {
    allBadges.push({ key: 'archived', node: <Tag tone="gray">📦 آرشیو</Tag> });
  } else {
    allBadges.push({
      key: 'lifecycle',
      node: <Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : 'blue'}>{lc.label}</Tag>,
    });
  }

  if (f.hidden) allBadges.push({ key: 'hidden', node: <Tag tone="gray">👁</Tag> });
  if (f.paused) allBadges.push({ key: 'paused', node: <Tag tone="amber">⏸</Tag> });

  if (DEAL_BADGE[f.dealType || 'own']) {
    allBadges.push({
      key: 'deal',
      node: <Tag tone="purple">{DEAL_BADGE[f.dealType || 'own'].emoji} {DEAL_BADGE[f.dealType || 'own'].label}</Tag>,
    });
  }

  flockGroups.forEach(g => {
    const c = GROUP_COLORS[g.type] || GROUP_COLORS.custom;
    allBadges.push({
      key: 'group-' + g.id,
      node: (
        <span
          onClick={(e) => { e.stopPropagation(); onOpenGroups(); setShowAllBadges(false); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            padding: '2px 6px', background: c.bg,
            border: '1px solid ' + c.border, borderRadius: 'var(--r-sm)',
            fontSize: 10, fontWeight: 700, color: c.fg,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          title={g.description || g.name}
        >
          {GROUP_ICON[g.type]} {g.name}
        </span>
      ),
    });
  });

  const MAX_VISIBLE = 2;
  const visibleBadges = allBadges.slice(0, MAX_VISIBLE);
  const hiddenBadges = allBadges.slice(MAX_VISIBLE);

  return (
    <>
      <ExpandableCard
      id={f.id}
      ms={ms}
      accent={accentColor}
      index={toFa(i + 1)}
      iconEmoji={speciesEmoji}
      title={f.name}
      subtitle={[bird?.name || '—', breed?.name || (f.breedKind === 'mixed' ? f.breedLabel : ''), hall?.name].filter(Boolean).join(' • ')}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={<>
        {visibleBadges.map(b => <span key={b.key}>{b.node}</span>)}
        {hiddenBadges.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAllBadges(true); }}
            title={'نمایش ' + toFa(hiddenBadges.length) + ' برچسب دیگر'}
            aria-label={'نمایش ' + toFa(hiddenBadges.length) + ' برچسب دیگر'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 7px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            +{toFa(hiddenBadges.length)}
          </button>
        )}
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

      {!isArchived && (
        <LifecycleBar
          type={f.type}
          ageDays={ageDays}
          endOfCycleDay={f.endOfCycleDay ?? null}
        />
      )}

      {f.mergedInfo && f.mergedInfo.sources.length > 1 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🔗 ادغام‌شده</div>
          <div style={{
            padding: 10,
            background: 'var(--purple-soft)',
            border: '1px solid var(--purple)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-xs)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, marginBottom: 6 }}>
              ادغام در {f.mergedInfo.mergedAt.slice(0, 10)} — {toFa(f.mergedInfo.sources.length)} منبع
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {f.mergedInfo.sources.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: idx < (f.mergedInfo?.sources.length ?? 0) - 1 ? '1px dashed var(--border)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--text)' }}>
                    {idx === 0 ? '📦 گله اصلی' : `📦 منبع ${toFa(idx + 1)}`} — {src.flockName}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>
                    {fmt.int(src.count)} پرنده ({fmt.int(src.ageDays)} روز)
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <span style={{ color: 'var(--purple)', fontWeight: 700 }}>
                👥 جمع: {fmt.int(f.initialCount)} پرنده
              </span>
              <span style={{ color: 'var(--purple)', fontWeight: 700 }}>
                🎂 سن میانگین: {toFa(f.mergedInfo.avgAgeDays.toFixed(1))} روز
              </span>
            </div>
          </div>
        </>
      )}

      {(bird || breed) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🐔 پرنده و نژاد</div>
          <RowGrid>
            {bird && <Row l="پرنده" v={<EntityLink type="bird" id={bird.id} label={bird.name} />} />}
            {breed && <Row l="نژاد" v={<EntityLink type="breed" id={breed.id} label={breed.name} badge badgeBg="var(--purple-soft)" />} />}
            {!breed && f.breedKind === 'mixed' && f.breedLabel && (
              <Row l="نژاد" v={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-sm)', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-sm)', background: 'var(--dim-soft, var(--input-bg))', color: 'var(--muted)' }}>🔀 {f.breedLabel} <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 400, color: 'var(--dim)' }}>(مختلط)</span></span>} />
            )}
          </RowGrid>
        </>
      )}

      {(hall || zone) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 مکان</div>
          <RowGrid>
            {hall && <Row l="سالن" v={<EntityLink type="hall" id={hall.id} label={hall.name} />} />}
            {zone && <Row l="بخش" v={<EntityLink type="zone" id={zone.id} label={zone.name} />} />}
          </RowGrid>
        </>
      )}

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📊 مشخصات</div>
      <RowGrid>
        {ageDays > 0 && <Row l="سن" v={`${fmt.int(ageDays)} روز`} />}
        {f.initialCount != null && <Row l="تعداد اولیه" v={toFa(f.initialCount)} />}
        {f.currentCount != null && <Row l="تعداد فعلی" v={fmt.int(f.currentCount)} />}
        {f.initialCount != null && f.currentCount != null && f.initialCount !== f.currentCount && (
          <Row l="تلفات" v={`${fmt.int(f.initialCount - f.currentCount)} (${toFa(((f.initialCount - f.currentCount) / f.initialCount * 100).toFixed(1))}٪)`} />
        )}
        {f.type === 'breeder' && ((f.maleCount ?? 0) + (f.femaleCount ?? 0) + (f.unknownCount ?? 0) > 0) && (
          <>
            {(f.maleCount ?? 0) > 0 && <Row l="تعداد نر" v={fmt.int(f.maleCount)} />}
            {(f.femaleCount ?? 0) > 0 && <Row l="تعداد ماده" v={fmt.int(f.femaleCount)} />}
            {(f.unknownCount ?? 0) > 0 && <Row l="جنسیت نامشخص" v={fmt.int(f.unknownCount)} />}
            {f.maleCount != null && f.femaleCount != null && f.maleCount > 0 && f.femaleCount > 0 && (
              <Row l="نسبت نر/ماده" v={sexRatio(f.maleCount, f.femaleCount)} />
            )}
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

      {costs.total > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>💰 هزینه‌ها</div>
          <RowGrid>
            {costs.birdCost > 0 && <Row l="قیمت پرنده‌ها" v={fmt.money(costs.birdCost)} />}
            {costs.delivery > 0 && <Row l="هزینه حمل" v={fmt.money(costs.delivery)} />}
            {costs.other > 0 && <Row l="سایر" v={fmt.money(costs.other)} />}
            {dealType === 'rent' && rentAmount > 0 && (
              <Row l={`اجاره (${rentPeriodLabel[dealData.rentPeriod || 'monthly'] || 'ماهانه'})`} v={`${fmt.money(rentAmount)} ⚠️`} />
            )}
            <Row l="جمع کل" v={fmt.money(costs.total)} accent />
            {costs.perBird > 0 && <Row l="هر پرنده" v={fmt.money(Math.round(costs.perBird))} accent />}
          </RowGrid>
        </>
      )}

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
              {dealType === 'partnership' && partnerShare > 0 && (
                <>
                  <Row l={`سهم شریک (${toFa(partnerShare)}٪)`} v={fmt.money(Math.round(profit * partnerShare / 100))} />
                  <Row l={`سهم شما (${toFa(myShare)}٪)`} v={fmt.money(Math.round(profit * myShare / 100))} accent={isProfit} />
                </>
              )}
            </RowGrid>
          </>
        );
      })()}

      {isArchived && f.archivedReason && (
        <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', color: 'var(--warn)' }}>
          <b>دلیل آرشیو:</b> {f.archivedReason}
        </div>
      )}

      {f.notes && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
        </>
      )}

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
            <Btn size="sm" onClick={onOpenGroups} style={{ flex: 1 }}>📁 گروه‌ها</Btn>
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
    {showAllBadges && typeof document !== 'undefined' && createPortal(
      <div
        onClick={() => setShowAllBadges(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 5000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card-solid)',
            borderRadius: 'var(--r-lg)',
            padding: 16,
            maxWidth: 360,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)' }}>برچسب‌های «{f.name}»</div>
            <button
              type="button"
              onClick={() => setShowAllBadges(false)}
              aria-label="بستن"
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--input-bg)', border: '1px solid var(--border)',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text)', fontSize: 16,
              }}
            >✕</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allBadges.map(b => <span key={b.key}>{b.node}</span>)}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
