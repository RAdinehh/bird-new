/**
 * EquipmentCard — کارت تجهیز
 */
import { toFa } from '../../../shr/utils/fa';
import type { CustomOption } from '../../../shr/store/customOptions';
import type { Equipment, Hall } from '../store';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { EQUIP_LABELS } from '../store';
import { getKindLabel, getCategoryLabel, getStatusLabel, getUnitLabel } from '../_typedLabels';
import { calcEquipValue, kindForType } from '../api/equipmentCalc';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import EntityLink from '../../../shr/components/EntityLink';
import { Row, RowGrid } from '../helpers';
import { getWarrantyStatus } from '../api/warranty';

export interface EquipmentCardProps {
  e: Equipment;
  i: number;
  hall: Hall | null | undefined;
  allCustomOpts: CustomOption[];
  isOpen: boolean;
  ms: import('../../../shr/multiSelect/useMultiSelect').MultiSelectState<Equipment>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onRetire: (id: string) => void;
  onRestore: (id: string) => void;
  onUndo: (item: Equipment) => void;
  supplierNames?: Map<string, string>;
  invoiceNumbers?: Map<string, string>;
  whsItemNames?: Map<string, string>;
  zoneNames?: Map<string, string>;
}

export default function EquipmentCard(props: EquipmentCardProps) {
  const { e, i, hall, allCustomOpts, isOpen, ms, onToggle, onEdit, onDelete, onRetire, onRestore, onUndo, supplierNames,
        invoiceNumbers, whsItemNames, zoneNames } = props;
  const _cm = allCustomOpts.find(o => o.key.startsWith('hal.equip.type.') && o.name === e.type);
  const _isDeleted = _cm ? _cm.hidden === true : false;
  const meta = EQUIP_LABELS[e.type] || (_cm ? { name: _cm.name, icon: _cm.icon } : { name: 'سایر', icon: '🔧' });
  const value = calcEquipValue(e);

  return (
              <ExpandableCard
                key={e.id}
                id={e.id}
                ms={ms}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji={meta.icon}
                title={e.name}
                subtitle={[meta.name, e.brand, _isDeleted ? 'حذف‌شده' : null, hall?.name].filter(Boolean).join(' • ')}
                isOpen={isOpen}
                onToggle={onToggle}
                badge={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(() => {
                      const kind = kindForType(e.type);
                      if (kind === 'asset') return <Tag tone="purple">🏭 دارایی</Tag>;
                      if (kind === 'consumable') return <Tag tone="gray">📦 مصرفی</Tag>;
                      return null;
                    })()}
                    {e.status && e.status !== 'active' && (() => {
                      const st = getStatusLabel(e.status);
                      if (!st) return null;
                      return <Tag tone={st.tone || 'gray'}>{st.icon} {st.name}</Tag>;
                    })()}
                    {e.count ? <Tag tone="blue">{toFa(e.count)} {getUnitLabel(e.unit)}</Tag> : undefined}
                    {(() => {
                      const ws = getWarrantyStatus(e.purchasedAt, e.warranty);
                      if (ws.status === 'expired') return <Tag tone="red">⚠️ گارانتی تمام</Tag>;
                      if (ws.status === 'expiring' && ws.daysLeft !== null) return <Tag tone="amber">⏰ {toFa(ws.daysLeft)} روز گارانتی</Tag>;
                      return null;
                    })()}
                  </div>
                }
                stats={<>
                  {value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(value.toLocaleString('fa-IR'))} ت</b></span>}
                  {e.warranty && (() => {
                    const ws = getWarrantyStatus(e.purchasedAt, e.warranty);
                    const color = ws.status === 'expired' ? 'var(--danger)' : ws.status === 'expiring' ? 'var(--warn)' : 'var(--text)';
                    return (
                      <span>
                        گارانتی: <b style={{ color }}>{toFa(e.warranty)} ماه</b>
                        {ws.endDate && <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-2xs)' }}> (تا {toFa(ws.endDate)}{ws.status === 'expired' ? ' — منقضی' : ws.daysLeft !== null && ws.daysLeft > 0 ? ` — ${toFa(ws.daysLeft)} روز مانده` : ''})</span>}
                      </span>
                    );
                  })()}
                </>}
              >
                                {/* 🏷 طبقه‌بندی */}
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🏷 طبقه‌بندی</div>
                <RowGrid>
                  <Row l="نوع" v={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{meta.name}{_isDeleted && (<span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, padding: 'var(--pad-chip-xs)', borderRadius: 'var(--r-sm)', background: 'rgba(217,119,6,.14)', color: 'var(--warn)', letterSpacing: '.3px' }}>حذف‌شده</span>)}</span>} />
                  <Row l="دسته" v={`${getCategoryLabel(e.category)?.icon || ''} ${getCategoryLabel(e.category)?.name || ''}`} />
                  <Row l="نوع دارایی" v={`${getKindLabel(kindForType(e.type))?.icon || ''} ${getKindLabel(kindForType(e.type))?.name || ''}`} />
                </RowGrid>

                {/* 📍 مکان */}
                {(hall || e.zoneId) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 مکان</div>
                    <RowGrid>
                      <Row l="سالن" v={
                      hall
                        ? <EntityLink type="hall" id={hall.id} label={hall.name} />
                        : <span style={{ color: 'var(--warn)', fontWeight: 700 }}>⚠️ در انتظار تخصیص</span>
                    } />
                      {e.zoneId && <Row l="بخش" v={zoneNames?.get(e.zoneId) || '—'} />}
                    </RowGrid>
                  </>
                )}

                {/* 📊 مشخصات */}
                {(e.count || (e.capacity != null && e.capacity > 0)) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📊 مشخصات</div>
                    <RowGrid>
                      {e.count && <Row l="تعداد" v={`${toFa(e.count)} ${getUnitLabel(e.unit)}`} />}
                      {e.capacity != null && e.capacity > 0 && <Row l="ظرفیت" v={toFa(e.capacity)} />}
                    </RowGrid>
                  </>
                )}

                {/* 💰 مالی */}
                {(e.unitPrice || value > 0 || e.purchasedAt || e.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>💰 مالی</div>
                    <RowGrid>
                      {e.unitPrice && <Row l="قیمت واحد" v={`${toFa(e.unitPrice.toLocaleString('fa-IR'))} ت`} />}
                      {e.purchasedAt && <Row l="تاریخ خرید" v={toFa(e.purchasedAt)} />}
                      {e.warranty && <Row l="گارانتی" v={`${toFa(e.warranty)} ماه`} />}
                      {value > 0 && <Row l="ارزش کل" v={`${toFa(value.toLocaleString('fa-IR'))} ت`} accent />}
                    </RowGrid>
                  </>
                )}

                {/* 🤝 طرف تجاری */}
                {(e.supplierId || e.sourceInvoiceId || e.warehouseItemId) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🤝 طرف تجاری</div>
                    <RowGrid>
                      {e.supplierId && <Row l="تأمین‌کننده" v={<EntityLink type="party" id={e.supplierId} label={supplierNames?.get(e.supplierId) || '—'} />} />}
                      {e.sourceInvoiceId && <Row l="فاکتور خرید" v={<EntityLink type="invoice" id={e.sourceInvoiceId} label={invoiceNumbers?.get(e.sourceInvoiceId) || '—'} />} />}
                      {e.warehouseItemId && <Row l="کالای انبار" v={<EntityLink type="item" id={e.warehouseItemId} label={whsItemNames?.get(e.warehouseItemId) || '—'} />} />}
                    </RowGrid>
                  </>
                )}

                {/* 📝 یادداشت */}
                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-1)' }}>
                  {e.unitPrice && e.unitPrice > 0 && (
                    <Btn
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const params = new URLSearchParams({
                          _tra: 'equip',
                          equipmentId: e.id,
                          name: e.name,
                          type: e.type || 'other',
                          qty: String(e.count || 1),
                          price: String(e.unitPrice || 0),
                          hallId: e.hallId,
                        });
                        window.location.href = '/tra?' + params.toString();
                      }}
                      style={{ flex: 1 }}
                    >
                      💰 ثبت فاکتور
                    </Btn>
                  )}
                  <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
                  {e.status === 'retired' ? (
                    <Btn size="sm" variant="outline" onClick={async () => {
                      const ok = await showConfirmAsync('تأیید بازگردانی', 'این تجهیز به لیست فعال‌ها برگردد؟', {});
                      if (!ok) return;
                      onRestore(e.id);
                      logAction('update', 'hal', 'بازگردانی تجهیز: ' + e.name);
                      toastMsg.success('تجهیز بازگردانی شد');
                    }} style={{ flex: 1 }}>♻️ بازگردانی</Btn>
                  ) : (
                    <Btn size="sm" variant="danger" onClick={async () => {
                      const ok = await showConfirmAsync('تأیید اسقاط', 'این تجهیز از لیست فعال خارج شود؟ سوابق مالی حفظ می‌شود.', { danger: true });
                      if (!ok) return;
                      onRetire(e.id);
                      logAction('update', 'hal', 'اسقاط تجهیز: ' + e.name);
                      toastMsg.success('تجهیز اسقاط شد');
                    }} style={{ flex: 1 }}>🔚 اسقاط / فروش</Btn>
                  )}
                </div>
              </ExpandableCard>
            );
}
