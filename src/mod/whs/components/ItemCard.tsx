/**
 * ItemCard — کارت نمایش قلم انبار
 */
import { toFa } from '../../../shr/utils/fa';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { Row, SectionTitle } from '../helpers';
import { CATEGORY_ICON, CATEGORY_LABEL, UNIT_LABEL, STORAGE_LABEL, stockWarning, expiryWarning, daysToExpiry, getAvgPrice } from '../store';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { formatQty } from '../../../shr/utils/fa';
import { CardActions } from '../../../shr/components/ui';

const USAGE_LABEL: Record<string, string> = {
  oral: 'خوراکی', injectable: 'تزریقی', water: 'آب آشامیدنی', spray: 'اسپری',
};
const EQUIP_STATUS: Record<string, string> = {
  active: 'فعال', repair: 'در تعمیر', scrapped: 'اسقاط',
};

export interface ItemCardProps {
  it: any;
  i: number;
  hall: any;
  sup: any;
  myMovements: any[];
  isOpen: boolean;
  ms: any;
  onToggle: () => void;
  onEdit: () => void;
  onAdjust: () => void;
  onDelete: (id: string) => void;
  onUndo: (item: any) => void;
}

export default function ItemCard(props: ItemCardProps) {
  const { it, i, hall, sup, myMovements, isOpen, ms, onToggle, onEdit, onAdjust, onDelete, onUndo } = props;

  const stock = stockWarning(it);
  const exp = expiryWarning(it);
  const days = daysToExpiry(it.expireDate);

  let accent: 'accent' | 'warn' | 'dim' = 'accent';
  if (stock === 'critical' || exp === 'expired') accent = 'warn';
  else if (stock === 'low' || exp === 'soon') accent = 'warn';
  else if (it.currentStock === 0) accent = 'dim';

  const handleDelete = async () => {
    const ok = await showConfirmAsync('تأیید حذف', 'این مورد حذف شود؟', { danger: true });
    if (!ok) return;
    onUndo(it);
    onDelete(it.id);
    logAction('delete', 'whs', 'حذف از انبار');
    toastMsg.deleted(it.name);
  };

  return (
    <ExpandableCard key={it.id} id={it.id} ms={ms} accent={accent} index={toFa(i + 1)}
      iconEmoji={(CATEGORY_ICON as any)[it.category]} title={it.name}
      subtitle={`${(CATEGORY_LABEL as any)[it.category]} • ${formatQty(it.currentStock, it.unit)}`}
      isOpen={isOpen} onToggle={onToggle}
      badge={
        it.currentStock < 0 ? <Tag tone="red">⚠️ منفی</Tag> :
        stock === 'critical' ? <Tag tone="red">تمام شد</Tag> :
        stock === 'low' ? <Tag tone="amber">کم</Tag> :
        exp === 'expired' ? <Tag tone="red">منقضی</Tag> :
        exp === 'soon' ? <Tag tone="amber">نزدیک انقضا</Tag> :
        <Tag tone="green">موجود</Tag>
      }
      stats={<>
        <span>موجودی: <b style={{ color: 'var(--text)' }}>{formatQty(it.currentStock, it.unit)}</b></span>
        {it.minStock > 0 ? <span>حد: <b style={{ color: 'var(--text)' }}>{toFa(it.minStock)}</b></span> : null}
        {it.lastPrice > 0 ? <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa((it.currentStock * getAvgPrice(it)).toLocaleString('fa-IR'))} ت</b></span> : null}
      </>}
    >
      <SectionTitle>📦 مشخصات قلم</SectionTitle>
      <Row l="دسته" v={(CATEGORY_LABEL as any)[it.category]} />
      <Row l="واحد" v={(UNIT_LABEL as any)[it.unit]} />
      <Row l="موجودی فعلی" v={formatQty(it.currentStock, it.unit)} />
      {it.minStock > 0 ? <Row l="حداقل موجودی" v={`${toFa(it.minStock)} ${(UNIT_LABEL as any)[it.unit]}`} /> : null}
      {it.avgPrice && it.avgPrice > 0 ? <Row l="💰 قیمت میانگین" v={`${toFa(getAvgPrice(it).toLocaleString('fa-IR'))} ت`} /> : null}
      {it.lastPrice > 0 ? <Row l="آخرین قیمت خرید" v={`${toFa(it.lastPrice.toLocaleString('fa-IR'))} ت`} /> : null}
      {sup ? <Row l="تأمین‌کننده" v={sup.name} /> : null}

      {it.currentStock > 0 && it.lastPrice > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
          <span>ارزش موجودی:</span>
          <span>{toFa((it.currentStock * getAvgPrice(it)).toLocaleString('fa-IR'))} ت</span>
        </div>
      ) : null}

      {(it.category === 'medicine' || it.category === 'vaccine') ? (
        <>
          <SectionTitle>💊 اطلاعات دارویی</SectionTitle>
          {it.expireDate ? <Row l="تاریخ انقضا" v={toFa(it.expireDate)} /> : null}
          {days !== null ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: days < 0 ? 'var(--danger-soft)' : days <= 30 ? 'var(--warn-soft)' : 'var(--input-bg)', color: days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'var(--muted)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
              <span>وضعیت انقضا:</span>
              <span>{days < 0 ? `${toFa(Math.abs(days))} روز گذشته` : `${toFa(days)} روز مانده`}</span>
            </div>
          ) : null}
          {it.withdrawalDays !== null && it.withdrawalDays !== undefined ? <Row l="دوره منع مصرف" v={`${toFa(it.withdrawalDays)} روز`} /> : null}
          {it.storage ? <Row l="نگهداری" v={(STORAGE_LABEL as any)[it.storage] || it.storage} /> : null}
          {it.usageType ? <Row l="نوع مصرف" v={USAGE_LABEL[it.usageType] || it.usageType} /> : null}
          {it.dosePerBird ? <Row l="دوز هر پرنده" v={`${toFa(it.dosePerBird)} ml`} /> : null}
          {it.productionDate ? <Row l="تاریخ تولید" v={toFa(it.productionDate)} /> : null}
        </>
      ) : null}

      {it.category === 'equipment' ? (
        <>
          <SectionTitle>🔧 اطلاعات تجهیزات</SectionTitle>
          {it.purchaseDate ? <Row l="تاریخ خرید" v={toFa(it.purchaseDate)} /> : null}
          {it.purchasePrice ? <Row l="قیمت خرید" v={`${toFa(it.purchasePrice.toLocaleString('fa-IR'))} ت`} /> : null}
          {hall ? <Row l="سالن" v={hall.name} /> : null}
          {it.equipmentStatus ? <Row l="وضعیت" v={EQUIP_STATUS[it.equipmentStatus] || it.equipmentStatus} /> : null}
          {it.warrantyUntil ? <Row l="گارانتی تا" v={toFa(it.warrantyUntil)} /> : null}
        </>
      ) : null}

      {myMovements.length > 0 ? (
        <>
          <SectionTitle>📋 آخرین گردش‌ها ({toFa(myMovements.length)})</SectionTitle>
          {myMovements.slice(-3).reverse().map((m) => (
            <div key={m.id} style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{m.type === 'in' ? '📥' : '📤'} {formatQty(m.quantity, it.unit)}</span>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(m.date)}</span>
            </div>
          ))}
        </>
      ) : null}

      {it.notes ? (
        <>
          <SectionTitle>📝 یادداشت</SectionTitle>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{it.notes}</div>
        </>
      ) : null}

      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        <CardActions actions={[
          { label: '🔄 اصلاح', onClick: onAdjust, variant: 'primary' },
          { label: 'ویرایش', onClick: onEdit, variant: 'outline' },
          { label: 'حذف', onClick: handleDelete, variant: 'danger' }
        ]} />
      </div>
    </ExpandableCard>
  );
}
