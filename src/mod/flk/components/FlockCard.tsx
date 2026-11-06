/**
 * FlockCard.tsx — کارت نمایش یک گله
 * طراحی: Grid2 برای فیلدهای کوتاه + EntityLink بین‌ماژولی
 */
import { showConfirmAsync } from '../../../cor/store/dialog';
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
import { Row, RowGrid, computeFlockConsumption } from '../helpers';
import { useFlk, type FlockGroupType } from '../store';
import { useTra } from '../../tra/store';
import LifecycleBar from './LifecycleBar';
import { useState, useMemo } from 'react';
import { BadgeOverflow } from '../../../shr/components/ui/BadgeOverflow';

import FlockHistoryModal from './FlockHistoryModal';
import type { Bird, Breed } from '../../brd/store';
import type { Hall, Zone } from '../../hal/store';
import type { useFormat } from '../../../shr/units';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';
import { CardActions } from '../../../shr/components/ui';
import FlockValueSection from './FlockValueSection';
import { useWhs } from '../../whs/store';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
import { HELP } from '../../../shr/help/helpTexts';
import UnmergeFlocksModal from './UnmergeFlocksModal';
import MergedEditBlockModal from './MergedEditBlockModal';
import SexingModal from './SexingModal';
import SexingHistoryModal from './SexingHistoryModal';
import { useBreedStandard } from '../../../shr/hooks/useBreedStandard';

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
  const [unmergeOpen, setUnmergeOpen] = useState(false);
  const [sexingOpen, setSexingOpen] = useState(false);
  const [sexingHistoryOpen, setSexingHistoryOpen] = useState(false);
  const [editBlockOpen, setEditBlockOpen] = useState(false);

  const isMerged = f.status === 'merged' || (f.mergedInfo?.sources?.length || 0) >= 2;

  const handleEditGuard = () => {
    if (isMerged) {
      setEditBlockOpen(true);
      return;
    }
    onEdit();
  };

  const getGroupsForFlock = useFlk(s => s.getGroupsForFlock);
  const whsMovements = useWhs(s => s.movements);
  const whsItems = useWhs(s => s.items);
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
  const breedStd = useBreedStandard();
    const ageDays = getAgeDays(f);
  const lc = getLifecycle(f.type, ageDays, f.endOfCycleDay ?? null, null, f.layingStartDay ?? null);
  const isArchived = f.status === 'archived' || f.status === 'sold';
  const ready = isLayingReady(f);
  const untilLay = daysUntilLaying(f);
  const costs = calcCosts(f);
  // 🆕 بهای تمام‌شده شامل مصرف انبار (دان + دارو + گیاهی + واکسن)
  const consumption = computeFlockConsumption(f.id, whsMovements, whsItems);
  const totalCost = (costs.grandTotalOwed || 0) + (consumption.totalCost || 0);
  // 🆕 deal display helpers
  const dealData = (f as any).dealData || {};
  const dealType = (f as any).dealType || 'own';
  const rentAmount = Number(dealData.rentAmount) || 0;
  const rentPeriodLabel: Record<string, string> = { monthly: 'ماهانه', season: 'فصلی', total: 'کل دوره' };
  const partnerShare = Number(dealData.partnerShare) || 0;
  const myShare = Math.max(0, 100 - partnerShare);
  const accentColor: 'accent' | 'dim' = isArchived ? 'dim' : 'accent';

  // 🆕 N Counter: ساخت آرایه badge با اولویت
  const deals = useTra(s => s.deals);
  const consignmentCount = useMemo(() => {
    let total = 0;
    for (const deal of deals) {
      if (deal.status === 'cancelled') continue;
      for (const good of deal.goods || []) {
        if (good.existingFlockId !== f.id) continue;
        const dvs = (deal.deliveries || []).filter((dv: any) => dv.goodId === good.id);
        const out = dvs.filter((dv: any) => dv.type === 'out').reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
        const ret = dvs.filter((dv: any) => dv.type === 'return').reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
        const loss = dvs.filter((dv: any) => dv.type === 'loss').reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
        const sold = (deal.sales || []).filter((s: any) => s.goodId === good.id).reduce((s: number, x: any) => s + (x.quantity || 0), 0);
        total += Math.max(0, out - ret - loss - sold);
      }
    }
    return total;
  }, [f.id, deals]);

  // آیا این گله امانی، تلفات از محل طرف داره؟
  const hasConsignmentLosses = useMemo(() => {
    if (dealType !== 'consignment') return false;
    let totalLoss = 0;
    for (const deal of deals) {
      if (deal.status === 'cancelled') continue;
      for (const good of deal.goods || []) {
        if (good.existingFlockId !== f.id) continue;
        const dvs = (deal.deliveries || []).filter((dv: any) => dv.goodId === good.id && dv.type === 'loss');
        totalLoss += dvs.reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
      }
    }
    return totalLoss > 0;
  }, [f.id, deals, dealType]);

  const allBadges: Array<{ key: string; node: React.ReactNode }> = [];

  if (!isArchived && !f.sourceInvoiceId && !f.hatchId) {
    allBadges.push({
      key: 'no-source',
      node: (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); void handleEditGuard(); }}
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
          بدون سند
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

  // 🆕 badge «ادغام‌شده» برای گله‌های ساخته‌شده از ادغام
  const _mergedSourcesCount = f.mergedInfo?.sources?.length || 0;
  if (_mergedSourcesCount >= 2) {
    allBadges.push({
      key: 'merged',
      node: (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '2px 7px',
          background: 'var(--purple-soft)',
          color: 'var(--purple)',
          border: '1px solid var(--purple)',
          borderRadius: 'var(--r-sm)',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1.6,
        }}>🔗 ادغام‌شده ({toFa(_mergedSourcesCount)})</span>
      ),
    });
  }

  // 🆕 badge ⏰ زمان تفکیک (breeder بدون genderSplitAt که سن به sexingAge رسیده)
  if (f.type === 'breeder' && !f.genderSplitAt) {
    const _sexingAge = f.sexingAgeOverride ?? breedStd.byBreedId(f.breedId)?.sexingAgeDay;
    if (_sexingAge != null && ageDays >= _sexingAge) {
      allBadges.push({
        key: 'sexing-reminder',
        node: <Tag tone="amber">⏰ زمان تفکیک</Tag>,
      });
    }
  }

  flockGroups.forEach(g => {
    const c = GROUP_COLORS[g.type] || GROUP_COLORS.custom;
    allBadges.push({
      key: 'group-' + g.id,
      node: (
        <span
          onClick={(e) => { e.stopPropagation(); onOpenGroups(); }}
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
      badge={<BadgeOverflow badges={allBadges} max={2} modalTitle={`برچسب‌های «${f.name}»`} />}
      stats={<>
        {ageDays > 0 && <span>🎂 <b style={{ color: 'var(--text)' }}>{fmt.int(ageDays)} روز</b></span>}
        {f.currentCount != null && <span>🐔 <b style={{ color: 'var(--text)' }}>{fmt.int(f.currentCount)}</b></span>}
        {consignmentCount > 0 && <span style={{ color: 'var(--purple)', fontWeight: 600 }} title="در دست طرف">📤 <b>{fmt.int(consignmentCount)}</b></span>}
        {f.initialCount != null && f.currentCount != null && (() => {
          const events = ((f as any).events || []).filter((e: any) => !e.revoked);
          const eventSales = events.filter((e: any) => e.type === 'sell').reduce((s: number, e: any) => s + (e.count || 0), 0);
          const eventDeaths = events.filter((e: any) => e.type === 'death' || e.type === 'cull').reduce((s: number, e: any) => s + (e.count || 0), 0);
          const deaths = eventDeaths;
          const deathsPct = (f.initialCount ?? 0) > 0 ? (deaths / (f.initialCount ?? 1)) * 100 : 0;
          const danger = deathsPct > 5;
          if (eventSales === 0 && deaths === 0) return null;
          return (
            <>
              {eventSales > 0 && (
                <span style={{ color: 'var(--purple)', fontWeight: 500 }} title="تعداد فروخته‌شده">
                  🏷 <b>{fmt.int(eventSales)}</b>
                </span>
              )}
              {deaths > 0 && (
                <span style={{ color: danger ? 'var(--danger)' : 'var(--warn)', fontWeight: danger ? 700 : 500 }} title="تلفات">
                  💀 <b>{fmt.int(deaths)}</b>{deathsPct > 0 ? ` (${toFa(deathsPct.toFixed(1))}٪)` : ''}
                </span>
              )}
            </>
          );
        })()}
        
      </>}
    >

      {!isArchived && (
        <LifecycleBar
          type={f.type}
          ageDays={ageDays}
          endOfCycleDay={f.endOfCycleDay ?? null}
          layingStartDay={f.layingStartDay ?? null}
        />
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
        {f.initialCount != null && <Row l="تعداد اولیه" v={toFa(f.initialCount)} />}
        {f.initialCount != null && (() => {
          const evs = ((f as any).events || []).filter((e: any) => !e.revoked);
          const evSales = evs.filter((e: any) => e.type === 'sell').reduce((s: number, e: any) => s + (e.count || 0), 0);
          const evDeaths = evs.filter((e: any) => e.type === 'death' || e.type === 'cull').reduce((s: number, e: any) => s + (e.count || 0), 0);
          const unmatched = Math.max(0, (f.initialCount ?? 0) - (f.currentCount ?? 0) - evSales - evDeaths - consignmentCount);
          return (
            <>
              {evDeaths > 0 && <Row l="تلفات" v={`${fmt.int(evDeaths)} (${toFa(((evDeaths / (f.initialCount || 1)) * 100).toFixed(1))}٪)`} />}
              {evSales > 0 && <Row l="فروش" v={fmt.int(evSales)} />}
              {consignmentCount > 0 && <Row l="در دست طرف" v={fmt.int(consignmentCount)} />}
              {unmatched > 0 && <Row l="تعدیل نامشخص" v={`${fmt.int(unmatched)} (بررسی کنید)`} accent />}
            </>
          );
        })()}
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

      {(costs.total > 0 || consumption.totalCost > 0) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>💰 هزینه‌ها</div>
          <RowGrid>
            {costs.birdCost > 0 && <Row l="قیمت پرنده‌ها" v={fmt.money(costs.birdCost)} />}
            {costs.delivery > 0 && <Row l="هزینه حمل" v={fmt.money(costs.delivery)} />}
            {costs.other > 0 && <Row l="سایر" v={fmt.money(costs.other)} />}
            {dealType === 'rent' && costs.rentOwed > 0 && (
              <>
                <Row l={`اجاره انباشته (${rentPeriodLabel[dealData.rentPeriod || 'monthly'] || 'ماهانه'})`} v={fmt.money(costs.rentOwed)} />
                {costs.rentInfo.paid > 0 && (
                  <Row l="پرداخت‌شده" v={fmt.money(costs.rentInfo.paid)} />
                )}
                {costs.rentInfo.outstanding > 0 && (
                  <Row l="بدهی اجاره" v={fmt.money(costs.rentInfo.outstanding)} />
                )}
              </>
            )}
            {consumption.totalCost > 0 && (
              <>
                <Row l="هزینه ثابت" v={fmt.money(costs.grandTotalOwed)} />
                <Row l="مصرف انبار" v={fmt.money(consumption.totalCost)} />
              </>
            )}
            {costs.rentOwed > 0 ? (
              <>
                <Row l="جمع خرید" v={fmt.money(costs.purchaseTotal)} />
                <Row l="هزینه کل (با اجاره)" v={fmt.money(totalCost)} accent />
              </>
            ) : (
              <Row l={consumption.totalCost > 0 ? "هزینه کل" : "جمع کل"} v={fmt.money(totalCost)} accent />
            )}
            {totalCost > 0 && !hasConsignmentLosses && (f.currentCount || 0) > 0 && <Row l="هر پرنده" v={fmt.money(Math.round(totalCost / (f.currentCount || 1)))} accent />}
          </RowGrid>
        </>
      )}

      {(() => {
        const revenue = invoiceRevenue;
        if (revenue === 0) return null;
        const profit = revenue - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
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
              <Row l="هزینه ثابت" v={fmt.money(costs.grandTotalOwed)} />
              {consumption.totalCost > 0 && (
                <Row l="مصرف انبار" v={fmt.money(consumption.totalCost)} />
              )}
              <Row l="هزینه کل" v={fmt.money(totalCost)} />
              <Row l={isProfit ? 'سود خالص' : 'زیان'} v={fmt.money(Math.abs(profit))} accent={isProfit} />
              {totalCost > 0 && <Row l="ROI" v={`${toFa(roi.toFixed(1))}٪`} />}
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

      <FlockValueSection flock={f} />

      {f.mergedInfo && (f.mergedInfo.sources?.length || 0) >= 2 && (() => {
        const _all = f.mergedInfo.sources || [];
        const _total = _all.reduce((s: number, x: any) => s + (x.count || 0), 0);
        const _count = _all.length;
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>گله ادغام‌شده</span>
                <HelpIcon text={HELP.flk.merged} />
                <span style={{
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--muted)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}>از {toFa(_count)} گله</span>
              </div>
              <button
                type="button"
                onClick={() => setUnmergeOpen(true)}
                title="بازگردانی گله"
                style={{
                  width: 28, height: 28,
                  background: 'var(--btn-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: 'var(--text)',
                  fontFamily: 'inherit', padding: 0,
                }}
              >♻️</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>
              {_all.map((s: any) => (
                <Row key={s.flockId} l={s.flockName} v={`${fmt.int(s.count || 0)} پرنده`} />
              ))}
            </div>
          </>
        );
      })()}

      {(() => {
        const cons = computeFlockConsumption(f.id, whsMovements, whsItems);
        const hasAnyQty = cons.feed.total > 0 || cons.medicine.total > 0 || cons.vaccine.total > 0 || cons.other.total > 0;
        if (!hasAnyQty && cons.totalCost === 0) return null;
        return (
          <>
            <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', display: 'flex', alignItems: 'center', gap: 4 }}>
              📦 مصرف انبار
              <HelpIcon text={HELP.flk.consumption} />
            </div>
            <RowGrid>
              {cons.feed.total > 0 && <Row l="دان" v={`${fmt.int(cons.feed.total)} کیلو`} />}
              {cons.medicine.total > 0 && <Row l="دارو" v={cons.medicine.cost > 0 ? fmt.money(cons.medicine.cost) : `${fmt.int(cons.medicine.total)}`} />}
              {cons.herbal.total > 0 && <Row l="دارو گیاهی" v={cons.herbal.cost > 0 ? fmt.money(cons.herbal.cost) : `${fmt.int(cons.herbal.total)}`} />}
              {cons.vaccine.total > 0 && <Row l="واکسن" v={cons.vaccine.cost > 0 ? fmt.money(cons.vaccine.cost) : `${fmt.int(cons.vaccine.total)}`} />}
              {cons.other.total > 0 && <Row l="سایر" v={cons.other.cost > 0 ? fmt.money(cons.other.cost) : `${fmt.int(cons.other.total)}`} />}
              {cons.totalCost > 0 && <Row l="جمع هزینه" v={fmt.money(cons.totalCost)} accent />}
              {cons.totalCost === 0 && hasAnyQty && (
                <Row l="جمع مصرف" v="قیمت‌ها در انبار ثبت نشده" accent />
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
        <CardActions actions={[
          { label: 'بازگردانی', onClick: onRestore, variant: 'primary' },
          { label: 'حذف', onClick: onDelete, variant: 'danger-outline' }
        ]} />
      ) : (
        <>
          <CardActions actions={[
            { label: 'ویرایش', onClick: handleEditGuard, variant: 'outline' },
            { label: '📋 تفکیک', onClick: () => setSexingOpen(true), variant: 'outline', hidden: f.type === 'broiler' },
            { label: '📅 تفکیک‌ها', onClick: () => setSexingHistoryOpen(true), variant: 'outline', hidden: (f.sexingEvents?.length || 0) === 0 },
            { label: '📜 رویدادها', onClick: () => setHistoryOpen(true), variant: 'outline' },
            { label: '📁 گروه‌ها', onClick: onOpenGroups, variant: 'outline' },
            { label: f.hidden ? '👁 نمایان' : '👁 پنهان', onClick: onToggleHidden, variant: 'outline' },
            { label: f.paused ? '▶️ فعال' : '⏸ غیرفعال', onClick: onTogglePaused, variant: 'outline' }
          ]} />
        </>
      )}

      <FlockHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        flock={f}
      />
          <UnmergeFlocksModal open={unmergeOpen} onClose={() => setUnmergeOpen(false)} targetFlockId={f.id} />
      <SexingModal open={sexingOpen} onClose={() => setSexingOpen(false)} flock={f} />
      <SexingHistoryModal open={sexingHistoryOpen} onClose={() => setSexingHistoryOpen(false)} flock={f} />
      <MergedEditBlockModal open={editBlockOpen} onClose={() => setEditBlockOpen(false)} onUnmerge={() => setUnmergeOpen(true)} flockName={f.name} />
    </ExpandableCard>
    
    </>
  );
}
