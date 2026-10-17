/**
 * FlocksModal.tsx — فرم افزودن/ویرایش گله
 */
import { useEffect, useRef, useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Input, Modal, MoneyField,
  NumField, Select, Textarea,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import DependentSelect from '../../../shr/components/DependentSelect';
import PickInvoiceModal from './PickInvoiceModal';
import PickHatchModal from './PickHatchModal';
import { DepBox } from '../helpers';
import { SOURCE_LABEL, DEFAULT_LAYING_START, sexRatio } from '../store';
import { schedulesByType, getSchedule } from '../../cal/vaccineSchedules';
import { todayJ, jalaliBounds, checkDateBounds } from '../api/flocksCalc';
import type { F } from '../types-flocks';
import type { Bird, Breed } from '../../brd/store';
import type { Invoice, InvoiceItem } from '../../tra/types';
import type { HatchResult, EggEntry } from '../../inc/store';
import type { Hall, Zone } from '../../hal/store';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';
import type { useFormat } from '../../../shr/units';

type BreedStd = ReturnType<typeof useBreedStandard>;
type Fmt = ReturnType<typeof useFormat>;

export interface FlocksModalProps {
  open: boolean;
  onClose: () => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  layingFromStd: boolean;
  setLayingFromStd: (v: boolean) => void;
  err: string;
  vErrors: Record<string, string>;
  /** 🆕 تابع نمایش خطا (بر اساس touched/saveAttempted) */
  showError: (field: string) => string | undefined;
  /** 🆕 علامت‌گذاری لمس فیلد */
  markTouched: (field: string) => void;
  /** 🆕 آیا فیلد معتبر ئه؟ */
  isValid: (field: string) => boolean;
  /** 🆕 ظرفیت سالن/بخش (inline) */
  hallCapacity?: import('../api/hallCapacity').HallCapacityResult | null;
  // داده
  birds: Bird[];
  breedsForBird: Breed[];
  halls: Hall[];
  zonesForHall: Zone[];
  breedStd: BreedStd;
  vaccineEnabled: boolean;
  fmt: Fmt;
  // actions
  onSave: () => void;
}

export default function FlocksModal(props: FlocksModalProps) {

  // 🆕 Picker modals
  const [invoicePickerOpen, setInvoicePickerOpen] = useState(false);
  const [hatchPickerOpen, setHatchPickerOpen] = useState(false);

  const handleInvoiceSelect = (inv: Invoice) => {
    const birdItems = (inv.items || []).filter((it: InvoiceItem) => it.birdId);
    if (!birdItems.length) return;
    const totalQty = birdItems.reduce((s: number, it: InvoiceItem) => s + (it.quantity || 0), 0);
    const firstBird = birdItems[0];
    const updates: Partial<F> = {
      initialCount: toFa(totalQty),
      currentCount: toFa(totalQty),
      purchaseDate: inv.date || '',
      birdId: firstBird.birdId || '',
      breedId: firstBird.breedId || '',
      sourceInvoiceId: inv.id,
    };
    if (firstBird.unitPrice) updates.purchasePrice = toFa(firstBird.unitPrice);
    if (firstBird.maleCount) updates.maleCount = toFa(firstBird.maleCount);
    if (firstBird.femaleCount) updates.femaleCount = toFa(firstBird.femaleCount);
    setForm((f) => ({ ...f, ...updates }));
  };

  const handleHatchSelect = (h: HatchResult, entry: EggEntry | null) => {
    const updates: Partial<F> = {
      initialCount: toFa(h.hatched || 0),
      currentCount: toFa(h.hatched || 0),
      hatchDate: h.date || '',
      hatchId: h.id,
    };
    if (entry?.birdId) updates.birdId = entry.birdId;
    if (entry?.breedId) updates.breedId = entry.breedId;
    setForm((f) => ({ ...f, ...updates }));
  };

  const {
    open, onClose, form, setForm, layingFromStd, setLayingFromStd,
    err, vErrors, showError, markTouched, isValid, hallCapacity, birds, breedsForBird, halls, zonesForHall,
    breedStd, vaccineEnabled, fmt, onSave,
  } = props;

  const formStd = breedStd.byBreedId(form.breedId);
  const formLaying = formStd?.biology?.layingStartDay ?? DEFAULT_LAYING_START;

  const liveCosts = (() => {
    const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || 0 : 0;
    const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;
    const bird = int(form.initialCount) * num(form.purchasePrice);
    const del = num(form.deliveryCost);
    const oth = num(form.otherCosts);
    const total = bird + del + oth;
    const per = int(form.initialCount) ? total / (int(form.initialCount) || 1) : 0;
    return { bird, del, oth, total, per };
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? 'ویرایش گله' : 'افزودن گله'}
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={onSave}>ذخیره</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>🏷 هویت</div>
      <Field label="نام گله" required error={showError('name')} onTouch={() => markTouched('name')}>
        <Input placeholder="مثلاً — گله بهار ۱۴۰۵" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </Field>

      <Grid2>
        <Field label="نوع گله" required error={showError('type')} onTouch={() => markTouched('type')}>
          <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'layer' | 'broiler' | 'breeder' })}>
            <option value="layer">تخم‌گذار</option>
            <option value="broiler">گوشتی</option>
            <option value="breeder">مادر (تخم نطفه‌دار)</option>
          </Select>
        </Field>
        <Field label="منبع">
          <Select value={form.source} onChange={e => {
            const newSource = e.target.value;
            const today = todayJ();
            setForm(f => {
              if (newSource === 'hatch') {
                return { ...f, source: newSource, hatchDate: f.hatchDate || today, purchaseDate: '', purchasePrice: '', deliveryCost: '' };
              }
              if (newSource === 'purchase') {
                return { ...f, source: newSource, purchaseDate: f.purchaseDate || today, purchasePrice: f.purchasePrice, deliveryCost: f.deliveryCost };
              }
              return { ...f, source: newSource };
            });
          }}>
            {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
      </Grid2>

      {form.source === 'purchase' && (
        <Field label="فاکتور خرید" hint="برای پر کردن خودکار، یک فاکتور انتخاب کنید">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setInvoicePickerOpen(true)}
              style={{
                width: '100%',
                height: 38,
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '0 12px',
                paddingLeft: form.sourceInvoiceId ? 34 : 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-base)',
                color: form.sourceInvoiceId ? 'var(--text)' : 'var(--dim)',
                textAlign: 'right',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.sourceInvoiceId
                  ? '📄 فاکتور ' + form.sourceInvoiceId.slice(0, 8)
                  : '— انتخاب از فاکتور —'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {form.sourceInvoiceId && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sourceInvoiceId: '', initialCount: '', currentCount: '', purchaseDate: '', purchasePrice: '' }))}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--danger)',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
                title="پاک کردن"
              >✕</button>
            )}
          </div>
        </Field>
      )}

      {form.source === 'hatch' && (
        <Field label="هچ (جوجه‌کشی)" hint="برای پر کردن خودکار، یک هچ انتخاب کنید">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setHatchPickerOpen(true)}
              style={{
                width: '100%',
                height: 38,
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '0 12px',
                paddingLeft: form.hatchId ? 34 : 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-base)',
                color: form.hatchId ? 'var(--text)' : 'var(--dim)',
                textAlign: 'right',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.hatchId
                  ? '🐣 هچ ' + toFa(form.hatchDate || '')
                  : '— انتخاب از هچ —'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {form.hatchId && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, hatchId: '', initialCount: '', currentCount: '', hatchDate: '' }))}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--danger)',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
                title="پاک کردن"
              >✕</button>
            )}
          </div>
        </Field>
      )}

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>🐔 پرنده و نژاد</div>
      <Grid2>
        <Field label="پرنده" required error={showError('birdId')} onTouch={() => markTouched('birdId')}>
          <SmartSelect
            value={form.birdId}
            onChange={v => setForm(f => ({ ...f, birdId: v, breedId: '' }))}
            options={birds.map(c => ({ value: c.id, label: c.name }))}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب پرنده"
            autoThreshold={6}
          />
        </Field>
        <Field label="نژاد" error={showError('breedId')} onTouch={() => markTouched('breedId')}>
          <DependentSelect
            value={form.breedId}
            onChange={v => {
              const std = breedStd.byBreedId(v);
              const layStart = std?.biology?.layingStartDay;
              if (layStart != null) {
                setForm(f => ({ ...f, breedId: v, layingStartDay: String(layStart) }));
                setLayingFromStd(true);
              } else {
                setForm(f => ({ ...f, breedId: v }));
                setLayingFromStd(false);
              }
            }}
            parentValue={form.birdId}
            parentLabel="پرنده"
            options={breedsForBird.map(b => ({ value: b.id, label: b.name }))}
            emptyListMessage="این پرنده هنوز نژادی ندارد — از بخش «پرنده و نژاد» اضافه کنید"
            placeholder="— انتخاب نژاد —"
            modalTitle="انتخاب نژاد"
          />
        </Field>
      </Grid2>

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📍 مکان</div>
      <Grid2>
        <Field label="سالن" required error={showError('hallId')} onTouch={() => markTouched('hallId')}>
          <SmartSelect
            value={form.hallId}
            onChange={v => setForm(f => ({ ...f, hallId: v, zoneId: '' }))}
            options={halls.map(c => ({ value: c.id, label: c.name }))}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب سالن"
            autoThreshold={6}
          />
        </Field>
        <Field label="بخش">
          <DependentSelect
            value={form.zoneId || ''}
            onChange={v => setForm(f => ({ ...f, zoneId: v }))}
            parentValue={form.hallId}
            parentLabel="سالن"
            options={zonesForHall.map(z => ({ value: z.id, label: z.name }))}
            emptyListMessage="این سالن هنوز بخشی ندارد — از تب «بخش‌ها» اضافه کنید"
            emptyMode="select"
            placeholder="— بدون بخش —"
            modalTitle="انتخاب بخش"
            autoThreshold={6}
          />
        </Field>
      </Grid2>

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📊 تعداد</div>

      {(form.type === 'layer' || form.type === 'breeder') && (
        <Field
          label="سن شروع تخم‌گذاری (روز)"
          autoFrom={layingFromStd && formStd?.biology?.layingStartDay ? 'استاندارد نژاد (' + toFa(formStd.biology.layingStartDay) + ' روز)' : undefined}
        >
          <NumField
            value={form.layingStartDay || (formLaying ? String(formLaying) : '')}
            onChange={e => { setForm({ ...form, layingStartDay: e.target.value }); setLayingFromStd(false); }}
            placeholder={fmt.int(formLaying)}
            unit="روز"
            max={250}
            min={100}
          />
        </Field>
      )}

      <Grid2>
        <Field label="تعداد اولیه" required error={showError('initialCount')} onTouch={() => markTouched('initialCount')}>
          <NumField placeholder="۸۵۰" value={form.initialCount} onChange={e => {
            const v = e.target.value;
            setForm(f => ({
              ...f,
              initialCount: v,
              // 🆕 اگه currentCount خالی بود یا با initialCount قبلی برابر بود، sync کن
              currentCount: (!f.currentCount || f.currentCount === f.initialCount) ? v : f.currentCount,
            }));
          }} unit="پرنده" min={1} max={100000} autoClamp />
        </Field>
        <Field label="تعداد فعلی" hint="اگه خالی بمونه = تعداد اولیه" onTouch={() => markTouched('currentCount')}>
          <NumField placeholder="۸۳۲" value={form.currentCount} onChange={e => setForm({ ...form, currentCount: e.target.value })} unit="پرنده" min={1} max={100000} autoClamp />
        </Field>
      </Grid2>

      {/* capacity card + breakdown */}
      {hallCapacity && (
        <div style={{
          padding: 'var(--pad-normal)',
          background: hallCapacity.ok ? 'var(--accent-soft)' : 'var(--warn-soft)',
          border: '1px solid ' + (hallCapacity.ok ? 'var(--accent-border)' : 'var(--warn)'),
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-xs)',
          color: hallCapacity.ok ? 'var(--accent)' : 'var(--warn)',
          fontWeight: 600,
          lineHeight: 1.7,
          direction: 'rtl',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
              {hallCapacity.ok ? '✅ ظرفیت کافیه' : '⚠️ اضافه‌بار ' + toFa(hallCapacity.over) + ' پرنده'}
            </span>
            <span style={{ opacity: 0.85 }}>سالن {hallCapacity.scopeName} · {toFa(hallCapacity.capacity)} ظرفیت</span>
          </div>

          {hallCapacity.breakdown && (
            <div style={{ paddingTop: 6, borderTop: '1px dashed currentColor', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', fontWeight: hallCapacity.breakdown.noZone.isCurrent ? 700 : 500 }}>
                <span>{hallCapacity.breakdown.noZone.isCurrent ? '👉 بدون بخش' : 'بدون بخش'}</span>
                <span style={{ display: 'flex', gap: 'var(--sp-3)', flexShrink: 0 }}>
                  {hallCapacity.breakdown.noZone.used > 0 ? (
                    <>
                      <span>{toFa(hallCapacity.breakdown.noZone.used)} پرنده</span>
                      <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(hallCapacity.breakdown.noZone.remaining)} خالی)</span>
                    </>
                  ) : (
                    <>
                      <span style={{ opacity: 0.6 }}>خالی</span>
                      <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(hallCapacity.breakdown.noZone.capacity)} ظرفیت)</span>
                    </>
                  )}
                </span>
              </div>

              {hallCapacity.breakdown.zones.map(z => {
                const isOccupied = z.used > 0 || z.isCurrent;
                return (
                  <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', fontWeight: z.isCurrent ? 700 : 500 }}>
                    <span>{'📦'} {z.name}{isOccupied ? ' 🔒' : ''}</span>
                    <span style={{ display: 'flex', gap: 'var(--sp-3)', flexShrink: 0 }}>
                      {z.used > 0 ? (
                        <>
                          <span>{toFa(z.used)} از {toFa(z.capacity)}</span>
                          <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(z.remaining)} خالی)</span>
                        </>
                      ) : z.isCurrent ? (
                        <>
                          <span>این گله اینجا</span>
                          <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(z.capacity)} ظرفیت)</span>
                        </>
                      ) : (
                        <>
                          <span style={{ opacity: 0.6 }}>خالی</span>
                          <span style={{ opacity: 0.75, minWidth: 60, textAlign: 'left' }}>({toFa(z.capacity)} ظرفیت)</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ paddingTop: 6, marginTop: 6, borderTop: '1px dashed currentColor', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <span>این گله: <b>{toFa(hallCapacity.total - hallCapacity.current)}</b> پرنده</span>
            <span style={{ fontWeight: 700 }}>
              مجموع {toFa(hallCapacity.total)} از {toFa(hallCapacity.capacity)}
              {' · '}
              {hallCapacity.over > 0
                ? <span style={{ color: 'var(--danger)' }}>اضافه {toFa(hallCapacity.over)}</span>
                : <span>{toFa(hallCapacity.remaining)} خالی</span>}
            </span>
          </div>
        </div>
      )}


      {form.type === 'breeder' && (
        <DepBox title="اطلاعات گله مادر" tone="purple">
          <Grid2>
            <Field label="تعداد خروس">
              <NumField placeholder="۸۰" value={form.maleCount} onChange={e => setForm({ ...form, maleCount: e.target.value })} min={0} max={100000} unit="پرنده" autoClamp />
            </Field>
            <Field label="تعداد مرغ">
              <NumField placeholder="۸۰۰" value={form.femaleCount} onChange={e => setForm({ ...form, femaleCount: e.target.value })} min={0} max={100000} unit="پرنده" autoClamp />
            </Field>
          </Grid2>
          {form.maleCount && form.femaleCount && (() => {
            const male = parseInt(toEn(form.maleCount)) || 0;
            const female = parseInt(toEn(form.femaleCount)) || 0;
            const init = parseInt(toEn(form.initialCount)) || 0;
            const sum = male + female;
            const mismatch = init > 0 && sum !== init;
            return (
              <>
                <div style={{ padding: 'var(--pad-normal)', background: 'var(--purple-soft)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--purple)', fontWeight: 600 }}>
                  نسبت خروس به مرغ: {sexRatio(male, female)}
                </div>
                {mismatch && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--warn-soft)',
                    border: '1px solid rgba(245,158,11,.4)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--warn)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    ⚠️ مجموع نر و ماده ({toFa(sum)}) با تعداد اولیه ({toFa(init)}) یکسان نیست
                  </div>
                )}
              </>
            );
          })()}
        </DepBox>
      )}


      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📅 تاریخ‌ها</div>

      {form.source === 'hatch' && (
        <Grid2>
          <Field label="تاریخ هچ" hint="خروج جوجه از دستگاه" error={showError('hatchDate')} onTouch={() => markTouched('hatchDate')}>
            <DatePicker value={form.hatchDate} onChange={v => setForm({ ...form, hatchDate: v })} placeholder="انتخاب" autoToday min={jalaliBounds(18).min} max={jalaliBounds(18).max} warn={checkDateBounds(form.hatchDate, jalaliBounds(18))} />
          </Field>
          <Field label="تاریخ شروع نگهداری" hint="اگه دقیق نمی‌دونی" error={showError('startDate')} onTouch={() => markTouched('startDate')}>
            <DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="اختیاری" min={jalaliBounds(24).min} max={jalaliBounds(24).max} warn={checkDateBounds(form.startDate, jalaliBounds(24))} />
          </Field>
        </Grid2>
      )}

      {form.source === 'purchase' && (
        <>
          <Grid2>
            <Field label="تاریخ خرید" hint="روزی که گله رسید" error={showError('purchaseDate')} onTouch={() => markTouched('purchaseDate')}>
              <DatePicker value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} placeholder="انتخاب" autoToday min={jalaliBounds(18).min} max={jalaliBounds(18).max} warn={checkDateBounds(form.purchaseDate, jalaliBounds(18))} />
            </Field>
            <Field label="تاریخ شروع نگهداری" hint="اگه دقیق نمی‌دونی" error={showError('startDate')} onTouch={() => markTouched('startDate')}>
              <DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="اختیاری" min={jalaliBounds(24).min} max={jalaliBounds(24).max} warn={checkDateBounds(form.startDate, jalaliBounds(24))} />
            </Field>
          </Grid2>
          <Field label="تاریخ هچ (اختیاری)" hint="اگر فروشنده گفته">
            <DatePicker value={form.hatchDate} onChange={v => setForm({ ...form, hatchDate: v })} placeholder="اختیاری" />
          </Field>
        </>
      )}

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>💰 هزینه‌ها</div>

      <Grid2>
        <Field label="قیمت هر پرنده" error={showError('purchasePrice')} onTouch={() => markTouched('purchasePrice')}>
          <MoneyField placeholder="۰" min={1000} max={5000000} value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
        </Field>
        <Field label="هزینه حمل" error={showError('deliveryCost')} onTouch={() => markTouched('deliveryCost')}>
          <MoneyField placeholder="۰" max={500000000} value={form.deliveryCost} onChange={e => setForm({ ...form, deliveryCost: e.target.value })} />
        </Field>
      </Grid2>
      <Field label="سایر هزینه‌ها" hint="واکسن اولیه، دارو، تجهیزات همراه" error={showError('otherCosts')} onTouch={() => markTouched('otherCosts')}>
        <MoneyField placeholder="۰" max={500000000} value={form.otherCosts} onChange={e => setForm({ ...form, otherCosts: e.target.value })} />
      </Field>

      {liveCosts.total > 0 && (
        <div style={{ padding: 'var(--pad-comfy)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--fs-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
            <span>قیمت پرنده‌ها:</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.bird.toLocaleString('fa-IR'))} ت</span>
          </div>
          {liveCosts.del > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>هزینه حمل:</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.del.toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
          {liveCosts.oth > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>سایر:</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.oth.toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 6, marginTop: 2 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>جمع کل:</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(liveCosts.total.toLocaleString('fa-IR'))} ت</span>
          </div>
          {liveCosts.per > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>💰 هر پرنده:</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(Math.round(liveCosts.per).toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
        </div>
      )}

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>💉 برنامه واکسن</div>
      {vaccineEnabled && (
        <Field
          label="برنامه واکسن"
          hint={form.vaccineScheduleId ? undefined : 'اگه انتخاب کنی، واکسن‌ها خودکار به تقویم اضافه می‌شن'}
          autoFrom={form.vaccineScheduleId ? (() => {
            const sch = getSchedule(form.vaccineScheduleId);
            return sch ? `تقویم • ${sch.items.length} مرحله` : 'تقویم';
          })() : undefined}
        >
          <Select value={form.vaccineScheduleId} onChange={e => setForm({ ...form, vaccineScheduleId: e.target.value })}>
            <option value="">— بدون برنامه —</option>
            {schedulesByType(form.type as 'layer' | 'broiler' | 'breeder').map(sch => (
              <option key={sch.id} value={sch.id}>{sch.label}</option>
            ))}
          </Select>
        </Field>
      )}

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📝 یادداشت</div>
      <Field label="یادداشت">
        <Textarea placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </Field>

      {err && <ErrorBox>{err}</ErrorBox>}
    
      <PickInvoiceModal
        open={invoicePickerOpen}
        onClose={() => setInvoicePickerOpen(false)}
        onSelect={handleInvoiceSelect}
      />
      <PickHatchModal
        open={hatchPickerOpen}
        onClose={() => setHatchPickerOpen(false)}
        onSelect={handleHatchSelect}
      />
      </Modal>
  );
}
