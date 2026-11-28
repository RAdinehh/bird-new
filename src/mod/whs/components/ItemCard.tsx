import { useFlk } from '../../flk/store';
import { useHal } from '../../hal/store';
import { useTra } from '../../tra/store';
import { formatInvoiceNumber } from '../../tra/calc';
import { createElement } from "react";
/**
 * ItemCard — کارت نمایش قلم انبار
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toFa } from '../../../shr/utils/fa';
import { VET_METHOD_LABEL } from '../../../shr/constants/vetMethods';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { Row, SectionTitle , getWhsItemIcon } from '../helpers';
import EntityLink from '../../../shr/components/EntityLink';
import { CATEGORY_ICON, CATEGORY_LABEL, UNIT_LABEL, STORAGE_LABEL, stockWarning, expiryWarning, daysToExpiry, getAvgPrice } from '../store';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { formatQty } from '../../../shr/utils/fa';
import { CardActions } from '../../../shr/components/ui';
import { ACTION_PRESETS } from '../../../shr/constants/cardActions';

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
  onArchive?: () => void;
  onUnarchive?: () => void;
}

export default function ItemCard(props: ItemCardProps) {
  const fmt = useFormat();
  const { it, i, hall, sup, myMovements, isOpen, ms, onToggle, onEdit, onAdjust, onDelete, onUndo, onArchive, onUnarchive } = props;

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

  const handleArchive = async () => {
    const movementCount = myMovements?.length || 0;
    const ok = await showConfirmAsync(
      '⚠️ آرشیو کالا',
      `این کالا ${fmt.count(movementCount)} گردش انبار دارد و قابل حذف کامل نیست.\n\nبا آرشیو، از لیست پنهان می‌شود ولی تمام تاریخچه حفظ می‌شود.`,
      { confirmText: 'آرشیو کن', cancelText: 'انصراف', danger: false }
    );
    if (!ok) return;
    onArchive?.();
    logAction('update', 'whs', 'آرشیو کالا');
    toastMsg.deleted(it.name);
  };

  return (
    <ExpandableCard key={it.id} id={it.id} ms={ms} accent={accent} index={fmt.count(i + 1)}
      iconEmoji={it.icon || getWhsItemIcon(it.name, it.category, (CATEGORY_ICON as any)[it.category])} title={it.name}
      subtitle={`${(CATEGORY_LABEL as any)[it.category]} • ${formatQty(it.currentStock, it.unit)}`}
      isOpen={isOpen} onToggle={onToggle}
      badge={
        it.currentStock < 0 ? <Tag tone="red">منفی</Tag> :
        stock === 'critical' ? <Tag tone="red">تمام شد</Tag> :
        stock === 'low' ? <Tag tone="amber">کم</Tag> :
        exp === 'expired' ? <Tag tone="red">منقضی</Tag> :
        exp === 'soon' ? <Tag tone="amber">نزدیک انقضا</Tag> :
        <Tag tone="green">موجود</Tag>
      }
      stats={<>
        <span>موجودی: <b style={{ color: 'var(--text)' }}>{formatQty(it.currentStock, it.unit)}</b></span>
        {it.minStock > 0 ? <span>حد: <b style={{ color: 'var(--text)' }}>{fmt.num(it.minStock)}</b></span> : null}
        {it.lastPrice > 0 ? <span>ارزش: <b style={{ color: 'var(--text)' }}>{fmt.money(it.currentStock * getAvgPrice(it))}</b></span> : null}
      </>}
    >
 <SectionTitle>مشخصات قلم</SectionTitle>
 <Row l="دسته"v={(CATEGORY_LABEL as any)[it.category]} />
 <Row l="واحد"v={(UNIT_LABEL as any)[it.unit]} />
 <Row l="موجودی فعلی"v={formatQty(it.currentStock, it.unit)} />
 {it.minStock >0 ? <Row l="حداقل موجودی"v={`${fmt.num(it.minStock)} ${(UNIT_LABEL as any)[it.unit]}`} />: null}
 {it.avgPrice && it.avgPrice >0 ? <Row l="قیمت میانگین"v={fmt.money(getAvgPrice(it))} />: null}
 {it.lastPrice >0 ? <Row l="آخرین قیمت خرید"v={fmt.money(it.lastPrice)} />: null}
 {sup ? <Row l="تأمین‌کننده"v={createElement(EntityLink, { type: "party", id: sup.id, label: sup.name })} />: null}
 {hall ? <Row l="سالن"v={createElement(EntityLink, { type: "hall", id: hall.id, label: hall.name })} />: null}

 {it.currentStock >0 && it.lastPrice >0 ? (
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
 <span>ارزش موجودی:</span>
 <span>{fmt.money(it.currentStock * getAvgPrice(it))}</span>
 </div>
 ) : null}

 {(it.category === 'medicine'|| it.category === 'vaccine') ? (
 <>
 <SectionTitle>اطلاعات دارویی</SectionTitle>
 {it.expireDate ? <Row l="تاریخ انقضا"v={fmt.date(it.expireDate)} />: null}
 {days !== null ? (
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: days < 0 ? 'var(--danger-soft)': days <= 30 ? 'var(--warn-soft)': 'var(--input-bg)', color: days < 0 ? 'var(--danger)': days <= 30 ? 'var(--warn)': 'var(--muted)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
 <span>وضعیت انقضا:</span>
 <span>{days < 0 ? `${fmt.day(Math.abs(days))} روز گذشته`: `${fmt.day(days)} روز مانده`}</span>
 </div>
 ) : null}
 {it.withdrawalDays !== null && it.withdrawalDays !== undefined ? <Row l="دوره منع مصرف"v={`${fmt.day(it.withdrawalDays)} روز`} />: null}
 {it.storage ? <Row l="نگهداری"v={(STORAGE_LABEL as any)[it.storage] || it.storage} />: null}
 {(() =>{
 const arr: string[] = (it as any).usageTypes || ((it as any).usageType ? [(it as any).usageType] : []);
 if (arr.length === 0) return null;
 return <Row l="نوع مصرف"v={arr.map((t: string) =>VET_METHOD_LABEL[t] || t).join('• ')} />;
 })()}
 {it.dosePerBird ? <Row l="دوز هر پرنده"v={`${fmt.num(it.dosePerBird)} ml`} />: null}
 {it.productionDate ? <Row l="تاریخ تولید"v={fmt.date(it.productionDate)} />: null}
 </>
 ) : null}

 {it.category === 'equipment'? (
 <>
 <SectionTitle>اطلاعات تجهیزات</SectionTitle>
 {(() =>{
 const linkedEqs = useHal.getState().equipment.filter(eq =>eq.warehouseItemId === it.id);
 return linkedEqs.map(eq =>(
 <Row key={eq.id} l="تجهیز متصل"v={createElement(EntityLink, { type: "hall", tab: 'equip', id: eq.id, label: eq.name })} />
 ));
 })()}
 {it.purchaseDate ? <Row l="تاریخ خرید"v={fmt.date(it.purchaseDate)} />: null}
 {it.purchasePrice ? <Row l="قیمت خرید"v={fmt.money(it.purchasePrice)} />: null}
 {hall ? <Row l="سالن"v={createElement(EntityLink, { type: "hall", id: hall.id, label: hall.name })} />: null}
 {it.equipmentStatus ? <Row l="وضعیت"v={EQUIP_STATUS[it.equipmentStatus] || it.equipmentStatus} />: null}
 {it.warrantyUntil ? <Row l="گارانتی تا"v={fmt.date(it.warrantyUntil)} />: null}
 </>
 ) : null}

 {myMovements.length >0 ? (
 <>
 <SectionTitle>آخرین گردش‌ها ({fmt.count(myMovements.length)})</SectionTitle>
 {myMovements.slice(-3).reverse().map((m) =>{
 const inv = m.sourceModule === 'tra'&& m.sourceId ? useTra.getState().invoices.find(x =>x.id === m.sourceId) : undefined;
 const flkId = (m as any).flockId;
 const flk = flkId ? useFlk.getState().flocks.find(x =>x.id === flkId) : undefined;
 return (
 <div key={m.id} style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
 <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
 <span>{m.type === 'in'? 'ورود': 'خروج'} {formatQty(m.quantity, it.unit)}</span>
 {inv ? createElement(EntityLink, { type: 'invoice', id: inv.id, label: formatInvoiceNumber(inv.number) }) : null}
 {flk ? createElement(EntityLink, { type: 'flock', id: flk.id, label: flk.name }) : null}
 </span>
 <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)'}}>{fmt.date(m.date)}</span>
 </div>
 );
 })}
 </>
 ) : null}

 {it.notes ? (
 <>
 <SectionTitle>یادداشت</SectionTitle>
 <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)'}}>{it.notes}</div>
 </>
 ) : null}

 <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
 <CardActions actions={(() =>{
 const hasMovements = myMovements && myMovements.length >0;
 const baseActions = [
 { ...ACTION_PRESETS.CORRECT, onClick: onAdjust },
 { ...ACTION_PRESETS.EDIT, onClick: onEdit },
 ];
 if (it.archived) {
 return [...baseActions, { ...ACTION_PRESETS.RESTORE, onClick: () =>onUnarchive?.() }];
 }
 if (hasMovements) {
 return [...baseActions, { ...ACTION_PRESETS.ARCHIVE, onClick: handleArchive }];
 }
 return [...baseActions, { ...ACTION_PRESETS.DELETE, onClick: handleDelete }];
 })()} />
 </div>
 </ExpandableCard>
  );
}
