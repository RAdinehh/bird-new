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
import { toEn, toFa } from '../../shr/utils/fa';
import { recordHistory } from '../../shr/intelligence';
import type { TabId } from './types-flocks';
import FlocksTabs from './components/FlocksTabs';
import FlockTabPanel from './components/FlockTabPanel';
import FlocksModal from './components/FlocksModal';
import GroupsPage from './components/GroupsPage';
import WithdrawalModal from './components/WithdrawalModal';
import { showConfirmAsync } from '../../cor/store/dialog';
import { showToast } from '../../cor/store/toast';

export default function FlocksPage() {
  const fmt = useFormat();
  const breedStd = useBreedStandard();
  const { flocks, add, update, archive, restore } = useFlk();
  const vaccineEnabled = useSet(s => s.features?.vaccine !== false);
  const withdrawalEnabled = useSet(s => s.features?.withdrawal === true);
  const { birds: _birdsRaw, breeds } = useBrd();
  const { halls: _hallsRaw, zones } = useHal();
  const { invoices } = useTra();

  const [tab, setTab] = useState<TabId>('all');
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
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
      sourceInvoiceId: form.sourceInvoiceId || '',
      sourceCategory: form.sourceCategory || '',
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
      dealType: (form.dealType || 'own') as any,
      rentAmount: form.rentAmount ? num(form.rentAmount) : undefined,
      rentStartDate: form.rentStartDate || '',
      rentEndDate: form.rentEndDate || '',
      rentPeriod: (form.rentPeriod || 'monthly') as any,
      rentPayments: (form.rentPayments || []).map(p => ({
        id: p.id,
        date: p.date,
        amount: Number(p.amount) || 0,
        notes: p.notes || '',
      })),
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
  const hiddenCount = flocks.filter(f => f.hidden && f.status === 'active' && !f.paused).length;
  const archivedCount = flocks.filter(f => f.status === 'archived' || f.status === 'sold').length;
  const pausedCount = flocks.filter(f => f.paused && f.status === 'active' && !f.hidden).length;

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [
      { id: 'all', label: 'فعال' },
      { id: 'breeder', label: 'مادر' },
      { id: 'layer', label: 'تخم‌گذار' },
      { id: 'broiler', label: 'گوشتی' },
    ];
    if (pausedCount > 0) base.push({ id: 'paused', label: 'غیرفعال' });
    if (hiddenCount > 0) base.push({ id: 'hidden', label: 'پنهان' });
    if (archivedCount > 0) base.push({ id: 'archived', label: 'آرشیو' });
    return base;
  }, [pausedCount, hiddenCount, archivedCount]);

  // ─── اگه کاربر توی تب پنهان/آرشیو باشه و خالی شه، برگرد به «فعال» ───
  useEffect(() => {
    if (tab === 'archived' && archivedCount === 0) setTab('all');
    else if (tab === 'hidden' && hiddenCount === 0) setTab('all');
    else if (tab === 'paused' && pausedCount === 0) setTab('all');
  }, [tab, archivedCount, hiddenCount, pausedCount]);

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
        rightAction={
          <>
            {withdrawalEnabled && (
              <button
                type="button"
                onClick={() => setWithdrawalOpen(true)}
                aria-label="دوره پرهیز"
                title="مدیریت دوره پرهیز"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 'var(--r-sm)',
                  fontFamily: 'inherit',
                }}
              >🩺</button>
            )}
            <button
              type="button"
              onClick={() => setGroupsOpen(true)}
              aria-label="گروه‌ها"
              title="مدیریت گروه‌ها"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 18,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 'var(--r-sm)',
                fontFamily: 'inherit',
              }}
            >📁</button>
          </>
        }
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
        onArchive={form.id ? async () => {
          const flock = useFlk.getState().flocks.find(f => f.id === form.id);
          let extraWarning = '';
          
          if (flock?.sourceInvoiceId) {
            const inv = useTra.getState().invoices.find(i => i.id === flock.sourceInvoiceId);
            const invNum = inv?.number ? `شماره ${inv.number}` : 'مرتبط';
            extraWarning += `\n\n⚠️ هشدار: این گله به فاکتور خرید ${invNum} متصل است. با آرشیو کردن گله، ارتباط آن با این فاکتور قطع می‌شود.`;
          }
          
          if (flock?.hatchId) {
            extraWarning += `\n\n⚠️ هشدار: این گله از یک سند هچری ساخته شده است. با آرشیو کردن گله، ارتباط آن با هچری قطع می‌شود.`;
          }

          if (flock?.sourceCategory) {
            extraWarning += `\n\n⚠️ این گله دارای دسته‌بندی (${flock.sourceCategory}) است.`;
          }

          const okA = await showConfirmAsync(
            '⚠️ آرشیو (حذف) گله',
            `آیا از آرشیو گله «${form.name}» مطمئنید؟\n\nگله از لیست فعال حذف می‌شود ولی داده‌های آن حفظ می‌شوند.${extraWarning}`,
            { confirmText: 'بله، آرشیو کن', cancelText: 'انصراف', danger: true }
          );
          if (!okA) return;
          archive(form.id!, 'دستی');
          setOpen(false);
        } : undefined}
        onRestore={form.id ? () => {
          restore(form.id!);
          setOpen(false);
        } : undefined}
        onSave={async () => {
          attemptSave();

          // 🆕 بلاک قاطع: اگه vErrors داشت، ذخیره نکن
          const errorKeys = Object.keys(vErrors);
          if (errorKeys.length > 0) {
            const firstErrors = errorKeys.slice(0, 2).map(k => vErrors[k]).join(' · ');
            setErr(`لطفاً خطاها را برطرف کنید: ${firstErrors}`);
            return;
          }

          // 🆕 duplicate check
          const invId = form.sourceInvoiceId;
          if (invId && !form.id) {
            const flocksList = (await import('./store')).useFlk.getState().flocks;
            const existing = flocksList.find((f) => f.sourceInvoiceId === invId);
            if (existing) {
              const ok = await showConfirmAsync(
                'فاکتور تکراری',
                'این فاکتور قبلاً گله «' + existing.name + '» ساخته. بازم ادامه؟',
              );
              if (!ok) return;
            }
          }

          const t = form.type as TabId | undefined;
          const saveResult = await save();

          // 🆕 Shadow Invoice: گله دستی + هزینه > 0 → فاکتور خودکار
          if (saveResult && saveResult.isNew) {
            // 🆕 ثبت تاریخچه برای Intelligence (silent — فقط در ایجاد گله)
            try {
              const parseN = (s: string | undefined) => {
                if (!s) return null;
                const n = parseFloat(toEn(s).replace('٫', '.'));
                return Number.isFinite(n) && n > 0 ? n : null;
              };
              const pPrice = parseN(form.purchasePrice);
              const dCost = parseN(form.deliveryCost);
              const oCost = parseN(form.otherCosts);
              if (pPrice !== null) recordHistory('flk.purchasePrice', pPrice, {});
              if (dCost !== null) recordHistory('flk.deliveryCost', dCost, {});
              if (oCost !== null) recordHistory('flk.otherCosts', oCost, {});
            } catch { /* silent */ }

            const isManual = !form.source || (form.source !== 'purchase' && form.source !== 'hatch');
            const _qty = parseInt(toEn(form.initialCount || '0')) || 0;
            const _unitPrice = parseFloat(toEn(form.purchasePrice || '0')) || 0;
            const _delivery = parseFloat(toEn(form.deliveryCost || '0')) || 0;
            const _other = parseFloat(toEn(form.otherCosts || '0')) || 0;
            const _total = _qty * _unitPrice + _delivery + _other;

            if (isManual && _total > 0) {
              const okShadow = await showConfirmAsync(
                'فاکتور خرید خودکار',
                'این گله هزینه‌ای معادل ' + toFa(_total.toLocaleString('fa-IR')) + ' تومان دارد.\n\nآیا یک فاکتور خرید پیش‌نویس در «معاملات» بسازم تا هزینه‌ها در گزارش‌های مالی هم لحاظ شوند؟',
              );
              if (okShadow) {
                try {
                  const { useTra } = await import('../tra/store');
                  const invDate = form.purchaseDate || form.startDate || form.hatchDate || '';
                  const invId = useTra.getState().addInvoice({
                    type: 'purchase',
                    date: invDate,
                    partyId: '',
                    category: form.type,
                    items: [{
                      id: 'item-' + Date.now(),
                      description: 'گله ' + form.name + ' — ' + _qty + ' پرنده',
                      unit: 'پرنده',
                      quantity: _qty,
                      unitPrice: _unitPrice,
                      total: _qty * _unitPrice,
                      shipping: _delivery,
                    }],
                    shipping: _delivery,
                    total: _qty * _unitPrice + _delivery,
                    payments: [],
                    dueDate: '',
                    relatedFlockId: saveResult.id,
                    relatedEntryId: '',
                    notes: 'خودکار از گله دستی «' + form.name + '»' + (_other > 0 ? ' · سایر هزینه‌ها: ' + toFa(_other.toLocaleString('fa-IR')) + ' ت' : ''),
                  } as any);
                  if (invId) {
                    // 🆕 Fix double-count: cascade گله رو از قبل با _qty ساخته بود،
                    // applyInvoiceFlocks دوباره += delta زده → reset به مقدار اصلی
                    useFlk.getState().update(saveResult.id, {
                      sourceInvoiceId: invId,
                      initialCount: _qty,
                      currentCount: _qty,
                    });
                    showToast('فاکتور خرید خودکار ساخته شد', 'success');
                  }
                } catch (e) {
                  console.error('[flk→tra shadow invoice]', e);
                }
              }
            }
          }

          if (t === 'layer' || t === 'breeder' || t === 'broiler') {
            setTimeout(() => { setInstant(); setTab(t); }, 120);
          }
        }}
      />
    

      <GroupsPage open={groupsOpen} onClose={() => setGroupsOpen(false)} />
      <WithdrawalModal open={withdrawalOpen} onClose={() => setWithdrawalOpen(false)} />
      </div>
  );
}
