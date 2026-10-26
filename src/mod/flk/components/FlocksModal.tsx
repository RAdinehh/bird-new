/**
 * FlocksModal.tsx — فرم افزودن/ویرایش گله
 */
import { useEffect, useRef, useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, ErrorBox, Field, Grid2, Grid3, Input, Modal, MoneyField,
  NumField, Select, Textarea,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import DependentSelect from '../../../shr/components/DependentSelect';
import PickInvoiceModal from './PickInvoiceModal';
import PickHatchModal from './PickHatchModal';
import { applyInvoiceToForm, applyHatchToForm } from '../api/pickHandlers';
import { DepBox } from '../helpers';
import FlockSourcePickers from './FlockSourcePickers';
import FlockDealSection from './FlockDealSection';
import FlockDetailsSection from './FlockDetailsSection';
import FlockCapacityCard from './FlockCapacityCard';
import FlockIntegrityWarning from './FlockIntegrityWarning';
import { SOURCE_LABEL, DEFAULT_LAYING_START, sexRatio, useFlk } from '../store';
import { schedulesByType, getSchedule } from '../../cal/vaccineSchedules';
import { todayJ, jalaliBounds, checkDateBounds } from '../api/flocksCalc';
import { showConfirmAsync } from '../../../cor/store/dialog';
import type { F } from '../types-flocks';
import { FieldHint } from '../../../shr/intelligence';
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
  onArchive?: () => void;
  onRestore?: () => void;
}

export default function FlocksModal(props: FlocksModalProps) {

  // 🆕 Picker modals
  const [invoicePickerOpen, setInvoicePickerOpen] = useState(false);
  const [hatchPickerOpen, setHatchPickerOpen] = useState(false);


  const handleInvoiceSelect = async (inv: Invoice) => {
    const linkedFlock = useFlk.getState().flocks.find(f => f.sourceInvoiceId === inv.id);
    if (linkedFlock && (linkedFlock.status === 'archived' || linkedFlock.status === 'sold')) {
      const wantRestore = await showConfirmAsync(
        'گله آرشیو شده یافت شد',
        `از فاکتور ${inv.number || inv.id} قبلاً گله‌ای به نام «${linkedFlock.name}» ساخته شده که در آرشیو است. آیا می‌خواهید آن گله را بازیابی کنید یا یک گله جدید بسازید؟`,
        { confirmText: '♻️ بازیابی گله قبلی', cancelText: '➕ ساخت گله جدید' }
      );
      if (wantRestore) {
        useFlk.getState().restore(linkedFlock.id);
        onClose();
        return;
      }
    }
    
    const updates = applyInvoiceToForm(form, inv);
    if (!updates) return;
    setForm((f) => ({ ...f, ...updates }));
  };

  const handleHatchSelect = (h: HatchResult, entry: EggEntry | null) => {
    const updates = applyHatchToForm(form, h, entry);
    setForm((f) => ({ ...f, ...updates }));
  };

  const {
    open, onClose, form, setForm, layingFromStd, setLayingFromStd,
    err, vErrors, showError, markTouched, isValid, hallCapacity, birds, breedsForBird, halls, zonesForHall,
    breedStd, vaccineEnabled, fmt, onSave, onArchive, onRestore,
  } = props;
  const allFlocks = useFlk(st => st.flocks);


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

  // 🆕 اگه فاکتور یا هچ لینک شده، فیلدهای منبع قفل می‌شن
  const isSourceLinked = !!(form.sourceInvoiceId || form.hatchId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? 'ویرایش گله' : 'افزودن گله'}
      footer={
        <BtnRow>
          {form.id && form.status === 'archived' && onRestore && (
            <Btn onClick={onRestore} style={{ color: 'var(--accent)' }}>📦 بازگردانی</Btn>
          )}
          {form.id && form.status !== 'archived' && onArchive && (
            <Btn onClick={onArchive}>📦 آرشیو</Btn>
          )}
          <Btn variant="primary" onClick={onSave}>ذخیره</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <FlockIntegrityWarning form={form} setForm={setForm} />
      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>🏷 هویت</div>
      <Grid2>
  <Field label="نام گله" required error={showError('name')} onTouch={() => markTouched('name')}>
    <Input
      placeholder={
        form.source === 'hatch' ? 'مثلاً — جوجه‌های تفریخ مرداد'
        : form.source === 'purchase'
          ? (form.type === 'broiler' ? 'مثلاً — گله گوشتی پاییز'
            : form.type === 'breeder' ? 'مثلاً — گله مادر مرندی'
            : 'مثلاً — گله تخم‌گذار بهار')
          : 'مثلاً — گله اصلی'
      }
      value={form.name}
      onChange={e => setForm({ ...form, name: e.target.value })}
    />
  </Field>
        <Field label="نوع گله" required error={showError('type')} onTouch={() => markTouched('type')}>
          <Select value={form.type} onChange={async e => {
            const newType = e.target.value as 'layer' | 'broiler' | 'breeder';
            if (form.id) {
              const original = allFlocks.find(f => f.id === form.id);
              const hasEvents = (original?.events?.length || 0) > 0;
              const hasCountChange = original ? (original.currentCount !== original.initialCount) : false;
              if ((hasEvents || hasCountChange) && newType !== original?.type) {
                const ok = await showConfirmAsync(
                  'تغییر نوع گله',
                  'این گله داده دارد (رویدادها یا تغییر موجودی). تغییر نوع ممکنه گزارش‌های گذشته رو مختل کنه. ادامه؟'
                );
                if (!ok) return;
              }
            }
            setForm({ ...form, type: newType });
          }}>
            <option value="layer">تخم‌گذار</option>
            <option value="broiler">گوشتی</option>
            <option value="breeder">مادر (تخم نطفه‌دار)</option>
          </Select>
        </Field>
      </Grid2>

      <Grid2>
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
  <FlockSourcePickers
    form={form}
    setForm={setForm}
    onOpenInvoicePicker={() => setInvoicePickerOpen(true)}
    onOpenHatchPicker={() => setHatchPickerOpen(true)}
  />
      </Grid2>

      <FlockDealSection form={form} setForm={setForm} showError={showError} markTouched={markTouched} />

            <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>🐔 پرنده و نژاد</div>
      <Grid2>
        <Field label={isSourceLinked ? <span>🔒 پرنده</span> : "پرنده"} required error={isSourceLinked ? undefined : showError('birdId')} onTouch={() => !isSourceLinked && markTouched('birdId')}>
          <SmartSelect
            value={form.birdId}
            onChange={v => !isSourceLinked && setForm(f => ({ ...f, birdId: v, breedId: '' }))}
            options={birds.map(c => ({ value: c.id, label: c.name }))}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب پرنده"
            autoThreshold={6}
            disabled={isSourceLinked}
          />
        </Field>
        <Field label={isSourceLinked ? <span>🔒 نژاد</span> : "نژاد"} error={isSourceLinked ? undefined : (form.breedKind === 'mixed' ? undefined : showError('breedId'))} onTouch={() => !isSourceLinked && markTouched('breedId')}>
          {form.breedKind === 'mixed' ? (
            <Input
              value={form.breedLabel || ''}
              onChange={e => !isSourceLinked && setForm(f => ({ ...f, breedLabel: e.target.value }))}
              placeholder="مثلاً: مرندی محلی"
            disabled={isSourceLinked && !!form.breedId}
            />
          ) : (
            <DependentSelect
              disabled={isSourceLinked && !!form.breedId}
              value={form.breedId}
              onChange={v => { if (isSourceLinked) return;
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
          )}
        </Field>
      </Grid2>
        {form.birdId && !isSourceLinked && (
          <div style={{ textAlign: 'right', fontSize: 'var(--fs-xs)', marginTop: 4 }}>
            {form.breedKind === 'mixed' ? (
              <button type="button" onClick={() => setForm(f => ({ ...f, breedKind: 'standard', breedLabel: '' }))} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>
                بازگشت به انتخاب نژاد استاندارد
              </button>
            ) : (
              <button type="button" onClick={() => setForm(f => ({ ...f, breedKind: 'mixed', breedId: '' }))} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>
                نژاد مورد نظر نیست؟ ثبت گله مختلط
              </button>
            )}
          </div>
        )}

      <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📍 مکان</div>
      <Grid2>
        <Field label="سالن (اختیاری)" hint="قابل تخصیص بعداً" error={showError('hallId')} onTouch={() => markTouched('hallId')}>
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
        <Grid2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field
              label="سن شروع تخم‌گذاری (روز)" error={showError('layingStartDay')} onTouch={() => markTouched('layingStartDay')}
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
            {!showError('layingStartDay') && <FieldHint fieldPath="flk.layingStartDay" value={form.layingStartDay || formLaying} context={{ expected: formLaying || undefined }} />}
          </div>
          <div style={{ display: (parseInt(toEn(form.initialCount)) || 0) > 0 ? 'contents' : 'none' }}>
<div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field
              label="سن پایان چرخه (روز)" error={showError('endOfCycleDay')} onTouch={() => markTouched('endOfCycleDay')}
              hint={form.endOfCycleDay ? undefined : 'خالی = از استاندارد نژاد'}
            >
              <NumField
                value={form.endOfCycleDay || ''}
                onChange={e => setForm({ ...form, endOfCycleDay: e.target.value })}
                placeholder={formStd?.biology?.endOfCycleDay ? fmt.int(formStd.biology.endOfCycleDay) : '—'}
                unit="روز"
                max={600}
                min={100}
              />
            </Field>
            {!showError('endOfCycleDay') && <FieldHint fieldPath="flk.endOfCycleDay" value={form.endOfCycleDay} context={{ expected: formStd?.biology?.endOfCycleDay ?? undefined }} />}
          </div>
</div>
        </Grid2>
      )}

      <Grid2>
        <Field
          label={isSourceLinked ? <span>تعداد اولیه <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span></span> : 'تعداد اولیه'}
          required
          hint={isSourceLinked ? '🔒 از فاکتور — برای تغییر، فاکتور را ویرایش کنید' : undefined}
          error={showError('initialCount')}
          onTouch={() => markTouched('initialCount')}
        >
          <NumField placeholder="۸۵۰" disabled={isSourceLinked} value={form.initialCount} onChange={e => {
            if (isSourceLinked) return;
            const v = e.target.value;
            setForm(f => ({
              ...f,
              initialCount: v,
              currentCount: (!f.currentCount || f.currentCount === f.initialCount) ? v : f.currentCount,
            }));
          }} unit="پرنده" min={1} max={100000} autoClamp />
        </Field>
        <Field label="تعداد فعلی" hint="اگه خالی بمونه = تعداد اولیه" error={showError('currentCount')} onTouch={() => markTouched('currentCount')}>
          <NumField placeholder="۸۳۲" value={form.currentCount} onChange={e => setForm({ ...form, currentCount: e.target.value })} unit="پرنده" min={1} max={100000} autoClamp />
        </Field>
      </Grid2>

      <FlockCapacityCard hallCapacity={hallCapacity} />

      {form.type === 'breeder' && (
        <DepBox title="اطلاعات گله مادر" tone="purple">
          <Grid3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="تعداد خروس" error={showError('maleCount')} onTouch={() => markTouched('maleCount')}>
                <NumField placeholder="۸۰" value={form.maleCount} onChange={e => setForm({ ...form, maleCount: e.target.value })} min={0} max={100000} unit="پرنده" autoClamp />
              </Field>
              {!showError('maleCount') && <FieldHint fieldPath="flk.maleCount" value={form.maleCount} context={{ initialCount: form.initialCount }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="تعداد مرغ" error={showError('femaleCount')} onTouch={() => markTouched('femaleCount')}>
                <NumField placeholder="۸۰۰" value={form.femaleCount} onChange={e => setForm({ ...form, femaleCount: e.target.value })} min={0} max={100000} unit="پرنده" autoClamp />
              </Field>
              {!showError('femaleCount') && <FieldHint fieldPath="flk.femaleCount" value={form.femaleCount} context={{ initialCount: form.initialCount }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field label="تعداد نامشخص" error={showError('unknownCount')} onTouch={() => markTouched('unknownCount')}>
              <NumField placeholder="۰" value={form.unknownCount || ''} onChange={e => setForm({ ...form, unknownCount: e.target.value })} min={0} max={100000} unit="پرنده" autoClamp />
            </Field>
            {!showError('unknownCount') && <FieldHint fieldPath="flk.unknownCount" value={form.unknownCount} context={{ initialCount: form.initialCount }} />}
          </div>
          </Grid3>
          {form.maleCount && form.femaleCount && (() => {
            const male = parseInt(toEn(form.maleCount)) || 0;
            const female = parseInt(toEn(form.femaleCount)) || 0;
            const unknown = parseInt(toEn(form.unknownCount || '0')) || 0;
            const init = parseInt(toEn(form.initialCount)) || 0;
            const sum = male + female + unknown;
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
                    مجموع ({toFa(sum)}) ≠ تعداد اولیه ({toFa(init)})
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
        isSourceLinked={isSourceLinked}
      />

      {err && <ErrorBox>{err}</ErrorBox>}
    
      <PickInvoiceModal
        open={invoicePickerOpen}
        onClose={() => setInvoicePickerOpen(false)}
        onSelect={handleInvoiceSelect}
        currentBirdId={form.birdId}
      />
      <PickHatchModal
        open={hatchPickerOpen}
        onClose={() => setHatchPickerOpen(false)}
        onSelect={handleHatchSelect}
      />
      </Modal>
  );
}
