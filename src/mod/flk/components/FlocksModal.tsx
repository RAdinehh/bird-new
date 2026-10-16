/**
 * FlocksModal.tsx — فرم افزودن/ویرایش گله
 */
import { useEffect, useRef } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Input, Modal, MoneyField,
  NumField, Select, Textarea,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import DependentSelect from '../../../shr/components/DependentSelect';
import { DepBox } from '../helpers';
import { SOURCE_LABEL, DEFAULT_LAYING_START, sexRatio } from '../store';
import { schedulesByType, getSchedule } from '../../cal/vaccineSchedules';
import { todayJ, jalaliBounds, checkDateBounds } from '../api/flocksCalc';
import type { F } from '../types-flocks';
import type { Bird, Breed } from '../../brd/store';
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

function ValidIcon({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-label="معتبر"
      style={{
        color: 'var(--accent)',
        fontSize: '1em',
        fontWeight: 700,
        marginRight: 2,
      }}
    >✓</span>
  );
}

export default function FlocksModal(props: FlocksModalProps) {
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
        <Field label={<span>تعداد اولیه <ValidIcon show={isValid('initialCount')} /></span>} required error={showError('initialCount')} onTouch={() => markTouched('initialCount')}>
          <NumField placeholder="۸۵۰" value={form.initialCount} onChange={e => setForm({ ...form, initialCount: e.target.value })} unit="پرنده" min={1} max={100000} autoClamp />
        </Field>
        <Field label={<span>تعداد فعلی <ValidIcon show={isValid('currentCount')} /></span>} hint="اگه خالی بمونه = تعداد اولیه" onTouch={() => markTouched('currentCount')}>
          <NumField placeholder="۸۳۲" value={form.currentCount} onChange={e => setForm({ ...form, currentCount: e.target.value })} unit="پرنده" min={1} max={100000} autoClamp />
        </Field>
      </Grid2>

      {/* 🆕 ظرفیت سالن + breakdown بخش‌ها */}
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
        }}>
          {/* خط اول: خلاصه وضعیت فعلی + تیک */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 'var(--fs-base)',
              fontWeight: 700,
            }}>{hallCapacity.ok ? '✅' : '⚠️'}</span>
            <span style={{ fontWeight: 700 }}>
              {hallCapacity.scope === 'zone' ? 'بخش' : 'سالن'}:
            </span>
            <span>ظرفیت {toFa(hallCapacity.capacity)}</span>
          </div>

          {/* 🆕 خط دوم: این گله · بعد از ذخیره */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: hallCapacity.breakdown ? 6 : 0 }}>
            <span>فعلی: {toFa(hallCapacity.current)}</span>
            <span>·</span>
            <span>این گله: {toFa(hallCapacity.total - hallCapacity.current)}</span>
            <span>·</span>
            <span style={{ fontWeight: 700 }}>بعد از ذخیره: {toFa(hallCapacity.total)}</span>
            <span>·</span>
            {hallCapacity.over > 0 ? (
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>⚠️ اضافه‌بار {toFa(hallCapacity.over)}</span>
            ) : (
              <span style={{ fontWeight: 700 }}>باقی {toFa(hallCapacity.remaining)}</span>
            )}
          </div>

          {/* خط دوم: breakdown بخش‌ها */}
          {hallCapacity.breakdown && (
            <div style={{
              paddingTop: 6,
              borderTop: '1px dashed currentColor',
              opacity: 0.9,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}>
              {/* گله‌های بدون بخش */}
              <div style={{
                display: 'flex',
                gap: 'var(--sp-2)',
                alignItems: 'center',
                fontWeight: hallCapacity.breakdown.noZone.isCurrent ? 700 : 500,
              }}>
                <span>{hallCapacity.breakdown.noZone.isCurrent ? '👉' : '·'}</span>
                <span style={{ flex: 1 }}>بدون بخش</span>
                <span>{toFa(hallCapacity.breakdown.noZone.used)}/{toFa(hallCapacity.breakdown.noZone.capacity)}</span>
                <span style={{ opacity: 0.75 }}>(باقی {toFa(hallCapacity.breakdown.noZone.remaining)})</span>
              </div>

              {/* بخش‌ها */}
              {hallCapacity.breakdown.zones.map(z => (
                <div
                  key={z.id}
                  style={{
                    display: 'flex',
                    gap: 'var(--sp-2)',
                    alignItems: 'center',
                    fontWeight: z.isCurrent ? 700 : 500,
                  }}
                >
                  <span>{z.isCurrent ? '👉' : '·'}</span>
                  <span style={{ flex: 1 }}>📦 {z.name}</span>
                  <span>{toFa(z.used)}/{toFa(z.capacity)}</span>
                  <span style={{ opacity: 0.75 }}>(باقی {toFa(z.remaining)})</span>
                </div>
              ))}
            </div>
          )}
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
          {form.maleCount && form.femaleCount && (
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--purple-soft)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--purple)', fontWeight: 600 }}>
              نسبت خروس به مرغ: {sexRatio(parseInt(toEn(form.maleCount)), parseInt(toEn(form.femaleCount)))}
            </div>
          )}
        </DepBox>
      )}


      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📅 تاریخ‌ها</div>

      {form.source === 'hatch' && (
        <Field label="تاریخ هچ" hint="تاریخ خروج جوجه از دستگاه" error={showError('hatchDate')} onTouch={() => markTouched('hatchDate')}>
          <DatePicker value={form.hatchDate} onChange={v => setForm({ ...form, hatchDate: v })} placeholder="انتخاب تاریخ هچ" autoToday min={jalaliBounds(18).min} max={jalaliBounds(18).max} warn={checkDateBounds(form.hatchDate, jalaliBounds(18))} />
        </Field>
      )}

      {form.source === 'purchase' && (
        <Grid2>
          <Field label="تاریخ خرید / تحویل" hint="روزی که گله به دستت رسید" error={showError('purchaseDate')} onTouch={() => markTouched('purchaseDate')}>
            <DatePicker value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} placeholder="انتخاب تاریخ خرید" autoToday min={jalaliBounds(18).min} max={jalaliBounds(18).max} warn={checkDateBounds(form.purchaseDate, jalaliBounds(18))} />
          </Field>
          <Field label="تاریخ هچ" hint="اگر فروشنده گفته (اختیاری)">
            <DatePicker value={form.hatchDate} onChange={v => setForm({ ...form, hatchDate: v })} placeholder="اختیاری" />
          </Field>
        </Grid2>
      )}

      <Field label="تاریخ شروع نگهداری" hint="اگه تاریخ دقیق خرید یا هچ رو نمی‌دونی، این رو پر کن" error={showError('startDate')} onTouch={() => markTouched('startDate')}>
        <DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="اختیاری" min={jalaliBounds(24).min} max={jalaliBounds(24).max} warn={checkDateBounds(form.startDate, jalaliBounds(24))} />
      </Field>

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
    </Modal>
  );
}
