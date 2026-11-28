import { AlertBox } from '../../../shr/components/ui';
/**
 * EggEntryModal.tsx — Modal ورود تخم به دستگاه
 *
 * شامل: بنر راهنما + انتخاب دستگاه + ظرفیت + لیست ردیف‌ها + فرم ردیف جدید
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toFa, toEn } from '../../../shr/utils/fa';
import { clampPercent, complement } from '../../../shr/utils/smart';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Input, Modal, MoneyField,
  NumField, Select, Textarea,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import TimePicker from '../../../shr/components/TimePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { DEAL_LABEL, type DealType, useInc } from '../store';
import type { DraftRow } from '../types-eggentries';
import { flockReadyForEggs } from '../api/eggEntriesCalc';
import { FieldHint } from '../../../shr/intelligence';
import type { Bird } from '../../brd/store';
import type { Flock } from '../../flk/store';
import type { Person } from '../../ctc/store';

export interface EggEntryModalProps {
  open: boolean;
  onClose: () => void;
  editingRowId: string | null;
  hideHatchTip: boolean;
  setHideHatchTip: (v: boolean) => void;
  multiDeviceId: string;
  setMultiDeviceId: (v: string) => void;
  err?: string;
  draftRows: DraftRow[];
  currentRow: DraftRow;
  setCurrentRow: React.Dispatch<React.SetStateAction<DraftRow>>;
  // داده
  devices: { id: string; name: string }[];
  birds: Bird[];
  breeds: any[];
  flocks: Flock[];
  contacts: Person[];
  suppliers: Person[];
  allPersons: any[];
  breedsForBird: any[];
  liveUsage: { used: number; total: number; percent: number; remaining: number } | null;
  // actions
  setD: (k: string, v: string) => void;
  addRowToList: () => void;
  editRow: (row: DraftRow) => void;
  removeRow: (id: string) => void;
  saveAll: () => void;
  resetCurrentRow: () => void;
}

export default function EggEntryModal(props: EggEntryModalProps) {
  const fmt = useFormat();
  const err = props.err;
  const {
    open, onClose, editingRowId,
    hideHatchTip, setHideHatchTip,
    multiDeviceId, setMultiDeviceId,
    draftRows, currentRow, setCurrentRow,
    devices, birds, breeds, flocks, contacts, suppliers, allPersons,
    breedsForBird, liveUsage,
    setD, addRowToList, editRow, removeRow, saveAll, resetCurrentRow,
  } = props;

  // 🆕 چک: آیا این ردیف از فاکتور خرید اومده؟
  const sourceLinked = useInc((s) => {
    if (!editingRowId) return false;
    const entry = s.eggEntries.find((e: any) => e.id === editingRowId);
    return !!entry?.sourceInvoiceId;
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingRowId ? '✏️ ویرایش ردیف' : '📥 ورود تخم به دستگاه'}
      footer={
        <BtnRow>
          <Btn onClick={saveAll} disabled={draftRows.length === 0}>💾 ذخیره همه ({fmt.count(draftRows.length)})</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      {/* بنر راهنما */}
      {!hideHatchTip && (
        <div style={{ position: 'relative', padding: 'var(--pad-normal) 32px var(--pad-normal) var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--text)', fontWeight: 600, lineHeight: 1.8 }}>
          <button type="button" aria-label="بستن راهنما" onClick={() => { setHideHatchTip(true); try { localStorage.setItem('pm-inc-hide-hatch-tip', '1'); } catch {} }} style={{ position: 'absolute', top: 4, left: 4, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 4, lineHeight: 1, fontFamily: 'inherit' }}>✕</button>
          🎯 <b>هچ همزمان:</b> پرنده‌های دوره‌بلندتر رو اول وارد کن<br />
          <span style={{ opacity: 0.85 }}>ترتیب: غاز (۳۰) → بوقلمون (۲۸) → مرغ (۲۱)</span>
        </div>
      )}

      {/* دستگاه + ظرفیت */}
      <div style={{ padding: 'var(--pad-comfy)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
          <span>📦</span><span>انتخاب دستگاه</span>
        </div>
        <SmartSelect value={multiDeviceId} onChange={v => setMultiDeviceId(v)} options={devices.map(c => ({ value: c.id, label: c.name, icon: 'incubator' }))} placeholder="— انتخاب —" modalTitle="انتخاب دستگاه" />
        {liveUsage && liveUsage.total > 0 && (
          <div style={{
            padding: 'var(--pad-normal)',
            background: liveUsage.percent > 100 ? 'var(--danger-soft)' : liveUsage.percent > 90 ? 'var(--warn-soft)' : 'var(--accent-soft)',
            border: '1px solid ' + (liveUsage.percent > 100 ? 'var(--danger)' : liveUsage.percent > 90 ? 'var(--warn)' : 'var(--accent)'),
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-xs)',
            color: liveUsage.percent > 100 ? 'var(--danger)' : liveUsage.percent > 90 ? 'var(--warn)' : 'var(--accent)',
            fontWeight: 700,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📊 استفاده کل</span>
              <span>{fmt.count(liveUsage.used)} / {fmt.count(liveUsage.total)} ({fmt.num(liveUsage.percent)}٪)</span>
            </div>
            {liveUsage.percent > 100 && <div style={{ marginTop: 4 }}>{fmt.count(Math.abs(liveUsage.remaining))} واحد اضافی</div>}
          </div>
        )}
      </div>

      {/* ردیف‌های اضافه‌شده */}
      {draftRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', paddingTop: 4 }}>
            <span>📋</span><span>ردیف‌های ثبت‌شده ({fmt.count(draftRows.length)})</span>
          </div>
          {draftRows.map((r, i) => {
            const bird = birds.find(b => b.id === r.birdId);
            const sellerName = (r.dealData.sellerId && (contacts.find((c) => c.id === r.dealData.sellerId) as any)?.name) || '';
            const partnerName = (r.dealData.partnerId && (contacts.find((c) => c.id === r.dealData.partnerId) as any)?.name) || '';
            const flockName = r.flockId ? flocks.find((f) => f.id === r.flockId)?.name : '';
            const consigneeName = (r.dealData.consigneeId && (contacts.find((c) => c.id === r.dealData.consigneeId) as any)?.name) || '';
            const lessorName = (r.dealData.lessorId && (contacts.find((c) => c.id === r.dealData.lessorId) as any)?.name) || '';
            const party = sellerName || partnerName || flockName || consigneeName || lessorName || '—';
            const accentColor = r.dealType === 'own' ? 'accent' : r.dealType === 'purchase' ? 'info' : r.dealType === 'partnership' ? 'purple' : r.dealType === 'rent' ? 'warn' : 'dim';
            return (
              <div key={r._id} style={{
                position: 'relative',
                padding: '10px 34px 10px 12px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'var(--' + accentColor + ')' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                    {fmt.count(i + 1)}. {DEAL_LABEL[r.dealType]} • {bird?.name || '—'}
                  </span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--' + accentColor + ')', direction: 'ltr' }}>
                    {fmt.count(Number(r.count) || 0)} تخم
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  <span>{party}</span>
                  <span>{fmt.date(r.entryDate)}{r.entryTime ? ' • ' + fmt.code(r.entryTime) : ''}</span>
                </div>
                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 2 }}>
                  <button type="button" onClick={() => editRow(r)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 'var(--fs-xs)', padding: 3 }}>✏️</button>
                  <button
                    type="button"
                    onClick={() => removeRow(r._id)}
                    title="حذف"
                    aria-label="حذف"
                    style={{
                      background: 'var(--danger-soft)',
                      border: '1px solid var(--danger)',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 14, lineHeight: 1,
                      padding: 0, fontWeight: 700,
                      width: 40, height: 40,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'inherit',
                    }}
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* فرم ردیف جدید */}
      <div style={{ padding: 'var(--pad-comfy)', background: editingRowId ? 'var(--warn-soft)' : 'var(--input-bg)', border: '1px dashed ' + (editingRowId ? 'var(--warn)' : 'var(--border)'), borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: editingRowId ? 'var(--warn)' : 'var(--muted)', fontWeight: 700 }}>
          <span>{editingRowId ? '✏️' : '➕'}</span>
          <span>{editingRowId ? 'ویرایش ردیف انتخاب‌شده' : 'ردیف جدید'}</span>
        </div>

        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', paddingTop: 4 }}>🏠 منبع و طرف مقابل</div>

        <Field label="نوع منبع" required>
          <SmartSelect
            value={currentRow.dealType}
            modalTitle="نوع منبع تخم"
            options={[
              { value: 'own', label: 'گله خودم', subtitle: 'تولید مزرعه خودم', icon: '🏠' },
              { value: 'partnership', label: 'شراکتی', subtitle: 'مشارکت با شریک', icon: '🤝' },
              { value: 'purchase', label: 'خریداری', subtitle: 'خرید از فروشنده', icon: '🛒' },
              { value: 'rent', label: 'اجاره‌ای', subtitle: 'اجاره ظرفیت / دستگاه', icon: '📋' },
              { value: 'consignment', label: 'امانی', subtitle: 'دریافت امانی از طرف مقابل', icon: '📦' },
            ]}
            onChange={v => setCurrentRow(f => ({ ...f, dealType: v as DealType, dealData: {}, flockId: '' }))}
          />
        </Field>

        {currentRow.dealType === 'own' && (
          <Field label="گله" required>
            {(() => {
              const activeFlocks = flocks.filter((fl) => fl.status === 'active' && !fl.paused);
              const readyFlocks = activeFlocks.filter((fl) => {
                const brd = birds.find(b => b.id === fl.birdId);
                const r = flockReadyForEggs(fl, brd);
                return r.ready;
              });
              if (activeFlocks.length === 0) return <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: 10, textAlign: 'center' }}>گله فعالی نیست</div>;
              if (readyFlocks.length === 0) return <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', padding: 10, background: 'var(--warn-soft)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>⛔ هیچ گله آماده‌ای نیست</div>;
              return (
                <SmartSelect
                  value={currentRow.flockId}
                  placeholder="— انتخاب —"
                  modalTitle="انتخاب گله"
                  options={readyFlocks.map((fl) => {
                    const brd = birds.find((b) => b.id === fl.birdId);
                    const r = flockReadyForEggs(fl, brd);
                    return { value: String(fl.id), label: String(fl.name), subtitle: fmt.day(r.ageDays) + " روز", icon: 'flock' };
                  })}
                  onChange={(val: string) => {
                    const fl = flocks.find((x) => x.id === val);
                    setCurrentRow((f) => ({ ...f, flockId: val, birdId: fl?.birdId || f.birdId, breedId: fl?.breedId || f.breedId }));
                  }}
                />
              );
            })()}
          </Field>
        )}

        {currentRow.dealType === 'purchase' && (
          <Field label="فروشنده" required>
            {suppliers.length === 0 ? (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: 10, textAlign: 'center' }}>فروشنده‌ای نیست</div>
            ) : (
              <SmartSelect
                  value={currentRow.dealData.sellerId || ''}
                  placeholder="— انتخاب —"
                  modalTitle="انتخاب فروشنده"
                  options={suppliers.map((p) => ({ value: String(p.id), label: String(p.name), icon: '👤' }))}
                  onChange={(val: string) => setD("sellerId", val)}
                />
            )}
          </Field>
        )}

        {currentRow.dealType === 'partnership' && (
          <Field label="شریک" required>
            <SmartSelect
              value={currentRow.dealData.partnerId || ''}
              placeholder="— انتخاب شریک —"
              modalTitle="انتخاب شریک"
              options={allPersons.map((p) => ({ value: String(p.id), label: String(p.name), icon: '👤' }))}
              onChange={(val: string) => setD('partnerId', val)}
            />
          </Field>
        )}

        {currentRow.dealType === 'rent' && (
          <Field label="اجاره‌دهنده" required>
            <SmartSelect
              value={currentRow.dealData.lessorId || ''}
              placeholder="— انتخاب اجاره‌دهنده —"
              modalTitle="انتخاب اجاره‌دهنده"
              options={allPersons.map((p) => ({ value: String(p.id), label: String(p.name), icon: '👤' }))}
              onChange={(val: string) => setD('lessorId', val)}
            />
          </Field>
        )}

        {currentRow.dealType === 'consignment' && (
          <Field label="امانت‌دار" required>
            <SmartSelect
              value={currentRow.dealData.consigneeId || ''}
              placeholder="— انتخاب امانت‌دار —"
              modalTitle="انتخاب امانت‌دار"
              options={allPersons.map((p) => ({ value: String(p.id), label: String(p.name), icon: '👤' }))}
              onChange={(val: string) => setD('consigneeId', val)}
            />
          </Field>
        )}

        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', paddingTop: 6, borderTop: '1px dashed var(--border)' }}>📅 زمان</div>
        <Grid2>
          <Field label="تاریخ ورود" required>
            <DatePicker value={currentRow.entryDate} onChange={v => setCurrentRow(f => ({ ...f, entryDate: v }))} placeholder="انتخاب تاریخ" autoToday />
          </Field>
          <Field label="ساعت ورود">
            <TimePicker value={currentRow.entryTime} onChange={v => setCurrentRow(f => ({ ...f, entryTime: v }))} placeholder="انتخاب ساعت" />
          </Field>
        </Grid2>

        {currentRow.dealType === 'partnership' && (
          <Grid2>
            <Field label="درصد شریک" hint="٪">
              <NumField value={currentRow.dealData.partnerPercent || ''} onChange={e => { const v = clampPercent(parseInt(toEn(e.target.value)) || 0); setD('partnerPercent', v === null ? '' : String(v)); }} unit="٪" min={0} />
            </Field>
            <Field label="درصد من" hint="خودکار">
              <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--muted)' }}>{fmt.int(complement(parseInt(toEn(currentRow.dealData.partnerPercent || '0')) || 0) ?? 100)}٪</div>
            </Field>
          </Grid2>
        )}

        {currentRow.dealType === 'consignment' && (
          <Grid2>
            <Field label="درصد امانت‌دار" hint="٪">
              <NumField value={currentRow.dealData.consigneePercent || ''} onChange={e => { const v = clampPercent(parseInt(toEn(e.target.value)) || 0); setD('consigneePercent', v === null ? '' : String(v)); }} unit="٪" min={0} />
            </Field>
            <Field label="درصد من" hint="خودکار">
              <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--muted)' }}>{fmt.int(complement(parseInt(toEn(currentRow.dealData.consigneePercent || '0')) || 0) ?? 100)}٪</div>
            </Field>
          </Grid2>
        )}

        {currentRow.dealType === 'rent' && (
          <Grid2>
            <Field label="مبلغ اجاره"><MoneyField value={currentRow.dealData.rentAmount || ''} onChange={e => setD('rentAmount', e.target.value)} /></Field>
            <Field label="سرسید"><Input value={currentRow.dealData.rentDueDate || ''} onChange={e => setD('rentDueDate', e.target.value)} /></Field>
          </Grid2>
        )}

        {(currentRow.dealType === 'partnership' || currentRow.dealType === 'consignment') && (
          <div style={{ padding: 8, background: currentRow.dealStatus === 'withdrawn' ? 'var(--danger-soft)' : 'var(--input-bg)', border: '1px solid ' + (currentRow.dealStatus === 'withdrawn' ? 'var(--danger)' : 'var(--border)'), borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={currentRow.dealStatus === 'withdrawn'} onChange={e => setCurrentRow(f => ({ ...f, dealStatus: e.target.checked ? 'withdrawn' : 'active' }))} style={{ width: 18, height: 18, accentColor: 'var(--muted)' }} />
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: currentRow.dealStatus === 'withdrawn' ? 'var(--danger)' : 'var(--text)' }}>کنار کشید</span>
            </label>
            {currentRow.dealStatus === 'withdrawn' && (
              <Grid2>
                <Field label="تاریخ"><DatePicker value={currentRow.dealWithdrawnAt} onChange={v => setCurrentRow(f => ({ ...f, dealWithdrawnAt: v }))} autoToday /></Field>
                <Field label="دلیل"><Input value={currentRow.dealWithdrawnReason} onChange={e => setCurrentRow(f => ({ ...f, dealWithdrawnReason: e.target.value }))} /></Field>
              </Grid2>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4 }}>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginBottom: 8 }}>🥚 مشخصات تخم</div>
          <Grid2>
            <Field label="پرنده" required>
              <SmartSelect value={currentRow.birdId} onChange={v => setCurrentRow(f => ({ ...f, birdId: v, breedId: '' }))} options={birds.map((c: any) => ({ value: c.id, label: c.name, icon: ['chicken', 'duck', 'turkey', 'quail'].includes(c.kind || c.id) ? (c.kind || c.id) : (c.kind === 'goose' || c.id === 'goose' ? '🦢' : (c.icon || 'chicken')) }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" />
            </Field>
            <Field label="نژاد">
              <SmartSelect
                value={currentRow.breedId}
                disabled={!currentRow.birdId}
                placeholder="— انتخاب نژاد —"
                modalTitle="انتخاب نژاد"
                options={breedsForBird.map((b: any) => {
                  const purposeMap: Record<string, string> = { layer: 'تخم‌گذار', breeder: 'مادر', broiler: 'گوشتی', ornamental: 'تزئینی' };
                  const iconMap: Record<string, string> = { layer: '🥚', breeder: '🐣', broiler: '🥩', ornamental: '🦚' };
                  const purposes = b.purposes || [];
                  const sub = purposes.map((p: string) => purposeMap[p] || p).join('، ');
                  return { value: b.id, label: b.name, subtitle: sub || undefined, icon: iconMap[purposes[0]] || '🧬' };
                })}
                onChange={v => setCurrentRow(f => ({ ...f, breedId: v }))}
              />
            </Field>
          </Grid2>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
  {sourceLinked && (
    <div style={{ padding: '6px 10px', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600, marginBottom: 6 }}>
      🔒 این ردیف از فاکتور خرید اومده — برای تغییر، فاکتور را ویرایش کنید
    </div>
  )}
  <Field label={sourceLinked ? <span>تعداد تخم <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span></span> : 'تعداد تخم'} required>
                <NumField value={currentRow.count} onChange={e => !sourceLinked && setCurrentRow(f => ({ ...f, count: e.target.value }))} unit="عدد" min={0} max={999999} disabled={sourceLinked} />
              </Field>
              <FieldHint
                fieldPath="inc.count"
                value={currentRow.count}
                context={liveUsage && liveUsage.total > 0 ? { capacity: liveUsage.total } : {}}
              />
            </div>
            <Field label="طبقات (Tray)">
              <Input placeholder="شماره" dir="ltr" value={currentRow.trayNumbers} onChange={e => setCurrentRow(f => ({ ...f, trayNumbers: e.target.value }))} />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="وزن نمونه اولیه" hint="گرم">
              <NumField placeholder="۰" value={currentRow.sampleWeightInitial} onChange={e => setCurrentRow(f => ({ ...f, sampleWeightInitial: e.target.value }))} unit="گرم" min={20} max={100} />
            </Field>
            <Field label="وزن نمونه فعلی" hint="گرم">
              <NumField placeholder="۰" value={currentRow.sampleWeightCurrent} onChange={e => setCurrentRow(f => ({ ...f, sampleWeightCurrent: e.target.value }))} unit="گرم" min={20} max={100} />
            </Field>
          </Grid2>
          {(() => {
            const init = parseFloat(toEn(currentRow.sampleWeightInitial).replace('٫', '.')) || 0;
            const cur = parseFloat(toEn(currentRow.sampleWeightCurrent).replace('٫', '.')) || 0;
            if (init <= 0 || cur <= 0) return null;
            const pct = Math.round(((init - cur) / init) * 1000) / 10;
            const inRange = pct >= 11 && pct <= 13;
            return (
              <div style={{ padding: 'var(--pad-tight)', background: inRange ? 'var(--input-bg)' : 'var(--warn-soft)', border: '1px solid ' + (inRange ? 'var(--border)' : 'var(--warn)'), borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', fontWeight: 700, color: inRange ? 'var(--text)' : 'var(--warn)' }}>
                {inRange ? '✅' : '⚠️'} کاهش وزن: {fmt.num(pct)}٪ (هدف استاندارد: ۱۱-۱۳٪)
              </div>
            );
          })()}
          {(() => {
            if (!currentRow.count.trim()) return null;
            const cnt = parseInt(toEn(currentRow.count)) || 0;
            if (cnt <= 0) {
              return <div style={{ padding: 'var(--pad-tight)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700 }}>❌ تعداد باید بیشتر از صفر باشد</div>;
            }
            if (!liveUsage) return null;
            if (liveUsage.percent > 100) {
              return <div style={{ padding: 'var(--pad-tight)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700 }}>🔴 بیشتر از ظرفیت — {fmt.count(Math.abs(liveUsage.remaining))} واحد اضافی</div>;
            }
            if (liveUsage.percent > 90) {
              return <div style={{ padding: 'var(--pad-tight)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>🟡 نزدیک به ظرفیت — باقی: {fmt.count(liveUsage.remaining)} ({fmt.num(liveUsage.percent)}٪)</div>;
            }
            return <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--text)', fontWeight: 700 }}>✅ قابل قبول — باقی: {fmt.count(liveUsage.remaining)} ({fmt.num(liveUsage.percent)}٪)</div>;
          })()}
        </div>

        {(currentRow.dealType === 'purchase' || currentRow.dealType === 'partnership') && (
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginBottom: 8 }}>💰 مالی</div>
            <Grid2>
              <Field label="قیمت هر تخم">
                <MoneyField placeholder="۰" value={currentRow.unitPrice} onChange={e => setCurrentRow(f => ({ ...f, unitPrice: e.target.value }))} />
              </Field>
              <Field label="هزینه حمل">
                <MoneyField placeholder="۰" value={currentRow.shippingCost} onChange={e => setCurrentRow(f => ({ ...f, shippingCost: e.target.value }))} />
              </Field>
            </Grid2>
            {(() => {
              const cnt = parseInt(toEn(currentRow.count)) || 0;
              const up = parseFloat(toEn(currentRow.unitPrice).replace('٫', '.')) || 0;
              const sh = parseFloat(toEn(currentRow.shippingCost).replace('٫', '.')) || 0;
              const total = (cnt * up) + sh;
              if (total > 0) {
                return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', color: 'var(--text)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}><span>💰 جمع ردیف:</span><span>{fmt.money(total)}</span></div>;
              }
              return null;
            })()}
          </div>
        )}

        <Field label="یادداشت">
          <Textarea placeholder="توضیحات" value={currentRow.notes} onChange={e => setCurrentRow(f => ({ ...f, notes: e.target.value }))} />
        </Field>

        <div style={{ display: 'flex', gap: 6 }}>
          <Btn full onClick={addRowToList}>
            {editingRowId ? '💾 به‌روزرسانی ردیف' : '➕ افزودن به لیست'}
          </Btn>
          {editingRowId && <Btn onClick={resetCurrentRow}>لغو</Btn>}
        </div>
      </div>
    </Modal>
  );
}
