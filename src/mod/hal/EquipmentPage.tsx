/**
 * EquipmentPage — تجهیزات
 */
import { useState, useMemo } from 'react';
import { categoriesForKind, typesForCategory, calcEquipNeed, calcEquipValue } from './api/equipmentCalc';
import EquipmentFormModal from './components/EquipmentFormModal';
import EquipmentCard from './components/EquipmentCard';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { EquipmentSchema } from '../../shr/validation/rules/hal';
import { useHal, type Equipment } from './store';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { Btn, Empty, PageContainer, Select } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import HelpBanner from '../../shr/components/HelpBanner';
import { useFilterSort, FilterBar, getHalEquipmentConfig } from '../../shr/filter';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';
import EditableSelect from '../../shr/components/EditableSelect';
import { useCustomOptions } from '../../shr/store/customOptions';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import UndoBar from '../../cor/ui/UndoBar';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';
import { getEquipUnit } from './equipUnits';

/** دسته‌های مجاز برای هر نوع دارایی */
export default function EquipmentPage({ active = true }: { active?: boolean } = {}) {
  const { halls, equipment, addEquip, updateEquip, deleteEquip } = useHal();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const { contacts: allContacts } = useCtc();
  const suppliers = allContacts.filter((c: any) => (c.roles || []).includes('supplier'));
  const { options: allCustomOpts } = useCustomOptions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id:'', hallId:'', category:'ventilation', type:'', name:'', count:'', unit:'pcs', unitPrice:'', purchasedAt:'', warranty:'', notes:'', capacity:'', efficiency:'', consumeRate:'' });
  const draft = useFormDraft('hal-equip', form, (v: any) => setForm(v));
  const __selectedHall = halls.find(h => h.id === form.hallId);
  const hallVolume = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0) * (__selectedHall.height || 0)
    : null;
  const hallArea = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0)
    : 0;
  const equipNeed = calcEquipNeed(form.type, form.hallId, flocks || [], breedStd, hallArea);
  // 🆕 استاندارد نژاد سالن انتخاب‌شده
  const selectedBreedStd = __selectedHall?.breedId ? breedStd.byBreedId(__selectedHall.breedId) : null;
  const [err, setErr] = useState('');
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set());
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const markAuto = (field: string) => {
    setAutoFields(prev => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  const clearAuto = (field: string) => {
    if (autoFields.has(field)) {
      setAutoFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const openNew = () => {
    const firstCat = categoriesForKind('asset')[0] || 'ventilation';
    setForm({ id:'', hallId: halls[0].id, category: firstCat, type:'',
      name:'', count:'', unit:'pcs', unitPrice:'', purchasedAt:'',
      warranty:'', notes:'', capacity:'', efficiency:'', consumeRate:'', status:'active', brand:'', supplierId:'' });
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن تجهیز', onClick: openNew } : null);

  const openEdit = (e: Equipment) => {
    setAutoFields(new Set());
    setForm({
      id: e.id, hallId: e.hallId,
      // kind حذف شد — از type خودکار
      category: (e as any).category || 'lighting',
      unit: (e as any).unit || 'pcs',
      type: e.type, name: e.name,
      count: e.count ? toFa(e.count) : '',
      unitPrice: e.unitPrice ? toFa(e.unitPrice) : '',
      purchasedAt: e.purchasedAt,
      warranty: e.warranty ? toFa(e.warranty) : '',
      notes: e.notes,
      capacity: (e as any).capacity ? toFa((e as any).capacity) : '',
      efficiency: (e as any).efficiency ? toFa((e as any).efficiency) : '',
      consumeRate: (e as any).consumeRate || '',
      status: (e as any).status || 'active',
      brand: (e as any).brand || '',
      supplierId: (e as any).supplierId || '',
    });
    setErr(''); setOpen(true);
  };

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
      count: form.count ? parseInt(toEn(form.count)) || 0 : 0,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || 0 : 0,
      purchasedAt: form.purchasedAt || '',
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || 0 : 0,
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || 0 : 0,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || 0 : 0,
      consumeRate: form.consumeRate || undefined,
      sourceInvoiceId: '',
      warehouseItemId: '',
      notes: form.notes || '',
    },
  );

  // فیلتر/مرتب
  const config = useMemo(() => getHalEquipmentConfig({ halls }), [halls]);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Equipment>({
    items: equipment,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (e: any) => e.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' تجهیز حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = equipment.find(x => x.id === id);
        if (!item) continue;
        backups.push(item);
        try { deleteEquip(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'تجهیز')
      logAction('delete', 'hal', 'حذف گروهی تجهیزات: ' + backups.length);
    },
    onArchive: async (ids) => {
      toastMsg.archivedBulk(ids.length, 'تجهیز')
    },
  });
  const totalValue = list.reduce((acc, e) => acc + calcEquipValue(e), 0);

  if (halls.length === 0) {
  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addEquip(item.item);
      toastMsg.restored('تجهیز')
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق')
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

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری تجهیزات
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = equipment.find((x: any) => x.hallId === form.hallId && x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `تجهیزاتای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    const data = {
      hallId: form.hallId,
      // kind حذف
      category: form.category || 'auxiliary',
      type: form.type,
      name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim(),
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
      consumeRate: form.consumeRate || undefined,
      status: form.status || 'active',
      brand: (form.brand || '').trim(),
      supplierId: (form.supplierId || '').trim() || undefined,
    };
    if (form.id) updateEquip(form.id, data); else addEquip(data);
    draft.clear();
    setOpen(false);
  };

  const saveAndNext = () => {
    // بدون چک تکراری
    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    const data = {
      hallId: form.hallId,
      // kind حذف
      category: form.category || 'auxiliary',
      type: form.type,
      name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim(),
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
      consumeRate: form.consumeRate || undefined,
      status: form.status || 'active',
      brand: (form.brand || '').trim(),
      supplierId: (form.supplierId || '').trim() || undefined,
    };
    addEquip(data);
    toastMsg.added(form.name || 'تجهیز')
    // پاک کردن فقط نام و مشخصات، نگه‌داشتن سالن و نوع
    setForm((f: any) => ({
      ...f,
      id: '', name: '', count: '', unitPrice: '', purchasedAt: '',
      warranty: '', notes: '', capacity: '', efficiency: '',
    }));
    setErr('');
  };
  return (
    <PageContainer>
      <HelpBanner
        id="hal-equip-intro"
        icon="⚙️"
        title="مدیریت تجهیزات"
        description="تجهیزات هر سالن (فن، لامپ، آبخوری، دانخوری، بستر و...) را اینجا ثبت کنید. با انتخاب نوع دارایی و دسته، زیرنوع‌های مربوطه نمایش داده می‌شوند."
        tone="info"
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

      {list.length > 0 && (
        <div style={{
          padding: 'var(--pad-comfy)', background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-base)', color: 'var(--accent)', fontWeight: 600,
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>ارزش کل تجهیزات:</span>
          <span>{toFa(totalValue.toLocaleString('fa-IR'))} تومان</span>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
          title="تجهیزی ثبت نشده"
          desc="لامپ، فن، هیتر، آبخوری، دانخوری، دوربین و سنسور را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن تجهیز</Btn>}
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
                onEdit={() => openEdit(e)}
                onDelete={deleteEquip}
                onUndo={(item) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000);
                }}
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
        vErrors={vErrors}
        halls={halls}
        equipment={equipment}
        autoFields={autoFields}
        clearAuto={clearAuto}
        markAuto={markAuto}
        categoriesForKind={categoriesForKind}
        typesForCategory={typesForCategory}
        equipNeed={equipNeed}
        stdForDefaults={selectedBreedStd}
        save={save}
      />
    </PageContainer>
  );
}
