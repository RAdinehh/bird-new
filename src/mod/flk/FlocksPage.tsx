/**
 * FlocksPage — گله‌ها (carousel tabs مثل hal)
 */
import { useState, useMemo, useEffect } from 'react';
import { useFlk } from './store';
import { useBrd, type Bird, type Breed } from '../brd/store';
import { useHal, type Hall, type Zone } from '../hal/store';
import { useTra, type Invoice } from '../tra/store';
import { useSet } from '../set/store';
import { useFlocksForm } from './hooks/useFlocksForm';
import { checkHallCapacity } from './api/hallCapacity';
import { useFlocksKpi } from './hooks/useFlocksKpi';
import { useTabBadge } from './hooks/useTabBadge';
import { useCarousel } from '../../shr/hooks/useCarousel';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFormat } from '../../shr/units';
import { useValidation } from '../../shr/validation/useValidation';
import { useFormErrors } from '../../shr/hooks/useFormErrors';
import { createFlkSchema } from '../../shr/validation/rules/flk';
import { toEn } from '../../shr/utils/fa';
import type { TabId } from './types-flocks';
import FlocksTabs from './components/FlocksTabs';
import FlockTabPanel from './components/FlockTabPanel';
import FlocksModal from './components/FlocksModal';

export default function FlocksPage() {
  const fmt = useFormat();
  const breedStd = useBreedStandard();
  const { flocks, add, update } = useFlk();
  const vaccineEnabled = useSet(s => s.features?.vaccine !== false);
  const { birds: _birdsRaw, breeds } = useBrd();
  const { halls: _hallsRaw, zones } = useHal();
  const { invoices } = useTra();

  const [tab, setTab] = useState<TabId>('all');
  const { badge: newTabBadge, trigger: triggerBadge } = useTabBadge();

  // ─── dedupe پرنده‌ها و سالن‌ها ───
  const birds = useMemo(() => {
    const seen = new Set<string>();
    return _birdsRaw.filter(b => {
      const k = (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_birdsRaw]);

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  // ─── hook فرم ───
  const {
    open, setOpen, form, setForm, layingFromStd, setLayingFromStd, err, setErr,
    openNew, openEdit, save,
  } = useFlocksForm({ birds, halls, flocks, breedStd, add, update });

  const kpiData = useFlocksKpi(flocks);
  const breedsForBird = useMemo(() => breeds.filter(b => b.birdId === form.birdId), [breeds, form.birdId]);
  const zonesForHall = useMemo(() => zones.filter(z => z.hallId === form.hallId), [zones, form.hallId]);

  // ─── helpers برای validation ───
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  // ─── existingNames برای چک تکراری ───
  const existingNames = useMemo(
    () => flocks
      .filter(f => f.id !== form.id)
      .map(f => f.name.trim().toLowerCase())
      .filter(Boolean),
    [flocks, form.id],
  );

  // ─── schema memo ───
  const flkSchema = useMemo(
    () => createFlkSchema({ existingNames }),
    [existingNames],
  );

  // ─── validation ───
  const { errors: vErrors } = useValidation(
    flkSchema,
    {
      name: form.name || '',
      type: form.type,
      birdId: form.birdId || '',
      breedId: form.breedId || '',
      hallId: form.hallId || '',
      zoneId: form.zoneId || '',
      initialCount: form.initialCount ? int(form.initialCount) : undefined,
      currentCount: form.currentCount ? int(form.currentCount) : undefined,
      maleCount: int(form.maleCount) ?? 0,
      femaleCount: int(form.femaleCount) ?? 0,
      layingStartDay: form.layingStartDay ? int(form.layingStartDay) : undefined,
      endOfCycleDay: form.endOfCycleDay ? int(form.endOfCycleDay) : undefined,
      vaccineScheduleId: form.vaccineScheduleId || '',
      hatchDate: form.hatchDate || '',
      purchaseDate: form.purchaseDate || '',
      startDate: form.startDate || '',
      source: form.source,
      purchasePrice: form.purchasePrice ? num(form.purchasePrice) : undefined,
      deliveryCost: form.deliveryCost ? num(form.deliveryCost) : undefined,
      otherCosts: form.otherCosts ? num(form.otherCosts) : undefined,
      status: form.status,
      notes: form.notes || '',
    },
  );

  const { showError, markTouched, isValid, attemptSave } = useFormErrors(vErrors);

  // 🆕 محاسبه ظرفیت سالن/بخش — فقط وقتی سالن + تعداد داده شده
  const hallCapacity = useMemo(() => {
    if (!form.hallId) return null;
    // تبدیل اعداد فارسی + حذف جداکننده
    const toNum = (v: string) => {
      if (!v) return 0;
      const en = toEn(v).replace(/[,،]/g, '');
      return parseInt(en) || 0;
    };
    const init = form.initialCount ? toNum(form.initialCount) : 0;
    const curr = form.currentCount ? toNum(form.currentCount) : 0;
    const newCount = curr || init;
    if (!newCount) return null;
    const cap = checkHallCapacity(
      form.hallId, form.zoneId, newCount,
      flocks, halls, zones, breedStd,
      form.id || undefined, form.breedId,
    );

    return cap;
  }, [form.hallId, form.zoneId, form.initialCount, form.currentCount, form.breedId, form.id, flocks, halls, zones, breedStd]);

  // ─── شمارش برای تب‌های conditional ───
  const hiddenCount = flocks.filter(f => f.hidden && f.status === 'active').length;
  const archivedCount = flocks.filter(f => f.status === 'archived' || f.status === 'sold').length;

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [
      { id: 'all', label: 'فعال' },
      { id: 'breeder', label: 'مادر' },
      { id: 'layer', label: 'تخم‌گذار' },
      { id: 'broiler', label: 'گوشتی' },
    ];
    if (hiddenCount > 0) base.push({ id: 'hidden', label: 'پنهان' });
    if (archivedCount > 0) base.push({ id: 'archived', label: 'آرشیو' });
    return base;
  }, [hiddenCount, archivedCount]);

  // ─── اگه کاربر توی تب پنهان/آرشیو باشه و خالی شه، برگرد به «فعال» ───
  useEffect(() => {
    if (tab === 'archived' && archivedCount === 0) setTab('all');
    else if (tab === 'hidden' && hiddenCount === 0) setTab('all');
  }, [tab, archivedCount, hiddenCount]);

  // ─── carousel ───
  const tabIds = tabs.map(t => t.id);
  const { containerRef, trackRef, setInstant } = useCarousel(
    tabIds,
    tab,
    (id) => setTab(id as TabId),
    // 🆕 re-measure وقتی تعداد گله‌ها عوض می‌شه (archive/delete/add)
    [flocks.length],
  );

  return (
    <div>
      <FlocksTabs
        tabs={tabs}
        activeTab={tab}
        onTabChange={(id) => { setInstant(); setTab(id); }}
        newTabBadge={newTabBadge}
      />

      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          isolation: 'isolate',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            touchAction: 'pan-y',
            width: '100%',
            minWidth: 0,
          }}
        >
          {tabs.map(t => (
            <div
              key={t.id}
              style={{
                flex: '0 0 100%',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                direction: 'rtl',
                overflow: 'hidden',
                boxSizing: 'border-box',
                isolation: 'isolate',
              }}
            >
              <FlockTabPanel
                tab={t.id}
                active={tab === t.id}
                flocks={flocks}
                birds={birds}
                breeds={breeds}
                halls={halls}
                zones={zones}
                invoices={invoices}
                breedStd={breedStd}
                fmt={fmt}
                vaccineEnabled={vaccineEnabled}
                kpiData={kpiData}
                onEdit={openEdit}
                onAdd={openNew}
                triggerBadge={triggerBadge}
              />
            </div>
          ))}
        </div>
      </div>

      <FlocksModal
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        layingFromStd={layingFromStd}
        setLayingFromStd={setLayingFromStd}
        err={err}
        vErrors={vErrors}
        showError={showError}
        markTouched={markTouched}
        isValid={isValid}
        hallCapacity={hallCapacity}
        birds={birds}
        breedsForBird={breedsForBird}
        halls={halls}
        zonesForHall={zonesForHall}
        breedStd={breedStd}
        vaccineEnabled={vaccineEnabled}
        fmt={fmt}
        onSave={async () => {
          attemptSave();

          // 🆕 بلاک قاطع: اگه vErrors داشت، ذخیره نکن
          const errorKeys = Object.keys(vErrors);
          if (errorKeys.length > 0) {
            const firstErrors = errorKeys.slice(0, 2).map(k => vErrors[k]).join(' · ');
            setErr(`لطفاً خطاها را برطرف کنید: ${firstErrors}`);
            return;
          }

          const t = form.type as TabId | undefined;
          await save();
          if (t === 'layer' || t === 'breeder' || t === 'broiler') {
            setTimeout(() => { setInstant(); setTab(t); }, 120);
          }
        }}
      />
    </div>
  );
}
