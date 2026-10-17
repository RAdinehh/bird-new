/**
 * FlocksModal.tsx — فرم افزودن/ویرایش گله
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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
import FlockSourcePickers from './FlockSourcePickers';
import FlockDetailsSection from './FlockDetailsSection';
import FlockCapacityCard from './FlockCapacityCard';
import { SOURCE_LABEL, DEFAULT_LAYING_START, sexRatio, useFlk } from '../store';
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
  const allFlocks = useFlk(st => st.flocks);
  const nameSuggestions = useMemo(() => {
    const out: string[] = [];
    const today = todayJ();
    const parts = today.split('/');
    const year = parts[0];
    const jMonth = parseInt(parts[1]);
    const season = jMonth <= 3 ? 'بهار' : jMonth <= 6 ? 'تابستان' : jMonth <= 9 ? 'پاییز' : 'زمستان';
    const base = 'گله ' + season + ' ' + year;
    const seasonExists = allFlocks.some(f => f.name.trim() === base);
    out.push(seasonExists ? base + ' - ۲' : base);
    if (form.hallId) {
      const hallName = halls.find(h => h.id === form.hallId)?.name || 'سالن';
      const prefix = 'گله ' + hallName + ' - ';
      const nums = allFlocks.filter(f => f.hallId === form.hallId && f.name.startsWith(prefix))
        .map(f => parseInt(f.name.slice(prefix.length)) || 0);
      out.push(prefix + toFa(Math.max(0, ...nums) + 1));
    }
    if (form.breedId) {
      const std = breedStd.byBreedId(form.breedId);
      const breedName = (std as { nameFa?: string } | null)?.nameFa || '';
      if (breedName) {
        const prefix = 'گله ' + breedName + ' - ';
        const nums = allFlocks.filter(f => f.name.startsWith(prefix))
          .map(f => parseInt(f.name.slice(prefix.length)) || 0);
        out.push(prefix + toFa(Math.max(0, ...nums) + 1));
      }
    }
    return out.filter(sg => sg !== form.name.trim());
  }, [allFlocks, form.hallId, form.breedId, form.name, halls, breedStd]);

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

      {nameSuggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: -4, marginBottom: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>پیشنهاد:</span>
          {nameSuggestions.map(sg => (
            <button
              key={sg}
              type="button"
              onClick={() => setForm(f => ({ ...f, name: sg }))}
              style={{ padding: '3px 8px', fontSize: 11, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >{sg}</button>
          ))}
        </div>
      )}

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

      <FlockSourcePickers
        form={form}
        setForm={setForm}
        onOpenInvoicePicker={() => setInvoicePickerOpen(true)}
        onOpenHatchPicker={() => setHatchPickerOpen(true)}
      />

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

      <FlockCapacityCard hallCapacity={hallCapacity} />

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


      <FlockDetailsSection
        form={form}
        setForm={setForm}
        showError={showError}
        markTouched={markTouched}
        liveCosts={liveCosts}
        vaccineEnabled={vaccineEnabled}
      />

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
