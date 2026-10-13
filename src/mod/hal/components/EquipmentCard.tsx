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

export interface EquipmentCardProps {
  e: Equipment;
  i: number;
  hall: Hall | null | undefined;
  allCustomOpts: CustomOption[];
  isOpen: boolean;
  ms: any; // MultiSelectState<Equipment>
  onToggle: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onUndo: (item: Equipment) => void;
  supplierNames?: Map<string, string>;
  invoiceNumbers?: Map<string, string>;
  whsItemNames?: Map<string, string>;
  zoneNames?: Map<string, string>;
}

export default function EquipmentCard(props: EquipmentCardProps) {
  const { e, i, hall, allCustomOpts, isOpen, ms, onToggle, onEdit, onDelete, onUndo, supplierNames,
        invoiceNumbers, whsItemNames, zoneNames } = props;
  const _cm = (allCustomOpts as any[]).find(o => o.key.startsWith('hal.equip.type.') && o.name === e.type);
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
                subtitle={`${meta.name}${e.brand ? ' · ' + e.brand : ''}${_isDeleted ? ' · حذف‌شده' : ''} · ${hall?.name || '—'}`}
                isOpen={isOpen}
                onToggle={onToggle}
                badge={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {e.status && e.status !== 'active' && (() => {
                      const st = getStatusLabel(e.status);
                      if (!st) return null;
                      return <Tag tone={(st.tone || 'gray') as any}>{st.icon} {st.name}</Tag>;
                    })()}
                    {e.count ? <Tag tone="blue">{toFa(e.count)} {getUnitLabel(e.unit)}</Tag> : undefined}
                  </div>
                }
                stats={<>
                  {e.count && <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(e.count)} {getUnitLabel(e.unit)}</b></span>}
                  {value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(value.toLocaleString('fa-IR'))} ت</b></span>}
                  {e.warranty && <span>گارانتی: <b style={{ color: 'var(--text)' }}>{toFa(e.warranty)} ماه</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🔧</span> مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نوع:</span>
                    <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {meta.name}
                      {_isDeleted && (
                        <span style={{
                          fontSize: 'var(--fs-2xs)', fontWeight: 700,
                          padding: 'var(--pad-chip-xs)', borderRadius: 'var(--r-sm)',
                          background: 'rgba(217,119,6,.14)', color: 'var(--warn)',
                          letterSpacing: '.3px',
                        }}>حذف‌شده</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نوع دارایی:</span>
                    <span style={{ fontWeight: 600 }}>{getKindLabel(kindForType(e.type))?.icon} {getKindLabel(kindForType(e.type))?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>دسته:</span>
                    <span style={{ fontWeight: 600 }}>{getCategoryLabel(e.category)?.icon} {getCategoryLabel(e.category)?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>سالن:</span>
                    <span style={{ fontWeight: 600 }}>
                      {hall ? <EntityLink type="hall" id={hall.id} label={hall.name} /> : '—'}
                    </span>
                  </div>
                  {e.zoneId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>بخش:</span>
                      <span style={{ fontWeight: 600 }}>
                        {zoneNames?.get(e.zoneId) || '—'}
                      </span>
                    </div>
                  )}
                  {e.supplierId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>تأمین‌کننده:</span>
                      <span style={{ fontWeight: 600 }}>
                        <EntityLink type="party" id={e.supplierId} label={supplierNames?.get(e.supplierId) || '—'} />
                      </span>
                    </div>
                  )}
                  {e.sourceInvoiceId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>فاکتور خرید:</span>
                      <span style={{ fontWeight: 600 }}>
                        <EntityLink type="invoice" id={e.sourceInvoiceId} label={invoiceNumbers?.get(e.sourceInvoiceId) || '—'} />
                      </span>
                    </div>
                  )}
                  {e.warehouseItemId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>کالای انبار:</span>
                      <span style={{ fontWeight: 600 }}>
                        <EntityLink type="item" id={e.warehouseItemId} label={whsItemNames?.get(e.warehouseItemId) || '—'} />
                      </span>
                    </div>
                  )}
                  {e.count && (
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>تعداد:</span>
                      <span style={{ fontWeight: 600 }}>{toFa(e.count)} {getUnitLabel(e.unit)}</span>
                    </div>
                  )}
                </div>

                {(e.unitPrice || value > 0 || e.purchasedAt || e.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.unitPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>قیمت واحد:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.unitPrice.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                      {value > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--accent-soft)', color: 'var(--accent)',
                           borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>ارزش کل:</span>
                          <span>{toFa(value.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                      {e.purchasedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>تاریخ خرید:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.purchasedAt)}</span>
                        </div>
                      )}
                      {e.warranty && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>گارانتی:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.warranty)} ماه</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
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
                  <Btn size="sm" onClick={async () => {
                    const ok = await showConfirmAsync('تأیید حذف', 'این تجهیز حذف شود؟', { danger: true }); if (!ok) return; onUndo(e); onDelete(e.id); logAction('delete', 'hal', 'حذف از سالن‌ها'); toastMsg.deleted('تجهیز')
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
}
