/**
 * EggEntryCard.tsx — کارت نمایش یک ورودی تخم
 */
import { toFa } from '../../../shr/utils/fa';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../../shr/components/ExpandableCard';
import { Row } from '../helpers';
import ProgressTracker from '../../../shr/components/ProgressTracker';
import { DEAL_LABEL, ENTRY_STATUS_LABEL, isLockdown, isHatchWindow } from '../store';
import { calcWeightLossPct } from '../api/hatchCalc';

export interface EggEntryCardProps {
  entry: any;
  index: number;
  device: any;
  bird: any;
  breed: any;
  flocks: any[];
  contacts: any[];
  hatches: any[];
  age: number;
  expectedHatch: string;
  remain: number;
  totalDays: number;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EggEntryCard(props: EggEntryCardProps) {
  const {
    entry: e, index: i, device: dev, bird, breed,
    flocks, contacts, hatches, age, expectedHatch, remain, totalDays,
    isOpen, onToggle, onEdit, onDelete,
  } = props;

  const locked = isLockdown({ ...e, expectedHatchDate: expectedHatch });
  const hatchWindow = isHatchWindow({ ...e, expectedHatchDate: expectedHatch });
  const myHatch = hatches.find(h => h.eggEntryId === e.id);

  let accent: any = 'accent';
  if (hatchWindow) accent = 'purple';
  else if (locked) accent = 'warn';

  let statusLabel = '';
  let statusTone: any = 'muted';
  if (myHatch) { statusLabel = '✅ هچ‌شده'; statusTone = 'green'; }
  else if (hatchWindow) { statusLabel = '🐣 پنجره هچ'; statusTone = 'purple'; }
  else if (locked) { statusLabel = '🔒 Lock-down'; statusTone = 'amber'; }
  else if (remain > 0) { statusLabel = toFa(remain) + ' روز مانده'; statusTone = 'accent'; }
  else if (remain === 0) { statusLabel = '🎯 امروز هچ'; statusTone = 'purple'; }
  else { statusLabel = '⚠️ گذشته از موعد هچ'; statusTone = 'amber'; }

  const partnerName = (e.dealData?.partnerId && (contacts.find((c) => c.id === e.dealData.partnerId) as any)?.name) || e.dealData?.partnerName || '';
  const sellerName = (e.dealData?.sellerId && (contacts.find((c) => c.id === e.dealData.sellerId) as any)?.name) || e.dealData?.sellerName || '';
  const consigneeName = (e.dealData?.consigneeId && (contacts.find((c) => c.id === e.dealData.consigneeId) as any)?.name) || e.dealData?.consigneeName || '';
  const lessorName = (e.dealData?.lessorId && (contacts.find((c) => c.id === e.dealData.lessorId) as any)?.name) || '';

  return (
    <ExpandableCard
      accent={accent}
      index={toFa(i + 1)}
      iconEmoji="🥚"
      title={toFa(e.count || 0) + ' تخم · ' + (bird?.name || '—') + (breed ? ' (' + breed.name + ')' : '')}
      subtitle={dev?.name || '—'}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={<Tag tone={statusTone}>{statusLabel}</Tag>}
      stats={<>
        <StatBox icon="⏳" label="مانده" value={toFa(remain) + ' روز'} tone={remain <= 3 ? 'warn' : 'default'} />
        <Dot />
        <StatBox icon="📊" label="پیشرفت" value={toFa(Math.min(100, Math.round(age / Math.max(1, totalDays) * 100))) + '٪'} tone="accent" />
      </>}
    >
      {(() => {
        const lbl = hatchWindow ? 'پنجره هچ باز است' : locked ? 'در Lock-down' : ('روز ' + toFa(age) + ' از ' + toFa(totalDays));
        return <ProgressTracker current={age} target={totalDays} label={lbl} unit="روز" color={hatchWindow ? 'purple' : locked ? 'warn' : 'accent'} />;
      })()}

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📋 مشخصات</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row l="دستگاه" v={dev?.name || '—'} />
        <Row l="پرنده" v={(bird?.name || '—') + (breed ? ' · ' + breed.name : '')} />
        <Row l="تعداد" v={toFa(e.count || 0) + ' تخم'} />
        {e.sampleWeightInitial && e.sampleWeightCurrent && (() => {
          const pct = calcWeightLossPct(e.sampleWeightInitial, e.sampleWeightCurrent);
          if (pct === null) return null;
          const inRange = pct >= 11 && pct <= 13;
          return <Row l="کاهش وزن نمونه" v={(inRange ? '✅ ' : '⚠️ ') + toFa(pct) + '٪'} />;
        })()}
        <Row l="تاریخ ورود" v={toFa(e.entryDate)} />
        <Row l="هچ پیش‌بینی" v={toFa(expectedHatch)} />
        {e.trayNumbers && <Row l="طبقات" v={e.trayNumbers} />}
        <Row l="وضعیت" v={(ENTRY_STATUS_LABEL as any)[e.status]} />
      </div>

      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🤝 منبع</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row l="نوع" v={(DEAL_LABEL as any)[e.dealType]} />
        {e.dealType === 'own' && (e as any).flockId && <Row l="گله" v={(flocks.find((f) => f.id === (e as any).flockId)?.name) || '—'} />}
        {e.dealType === 'purchase' && sellerName && <Row l="فروشنده" v={String(sellerName)} />}
        {e.dealType === 'partnership' && partnerName && <Row l="شریک" v={String(partnerName)} />}
        {e.dealType === 'partnership' && e.dealData.partnerPercent && <Row l="درصد شریک" v={toFa(e.dealData.partnerPercent) + '٪'} />}
        {e.dealType === 'rent' && lessorName && <Row l="اجاره‌دهنده" v={String(lessorName)} />}
        {e.dealType === 'rent' && e.dealData.rentAmount && <Row l="اجاره" v={toFa(Number(e.dealData.rentAmount).toLocaleString('fa-IR')) + ' ت'} />}
        {e.dealType === 'consignment' && consigneeName && <Row l="امانت‌دار" v={String(consigneeName)} />}
        {(e as any).dealStatus === 'withdrawn' && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, padding: '4px 8px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)' }}>
            ⚠️ کنار کشیده {((e as any).dealWithdrawnAt ? ' (' + toFa((e as any).dealWithdrawnAt) + ')' : '')}
          </div>
        )}
      </div>

      {(e.unitPrice || e.totalPrice || (e as any).shippingCost) && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>💰 مالی</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {e.unitPrice && <Row l="قیمت هر تخم" v={toFa(e.unitPrice.toLocaleString('fa-IR')) + ' ت'} />}
            {(e as any).shippingCost && <Row l="هزینه حمل" v={toFa((e as any).shippingCost.toLocaleString('fa-IR')) + ' ت'} />}
            {e.totalPrice && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', color: 'var(--text)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                <span>جمع تخم:</span><span>{toFa(e.totalPrice.toLocaleString('fa-IR'))} ت</span>
              </div>
            )}
          </div>
        </>
      )}

      {e.notes && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
        </>
      )}

      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
        <Btn size="sm" onClick={onDelete} aria-label="حذف ورودی" style={{ flex: 1 }}>حذف</Btn>
      </div>
    </ExpandableCard>
  );
}
