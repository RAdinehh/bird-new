import { findEquipmentPurchaseInvoice } from '../../tra/invoiceLinks';
import { useTra } from '../../tra/store';
import { formatInvoiceNumber } from '../../tra/calc';
import { useFormat } from '../../../shr/units/useFormat';
import { useNavigate } from 'react-router-dom';
/**
 * EquipmentCard — کارت تجهیز
 */
import { toFa } from '../../../shr/utils/fa';
import type { CustomOption } from '../../../shr/store/customOptions';
import type { Equipment, Hall } from '../store';
import { CardActions, Tag } from '../../../shr/components/ui';
import { ACTION_PRESETS } from '../../../shr/constants/cardActions';
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
  onRetire: (eq: Equipment) => void;
  onRestore: (id: string) => void;
  onTransfer: (eq: Equipment) => void;
  onUndo: (item: Equipment) => void;
  supplierNames?: Map<string, string>;
  invoiceNumbers?: Map<string, string>;
  whsItemNames?: Map<string, string>;
  zoneNames?: Map<string, string>;
}

export default function EquipmentCard(props: EquipmentCardProps) {
  const fmt = useFormat();
  const navigate = useNavigate();
  const { e, i, hall, allCustomOpts, isOpen, ms, onToggle, onEdit, onDelete, onRetire, onRestore, onTransfer, onUndo, supplierNames,
        invoiceNumbers, whsItemNames, zoneNames } = props;
  const _allInvoices = useTra(st => st.invoices);
  const _linkedPurchaseInv = findEquipmentPurchaseInvoice(_allInvoices, e);
  const _effectiveInvoiceId = _linkedPurchaseInv?.id;

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
                index={fmt.count(i + 1)}
                iconEmoji={meta.icon}
                title={e.name}
                subtitle={[meta.name, e.brand, _isDeleted ? 'حذف‌شده' : null, hall?.name].filter(Boolean).join(' • ')}
                isOpen={isOpen}
                onToggle={onToggle}
                badge={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(() => {
                      const kind = kindForType(e.type);
                      if (kind === 'asset') return <Tag tone="purple">دارایی</Tag>;
                      if (kind === 'consumable') return <Tag tone="gray">مصرفی</Tag>;
                      return null;
                    })()}
                    {(!e.hallId || e.hallId === '') && <Tag tone="amber">بدون سالن</Tag>}
                    {e.status && e.status !== 'active' && (() => {
                      const st = getStatusLabel(e.status);
                      if (!st) return null;
                      return <Tag tone={st.tone || 'gray'}>{st.name}</Tag>;
                    })()}
                    {e.count ? <Tag tone="blue">{fmt.count(e.count)} {getUnitLabel(e.unit)}</Tag> : undefined}
                    {(() => {
                      const ws = getWarrantyStatus(e.purchasedAt, e.warranty);
                      if (ws.status === 'expired') return <Tag tone="red">اتمام گارانتی</Tag>;
                      if (ws.status === 'expiring' && ws.daysLeft !== null) return <Tag tone="amber">{fmt.day(ws.daysLeft)} روز گارانتی</Tag>;
                      return null;
                    })()}
                  </div>
                }
                stats={<>
                  {value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{fmt.money(value)}</b></span>}
                  {e.warranty && (() => {
                    const ws = getWarrantyStatus(e.purchasedAt, e.warranty);
                    const color = ws.status === 'expired' ? 'var(--danger)' : ws.status === 'expiring' ? 'var(--warn)' : 'var(--text)';
                    return (
                      <span>
                        گارانتی: <b style={{ color }}>{fmt.count(e.warranty)} ماه</b>
                        {ws.endDate && <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-2xs)' }}> (تا {fmt.date(ws.endDate)}{ws.status === 'expired' ? ' — منقضی' : ws.daysLeft !== null && ws.daysLeft > 0 ? ` — ${fmt.day(ws.daysLeft)} روز مانده` : ''})</span>}
                      </span>
                    );
                  })()}
                </>}
              >
 {/* طبقه‌بندی */}
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}>طبقه‌بندی</div>
 <RowGrid>
 <Row l="نوع"v={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{meta.name}{_isDeleted && (<span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, padding: 'var(--pad-chip-xs)', borderRadius: 'var(--r-sm)', background: 'rgba(217,119,6,.14)', color: 'var(--warn)', letterSpacing: '.3px'}}>حذف‌شده</span>)}</span>} />
 <Row l="دسته"v={`${getCategoryLabel(e.category)?.icon || ''} ${getCategoryLabel(e.category)?.name || ''}`} />
 <Row l="نوع دارایی"v={`${getKindLabel(kindForType(e.type))?.icon || ''} ${getKindLabel(kindForType(e.type))?.name || ''}`} />
 </RowGrid>

 {/* مکان */}
 {(hall || e.zoneId) && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}>مکان</div>
 <RowGrid>
 <Row l="سالن"v={
 hall
 ? <EntityLink type="hall"id={hall.id} label={hall.name} />
 : <span style={{ color: 'var(--warn)', fontWeight: 700 }}>در انتظار تخصیص</span>
 } />
 {e.zoneId && <Row l="بخش"v={zoneNames?.get(e.zoneId) || '—'} />}
 </RowGrid>
 </>
 )}

 {/* مشخصات */}
 {(e.count || (e.capacity != null && e.capacity >0)) && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}>مشخصات</div>
 <RowGrid>
 {e.count && <Row l="تعداد"v={`${fmt.count(e.count)} ${getUnitLabel(e.unit)}`} />}
 {e.capacity != null && e.capacity >0 && <Row l="ظرفیت"v={fmt.num(e.capacity)} />}
 </RowGrid>
 </>
 )}

 {/* مالی */}
 {(e.unitPrice || value >0 || e.purchasedAt || e.warranty) && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}>مالی</div>
 <RowGrid>
 {e.unitPrice && <Row l="قیمت واحد"v={fmt.money(e.unitPrice)} />}
 {e.purchasedAt && <Row l="تاریخ خرید"v={fmt.date(e.purchasedAt)} />}
 {e.warranty && <Row l="گارانتی"v={`${fmt.count(e.warranty)} ماه`} />}
 {value >0 && <Row l="ارزش کل"v={`${fmt.money(value)}`} accent />}
 </RowGrid>
 </>
 )}

 {/* طرف تجاری */}
 {(e.supplierId || _effectiveInvoiceId || e.warehouseItemId) && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}>طرف تجاری</div>
 <RowGrid>
 {e.supplierId && <Row l="تأمین‌کننده"v={<EntityLink type="party"id={e.supplierId} label={supplierNames?.get(e.supplierId) || '—'} />} />}
 {e.sourceInvoiceId && <Row l="فاکتور خرید"v={<EntityLink type="invoice"id={e.sourceInvoiceId} label={invoiceNumbers?.get(e.sourceInvoiceId) || 'فاکتور حذف‌شده'} />} />}
 {e.warehouseItemId && <Row l="کالای انبار"v={<EntityLink type="item"id={e.warehouseItemId} label={whsItemNames?.get(e.warehouseItemId) || '—'} />} />}
 </RowGrid>
 </>
 )}

 {/* اطلاعات خروج (فروش/اسقاط) — SAP standard */}
 {e.status === 'retired'&& e.saleInfo && (
 <>
 <div style={{
 paddingTop: 8,
 fontSize: 'var(--fs-base)',
 color: 'var(--text)',
 fontWeight: 700,
 letterSpacing: '.3px',
 borderTop: '1px dashed var(--border)',
 marginBottom: 6,
 }}>
 اطلاعات خروج
 </div>
 <div style={{
 padding: '10px 12px',
 background: e.saleInfo.profit >= 0 ? 'var(--accent-soft)': 'var(--danger-soft)',
 border: '1px solid '+ (e.saleInfo.profit >= 0 ? 'var(--accent-border)': 'var(--danger-border)'),
 borderRadius: 'var(--r-md)',
 display: 'flex',
 flexDirection: 'column',
 gap: 6,
 marginBottom: 8,
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)'}}>
 <span style={{ color: 'var(--muted)'}}>نوع خروج:</span>
 <b>{e.saleInfo.reason === 'sale'? 'فروش': 'اسقاط'}</b>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)'}}>
 <span style={{ color: 'var(--muted)'}}>قیمت خرید:</span>
 <b>{fmt.money(e.saleInfo.totalCost || 0)}</b>
 </div>
 {e.saleInfo.reason === 'sale'&& (
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)'}}>
 <span style={{ color: 'var(--muted)'}}>مبلغ فروش:</span>
 <b>{fmt.money(e.saleInfo.salePrice || 0)}</b>
 </div>
 )}
 <div style={{
 display: 'flex',
 justifyContent: 'space-between',
 fontSize: 'var(--fs-md)',
 fontWeight: 700,
 borderTop: '1px solid var(--border)',
 paddingTop: 6,
 marginTop: 2,
 color: e.saleInfo.profit >= 0 ? 'var(--accent)': 'var(--danger)',
 }}>
 <span>{e.saleInfo.profit >= 0 ? 'سود:': 'ضرر:'}</span>
 <b>{fmt.money(Math.abs(e.saleInfo.profit))}</b>
 </div>
 {e.saleInfo.buyer && (
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)'}}>
 <span style={{ color: 'var(--muted)'}}>خریدار:</span>
 <b>{e.saleInfo.buyer}</b>
 </div>
 )}
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)'}}>
 {fmt.date(e.saleInfo.soldAt)}
 </div>
 {e.saleInfo.note && (
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)'}}>
 {e.saleInfo.note}
 </div>
 )}
 </div>
 </>
 )}

 {/* یادداشت */}
 {e.notes && (
 <>
 <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px'}}>یادداشت</div>
 <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)'}}>{e.notes}</div>
 </>
 )}
 {e.transferHistory && e.transferHistory.length >0 && (
 <details style={{
 marginTop: 'var(--sp-2)',
 background: 'var(--bg)',
 padding: '8px 10px',
 borderRadius: 'var(--r-sm)',
 border: '1px solid var(--border)',
 }}>
 <summary style={{
 cursor: 'pointer',
 fontSize: 'var(--fs-sm)',
 fontWeight: 700,
 color: 'var(--text)',
 }}>
 تاریخچه جابجایی ({fmt.count(e.transferHistory.length)} مورد)
 </summary>
 <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
 {e.transferHistory.slice().reverse().map((log) =>(
 <div
 key={log.id}
 style={{
 fontSize: 'var(--fs-xs)',
 padding: '6px 10px',
 background: 'var(--card-solid)',
 borderRadius: 'var(--r-sm)',
 border: '1px solid var(--border)',
 }}
 >
 <div style={{ fontWeight: 600, color: 'var(--text)'}}>
 {log.fromHallName || '—'}{log.fromZoneName ? `(${log.fromZoneName})`: ''} → {log.toHallName || '—'}{log.toZoneName ? `(${log.toZoneName})`: ''}{log.count ? <span style={{ color: 'var(--accent)', marginRight: 6 }}>({fmt.count(log.count)} {getUnitLabel(e.unit)})</span>: null}
 </div>
 <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-2xs)', marginTop: 2 }}>
 {fmt.date(log.date)}
 {log.note && <span>— {log.note}</span>}
 </div>
 </div>
 ))}
 </div>
 </details>
 )}



 <CardActions
 actions={[
 {
 ...ACTION_PRESETS.RECORD_INVOICE,
 hidden: !(e.unitPrice && e.unitPrice >0 && !_effectiveInvoiceId && e.status !== 'retired'),
 onClick: () =>{
 const params = new URLSearchParams({
 tab: 'purchases',
 _tra: 'equip',
 equipmentId: e.id,
 });
 navigate('/tra?'+ params.toString());
 },
 },
 {
 ...ACTION_PRESETS.RESTORE,
 hidden: e.status !== 'retired',
 onClick: async () =>{
 const hasSaleInv = !!e.saleInfo?.saleInvoiceId;
 const ok = await showConfirmAsync('تأیید بازگردانی', hasSaleInv ? 'این تجهیز قبلاً فروخته شده و فاکتور فروش در معاملات دارد. با بازگردانی، اطلاعات فروش روی تجهیز پاک می‌شود ولی فاکتور معاملات باید دستی بررسی شود. ادامه می‌دهید؟': 'این تجهیز به لیست فعال‌ها برگردد؟', {});
 if (!ok) return;
 onRestore(e.id);
 logAction('update', 'hal', 'بازگردانی تجهیز: '+ e.name);
 toastMsg.success('تجهیز بازگردانی شد');
 },
 },
 {
 ...ACTION_PRESETS.EDIT,
 onClick: onEdit,
 },
 {
 ...ACTION_PRESETS.TRANSFER,
 hidden: e.status === 'retired',
 onClick: () =>onTransfer(e),
 },
 {
 ...ACTION_PRESETS.RETIRE,
 hidden: e.status === 'retired',
 onClick: () =>onRetire(e),
 },
 ]}
 />
 </ExpandableCard>
            );
}
