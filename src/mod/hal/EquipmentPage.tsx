import { getGlobalFormat } from "../../shr/units/useFormat";
/**
 * EquipmentPage — تجهیزات
 */
import { useState, useMemo } from 'react';
import type { Person } from '../ctc/store';
import type { Invoice } from '../tra/store';
import type { Item } from '../whs/store';
import { categoriesForKind, typesForCategory, calcEquipNeed, calcEquipValue } from './api/equipmentCalc';
import EquipmentFormModal from './components/EquipmentFormModal';
import { useEquipmentForm } from './useEquipmentForm';
import EquipmentCard from './components/EquipmentCard';
import TransferEquipModal from './components/TransferEquipModal';
import RetireEquipModal from './components/RetireEquipModal';
import EquipmentKpiCards from './components/EquipmentKpiCards';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { EquipmentSchema } from '../../shr/validation/rules/hal';
import { useHal, type Equipment, type TransferLog, type SaleInfo } from './store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';
import { useFilterSort, FilterBar, getHalEquipmentConfig } from '../../shr/filter';
import { toFa, toEn } from '../../shr/utils/fa';
import { useCustomOptions } from '../../shr/store/customOptions';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useWhs } from '../whs/store';
import UndoBar from '../../cor/ui/UndoBar';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

/** دسته‌های مجاز برای هر نوع دارایی */
export default function EquipmentPage({ active = true }: { active?: boolean } = {}) {
  const { halls, zones, equipment, addEquip, updateEquip, deleteEquip } = useHal();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const { contacts: allContacts } = useCtc();
  const supplierNames = useMemo(() => new Map(allContacts.map((c: Person) => [c.id, c.name || ''])), [allContacts]);
  const { invoices } = useTra();
  const { items: whsItems } = useWhs();
  const invoiceNumbers = useMemo(() => new Map(invoices.map((i: Invoice) => [i.id, i.number || '—'])), [invoices]);
  const whsItemNames = useMemo(() => new Map(whsItems.map((i: Item) => [i.id, i.name || ''])), [whsItems]);
  const suppliers = allContacts.filter((c: Person) => (c.roles || []).includes('supplier'));
  const { options: allCustomOpts } = useCustomOptions();
  const {
    open, setOpen, form, setForm, draft, err, setErr,
    autoFields, markAuto, clearAuto,
    buildPayload, openNew, openEdit, save: saveForm,
  } = useEquipmentForm();
  const __selectedHall = halls.find(h => h.id === form.hallId);
  const hallVolume = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0) * (__selectedHall.height || 0)
    : null;
  const hallArea = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0)
    : 0;
  const activeHallFlocks = useMemo(
    () => (flocks || []).filter((f) => f.hallId === form.hallId && f.status === 'active' && !f.paused),
    [flocks, form.hallId]
  );
  const activeBirdCount = useMemo(
    () => activeHallFlocks.reduce((sum, f) => sum + (f.currentCount || 0), 0),
    [activeHallFlocks]
  );
  const activeFlockBreedId = activeHallFlocks.find((f) => !!f.breedId)?.breedId || __selectedHall?.breedId;
  const selectedBreedStd = activeFlockBreedId ? breedStd.byBreedId(activeFlockBreedId) : null;
  const equipNeed = calcEquipNeed(form.type, form.hallId, flocks || [], breedStd, hallArea, __selectedHall?.capacity || 0);
  const [transferEq, setTransferEq] = useState<Equipment | null>(null);
  const [retireEq, setRetireEq] = useState<Equipment | null>(null);
  const [undoData, setUndoData] = useState<{ item: Equipment | Equipment[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [saveAttempted, setSaveAttempted] = useState(false);
  const [dupError, setDupError] = useState<string | null>(null);
  const handleOpenNew = () => { setSaveAttempted(false); setDupError(null); openNew(); };
  const handleOpenEdit = (e: Equipment) => { setSaveAttempted(false); setDupError(null); openEdit(e); };
  const handleSave = () => {
    setSaveAttempted(true);
    if (Object.keys(vErrors).length > 0) return;   // inline errors shown
    if (!form.id) {
      const _dup = equipment.find((x: Equipment) => x.hallId === form.hallId && x.name.trim() === form.name.trim());
      if (_dup) { setDupError(`تجهیزی با نام «${_dup.name}» توی این سالن هست`); return; }
    }
    saveForm(equipment, addEquip, updateEquip);
  };

  useFab(active && halls.length > 0 && equipment.length > 0 ? { label: 'افزودن تجهیز', onClick: handleOpenNew } : null);


  // ═══ اعتبارسنجی زنده ═══
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;
  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;

  const { errors: vErrors } = useValidation(
    EquipmentSchema,
    {
      hallId: form.hallId || '',
      // kind حذف
      category: form.category || 'auxiliary',
      type: form.type || '',
      name: form.name || '',
      count: form.count ? parseInt(toEn(form.count)) || undefined : undefined,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || undefined : undefined,
      purchasedAt: form.purchasedAt || '',
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || undefined : undefined,
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || undefined : undefined,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || undefined : undefined,
      consumeRate: form.consumeRate || undefined,
      sourceInvoiceId: '',
      warehouseItemId: '',
      notes: form.notes || '',
    },
  );

  // فیلتر/مرتب
  // 🆕 برندهای یونیک از تجهیزات
  const brands = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach((e: Equipment) => { if (e.brand) set.add(e.brand); });
    return Array.from(set).sort();
  }, [equipment]);

  // 🆕 تأمین‌کننده‌ها از مخاطبین
  const supplierList = useMemo(() => {
    return (allContacts || [])
      .filter((c: Person) => (c.roles || []).includes('supplier'))
      .map((c: Person) => ({ id: c.id, name: c.name }));
  }, [allContacts]);

  const config = useMemo(
    () => getHalEquipmentConfig({ halls, suppliers: supplierList, brands }),
    [halls, supplierList, brands],
  );
  const { filtered: _listRaw, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Equipment>({
    items: equipment,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── فیلتر آرشیو هوشمند ───
  //   - اگه کاربر «آرشیو» رو فیلتر کرد → فقط آرشیوها
  //   - در غیر این صورت → آرشیوها مخفی
  const list = useMemo(() => {
    const sf = filters.status as string | string[] | undefined;
    // کاربر می‌خواد اسقاط‌شده‌ها یا آرشیو رو ببینه؟
    const wantsHidden = Array.isArray(sf)
      ? sf.some(s => s === 'archived' || s === 'retired')
      : (sf === 'archived' || sf === 'retired');
    if (wantsHidden) return _listRaw;
    // پیش‌فرض: اسقاط و آرشیو مخفی (استاندارد SAP/Odoo)
    return _listRaw.filter(e => e.status !== 'archived' && e.status !== 'retired');
  }, [_listRaw, filters.status]);

  // ─── KPI Cards ───
  const kpiData = useMemo(() => {
    const cats = new Set<string>();
    let value = 0;
    let repair = 0;
    for (const e of equipment) {
      if (e.category) cats.add(e.category);
      value += calcEquipValue(e);
      if (e.status === 'maintenance' || e.status === 'broken') repair++;
    }
    return { total: equipment.length, categories: cats.size, totalValue: value, needRepair: repair };
  }, [equipment]);

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (e: Equipment) => e.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', `${getGlobalFormat().count(ids.length)} تجهیز حذف شوند؟`, { danger: true });
      if (!ok) return;
      const backups: Equipment[] = [];
      for (const id of ids) {
        const item = equipment.find(x => x.id === id);
        if (!item) continue;
        backups.push(item);
        try { deleteEquip(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'تجهیز')
      logAction('delete', 'hal', 'حذف گروهی تجهیزات: ' + backups.length);
    },
    onArchive: async (ids) => {
      for (const id of ids) {
        try { updateEquip(id, { status: 'archived' }); } catch {}
      }
      toastMsg.archivedBulk(ids.length, 'تجهیز');
      logAction('update', 'hal', 'آرشیو گروهی تجهیزات: ' + ids.length);
    },
  });
  const totalValue = list.reduce((acc, e) => acc + calcEquipValue(e), 0);

  if (halls.length === 0) {
  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      const items = Array.isArray(item.item) ? item.item : [item.item];
      items.forEach(e => {
        const { id, createdAt, updatedAt, ...rest } = e;
        addEquip(rest);
      });
      toastMsg.restored(items.length > 1 ? 'تجهیزات' : 'تجهیز');
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };
    return (
      <PageContainer>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>}
          title="اول یک سالن بسازید"
          desc="تجهیزات داخل سالن قرار می‌گیرند. اول از تب «سالن‌ها» استفاده کنید."
        />
      </PageContainer>
    );
  }


  return (
    <PageContainer>
      <HelpBanner
        id="hal-equip-intro"
        icon="⚙️"
        title="مدیریت تجهیزات"
        description="تجهیزات هر سالن (فن، لامپ، آبخوری، دانخوری، بستر و...) را اینجا ثبت کنید. با انتخاب نوع دارایی و دسته، زیرنوع‌های مربوطه نمایش داده می‌شوند."
        tone="info"
      />

      <EquipmentKpiCards
        total={kpiData.total}
        categories={kpiData.categories}
        totalValue={kpiData.totalValue}
        needRepair={kpiData.needRepair}
      />

      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{
              padding: '4px 10px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--muted)',
              fontFamily: 'inherit',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
          title="تجهیزی ثبت نشده"
          desc="لامپ، فن، هیتر، آبخوری، دانخوری، دوربین و سنسور را اضافه کنید."
          action={<Btn variant="primary" onClick={handleOpenNew}>+ افزودن تجهیز</Btn>}
        />
      ) : (
        <>
          {list.map((e, i) => {
            const hall = halls.find(h => h.id === e.hallId);
            const isOpen = expandedId === e.id;
            return (
              <EquipmentCard
                key={e.id}
                e={e}
                i={i}
                hall={hall}
                allCustomOpts={allCustomOpts}
                isOpen={isOpen}
                ms={ms}
                onToggle={() => setExpandedId(isOpen ? null : e.id)}
                onEdit={() => handleOpenEdit(e)}
                onDelete={deleteEquip}
                onRetire={(eq) => setRetireEq(eq)}
                onTransfer={(eq) => setTransferEq(eq)}
                onRestore={(id) => updateEquip(id, { status: 'active', saleInfo: undefined })}
                onUndo={(item) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur) => cur && !Array.isArray(cur.item) && cur.item.id === item.id ? null : cur), 6000);
                }}
                supplierNames={supplierNames}
                invoiceNumbers={invoiceNumbers}
                whsItemNames={whsItemNames}
              />
            );
          })}

        </>
      )}

      {/* نوار شناور Multi-Select */}
      <MultiSelectBar ms={ms} deleteLabel="حذف" archiveLabel="آرشیو" />

      {/* فاصله‌ی پایین برای نوار شناور */}
      {ms.selectionMode && <div style={{ height: 90 }} />}

      <EquipmentFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        onErrorClear={() => { setErr(''); setDupError(null); }}
        vErrors={{ ...(saveAttempted ? vErrors : {}), ...(dupError ? { name: dupError } : {}) }}
        halls={halls}
        zones={zones}
        equipment={equipment}
        autoFields={autoFields}
        clearAuto={clearAuto}
        markAuto={markAuto}
        categoriesForKind={categoriesForKind}
        typesForCategory={typesForCategory}
        equipNeed={equipNeed}
        stdForDefaults={selectedBreedStd}
        activeBirdCount={activeBirdCount}
        activeFlockCount={activeHallFlocks.length}
        save={handleSave}
      />
          <RetireEquipModal
        open={!!retireEq}
        onClose={() => setRetireEq(null)}
        equipment={retireEq}
        onConfirm={(eq, info, opts) => {
          const totalCount = Math.max(1, eq.count || 1);
          const qty = Math.min(totalCount, Math.max(1, opts.qty || totalCount));
          let saleInvoiceId: string | undefined;

          if (info.reason === 'sale' && opts.createInvoice && info.partyId) {
            try {
              const unitSalePrice = Math.round(info.salePrice / qty);
              saleInvoiceId = useTra.getState().addInvoice({
                type: 'sale',
                date: info.soldAt,
                partyId: info.partyId,
                category: 'equipment',
                items: [{
                  id: crypto.randomUUID(),
                  category: 'equipment',
                  description: `فروش تجهیز: ${eq.name}`,
                  quantity: qty,
                  unit: eq.unit || 'pcs',
                  unitPrice: unitSalePrice,
                  total: info.salePrice,
                  brand: eq.brand,
                  model: eq.model,
                }],
                total: info.salePrice,
                payments: [],
                dueDate: info.soldAt,
                relatedFlockId: '',
                relatedEntryId: '',
                sourceType: 'manual',
                notes: info.note ? `فروش تجهیز (${eq.name}) — ${info.note}` : `فروش تجهیز (${eq.name})`,
              });
            } catch (err) {
              console.error('[HAL→TRA] create sale invoice failed:', err);
            }
          }

          const finalInfo = saleInvoiceId ? { ...info, saleInvoiceId } : info;

          if (qty < totalCount) {
            const remainCount = totalCount - qty;
            updateEquip(eq.id, { count: remainCount });
            if (eq.warehouseItemId) {
              try { useWhs.getState().updateItem(eq.warehouseItemId, { currentStock: remainCount }); } catch {}
            }
            const { id: _id, createdAt: _c, updatedAt: _u, warehouseItemId: _w, ...rest } = eq;
            addEquip({
              ...rest,
              count: qty,
              status: 'retired',
              saleInfo: finalInfo,
            });
          } else {
            updateEquip(eq.id, { status: 'retired', saleInfo: finalInfo });
            if (eq.warehouseItemId) {
              try { useWhs.getState().updateItem(eq.warehouseItemId, { currentStock: 0 }); } catch {}
            }
          }

          logAction('update', 'hal', `${info.reason === 'sale' ? 'فروش' : 'اسقاط'} (${qty} عدد): ${eq.name} — ${info.reason === 'sale' ? getGlobalFormat().money(info.salePrice) : 'بدون مبلغ'}`);
          toastMsg.success(
            info.reason === 'sale'
              ? (saleInvoiceId ? 'فروش و فاکتور معاملات ثبت شد' : 'فروش ثبت شد')
              : 'تجهیز اسقاط شد'
          );
          setRetireEq(null);
        }}
      />

      <TransferEquipModal
        open={!!transferEq}
        onClose={() => setTransferEq(null)}
        equipment={transferEq}
        halls={halls}
        zones={zones}
        onConfirm={(eq, toHallId, toZoneId, qty, date, note) => {
          const totalCount = Math.max(1, eq.count || 1);
          const moveQty = Math.min(totalCount, Math.max(1, qty || totalCount));
          const fromHall = halls.find(h => h.id === eq.hallId);
          const toHall = halls.find(h => h.id === toHallId);
          const fromZone = zones.find(z => z.id === eq.zoneId);
          const toZone = zones.find(z => z.id === toZoneId);

          const log: TransferLog = {
            id: crypto.randomUUID(),
            fromHallId: eq.hallId || '',
            fromHallName: fromHall?.name || '—',
            fromZoneId: eq.zoneId || undefined,
            fromZoneName: fromZone?.name || undefined,
            toHallId,
            toHallName: toHall?.name || '—',
            toZoneId: toZoneId || undefined,
            toZoneName: toZone?.name || undefined,
            count: moveQty,
            date,
            note,
            createdAt: new Date().toISOString(),
          };

          const targetDup = equipment.find(x =>
            x.id !== eq.id &&
            (x.status || 'active') === (eq.status || 'active') &&
            x.hallId === toHallId &&
            (x.zoneId || '') === (toZoneId || '') &&
            x.name.trim() === eq.name.trim() &&
            (x.type || '') === (eq.type || '') &&
            (x.brand || '') === (eq.brand || '') &&
            (x.unitPrice || 0) === (eq.unitPrice || 0)
          );

          if (moveQty < totalCount) {
            const remainCount = totalCount - moveQty;
            updateEquip(eq.id, {
              count: remainCount,
              transferHistory: [...(eq.transferHistory || []), log],
            });
            if (eq.warehouseItemId) {
              try { useWhs.getState().updateItem(eq.warehouseItemId, { currentStock: remainCount }); } catch {}
            }
            if (targetDup) {
              const newTargetCount = (targetDup.count || 0) + moveQty;
              updateEquip(targetDup.id, {
                count: newTargetCount,
                transferHistory: [...(targetDup.transferHistory || []), log],
              });
              if (targetDup.warehouseItemId) {
                try { useWhs.getState().updateItem(targetDup.warehouseItemId, { currentStock: newTargetCount }); } catch {}
              }
            } else {
              const { id: _id, createdAt: _c, updatedAt: _u, warehouseItemId: _w, ...rest } = eq;
              addEquip({
                ...rest,
                hallId: toHallId,
                zoneId: toZoneId || undefined,
                count: moveQty,
                transferHistory: [...(eq.transferHistory || []), log],
              });
            }
          } else if (targetDup) {
            const newTargetCount = (targetDup.count || 0) + moveQty;
            updateEquip(targetDup.id, {
              count: newTargetCount,
              transferHistory: [...(targetDup.transferHistory || []), log],
            });
            if (targetDup.warehouseItemId) {
              try { useWhs.getState().updateItem(targetDup.warehouseItemId, { currentStock: newTargetCount }); } catch {}
            }
            deleteEquip(eq.id);
          } else {
            updateEquip(eq.id, {
              hallId: toHallId,
              zoneId: toZoneId || undefined,
              transferHistory: [...(eq.transferHistory || []), log],
            });
          }

          const destLabel = toZone ? `${toHall?.name} (${toZone.name})` : (toHall?.name || '—');
          logAction('update', 'hal', `جابجایی (${moveQty} عدد): ${eq.name} → ${destLabel}`);
          toastMsg.success('جابجایی ثبت شد');
        }}
      />
    </PageContainer>
  );
}
