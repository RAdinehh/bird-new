import { useState, useMemo, useEffect } from 'react';
import ItemCard from './components/ItemCard';
import ItemsFormModal from './components/ItemsFormModal';
import { useFab } from '../../shr/hooks/useFab';
import {
  useWhs, CATEGORY_DEFAULTS,
  UNIT_LABEL, type Item, type ItemCategory, type ItemUnit
} from './store';
import { useCtc } from '../ctc/store';
import { useHal } from '../hal/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { toFa, toEn } from '../../shr/utils/fa';
import { format as formatJ } from 'date-fns-jalali';
const todayJalali = () => formatJ(new Date(), 'yyyy/MM/dd');
import { showAlert, showConfirmAsync, showPromptAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import HelpBanner from '../../shr/components/HelpBanner';
import { useNavigate } from 'react-router-dom';
import { useFilterSort, FilterBar, getWhsItemsConfig } from '../../shr/filter';
import {
  IconEgg, IconWheat, IconPill, IconSyringe, IconLeaf, IconTool, IconBox,
} from '../../shr/icons';

// map دسته به SVG
const CATEGORY_SVG: Record<string, (props: { size?: number }) => React.ReactElement> = {
  egg: IconEgg,
  feed: IconWheat,
  medicine: IconPill,
  vaccine: IconSyringe,
  herbal: IconLeaf,
  equipment: IconTool,
  consumable: IconBox,
};
import { useValidation } from '../../shr/validation/useValidation';
import { createItemSchema } from '../../shr/validation/rules/whs';

interface F {
  id?: string;
  name: string;
  category: ItemCategory;
  unit: ItemUnit;
  minStock: string;
  initialStock: string;
  supplierId: string;
  expireDate: string;
  withdrawalDays: string;
  batchNo: string;
  storage: string;
  notes: string;
  // ─── تجهیزات ───
  purchaseDate: string;
  purchasePrice: string;
  hallId: string;
  equipmentStatus: string;
  warrantyUntil: string;
  initialPrice: string;
  // ─── دارو/واکسن ───
  usageType: string;
  productionDate: string;
  dosePerBird: string;
}

const empty = (): F => ({
  name: '', category: 'feed', unit: 'kg',
  minStock: '', initialStock: '',
  supplierId: '', expireDate: '',
  withdrawalDays: '', batchNo: '', storage: 'room',
  notes: '',
  purchaseDate: '', purchasePrice: '', hallId: '', equipmentStatus: 'active', warrantyUntil: '', initialPrice: '',
  usageType: '', productionDate: '', dosePerBird: ''
});

const EQUIP_STATUS: Record<string, string> = { active: 'فعال', repair: 'در تعمیر', scrapped: 'اسقاط' };
const USAGE_LABEL: Record<string, string> = { oral: '🍽 خوراکی', injectable: '💉 تزریقی', water: '💧 محلول در آب', spray: '🌫 اسپری' };

export default function ItemsPage({ active = true }: { active?: boolean } = {}) {
  const navigate = useNavigate();
  const { items, movements, addItem, updateItem, deleteItem } = useWhs();
  const { contacts } = useCtc();
  const { halls } = useHal();
  const suppliers = contacts.filter(c => c.roles.includes('supplier'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── تعریف مشترک فیلترها و مرتب‌سازی ───
  // ─── فیلتر / جستجو / مرتب‌سازی (از config مرکزی) ───
  const config = useMemo(
    () => getWhsItemsConfig({ suppliers }),
    [suppliers]
  );

  const { filtered: list, filters, setFilter, clearFilter,
          sort, setSort, toggleSort, resetAll, hasActiveFilters,
          total, count } = useFilterSort<Item>({
    items,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' کالا حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = items.find(x => x.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteItem(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'کالا')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const undoDelete = () => {
    if (!undoData) return;
    const raw = (undoData as any).item;
    const arr: any[] = Array.isArray(raw) ? raw : [raw];
    try {
      for (const it of arr) {
        try { addItem(it); } catch {}
      }
      toastMsg.restoredBulk(arr.length, 'مورد')
    } catch { toastMsg.error('بازگردانی ناموفق') }
    setUndoData(null);
  };

  const openNew = () => {
    const lastR = items.filter(x => x.category).slice().reverse()[0];
    setForm({ ...empty(), ...(lastR?.category ? { category: lastR.category } : {}) }); setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن کالا', onClick: openNew } : null);

  /** اصلاح موجودی — از prompt می‌گیره، adjust می‌سازه */
  const adjustStock = async (it: Item) => {
    const current = it.currentStock || 0;
    const input = await showPromptAsync(
      '🔄 اصلاح موجودی',
      `موجودی فعلی: ${toFa(current)} ${UNIT_LABEL[it.unit]}\n\nموجودی واقعی چقدر است؟`,
      {
        placeholder: 'مثلاً — ۱۵۰',
        confirmText: 'ثبت اصلاح',
        defaultValue: String(current),
      }
    );
    if (input === null || input === undefined) return;
    const val = parseFloat(toEn(String(input)).replace('٫', '.')) || 0;
    if (val === current) { toastMsg.info('موجودی تغییری نکرد'); return; }
    const ok = await showConfirmAsync(
      'تأیید اصلاح',
      `موجودی از ${toFa(current)} به ${toFa(val)} ${UNIT_LABEL[it.unit]} تغییر کند؟\n(در تاریخچه ثبت می‌شود)`,
      { danger: false }
    );
    if (!ok) return;
    try {
      const { addMovement } = useWhs.getState();
      const newId = addMovement({
        itemId: it.id,
        type: 'adjust',
        quantity: val,
        unitPrice: 0,
        reason: 'adjustment',
        date: todayJalali(),
        partyId: '',
        notes: 'اصلاح موجودی از کارت قلم',
      });
      if (newId) toastMsg.saved('اصلاح موجودی');
    } catch (e: any) {
      showAlert(e.message || 'خطا در اصلاح موجودی');
    }
  };

  const openEdit = (it: Item) => {
    setForm({
      id: it.id, name: it.name, category: it.category, unit: it.unit,
      minStock: it.minStock ? toFa(it.minStock) : '',
      initialStock: '',
      supplierId: it.supplierId || '',
      expireDate: it.expireDate || '',
      withdrawalDays: it.withdrawalDays === null || it.withdrawalDays === undefined ? '' : toFa(it.withdrawalDays),
      batchNo: it.batchNo || '',
      storage: it.storage || 'room',
      notes: it.notes || '',
      purchaseDate: it.purchaseDate || '',
      purchasePrice: it.purchasePrice ? toFa(it.purchasePrice) : '',
      hallId: it.hallId || '',
      equipmentStatus: it.equipmentStatus || 'active',
      warrantyUntil: it.warrantyUntil || '',
      initialPrice: '',
      usageType: it.usageType || '',
      productionDate: it.productionDate || '',
      dosePerBird: it.dosePerBird ? toFa(it.dosePerBird) : ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;
  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;

  // ═══ اعتبارسنجی زنده ═══
  const { errors: vErrors } = useValidation(
    createItemSchema(),
    {
      name: form.name || '',
      category: form.category,
      unit: form.unit,
      minStock: num(form.minStock),
      currentStock: form.id ? 0 : num(form.initialStock),
      lastPrice: 0,
      supplierId: form.supplierId || '',
      expireDate: form.expireDate || '',
      withdrawalDays: form.withdrawalDays ? int(form.withdrawalDays) : null,
      batchNo: form.batchNo || '',
      storage: form.storage || 'room',
      notes: form.notes || '',
    },
  );

  const save = () => {
    // 🔒 جلوگیری قاطع از نام تکراری کالا
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = items.find((x) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `کالاای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (form.name.trim() === '') { setErr('نام قلم اجباری است'); return; }
    const isMed = form.category === 'medicine' || form.category === 'vaccine';
    const hasExpiry = ['medicine', 'vaccine', 'herbal', 'egg'].includes(form.category);

    if (form.id === undefined) {
      // ایجاد جدید: موجودی اولیه از فرم + قیمت صفر
      addItem({
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        minStock: num(form.minStock),
        currentStock: num(form.initialStock),   // ← موجودی اولیه
        lastPrice: 0,                            // ← صفر (بعد از خرید پر میشه)
        supplierId: form.supplierId,
        expireDate: hasExpiry ? form.expireDate : '',
        withdrawalDays: isMed && form.withdrawalDays.trim() !== '' ? int(form.withdrawalDays) : null,
        batchNo: isMed ? form.batchNo.trim() : '',
        storage: form.storage,
        notes: form.notes.trim(),
        purchaseDate: form.category === 'equipment' ? form.purchaseDate : '',
        purchasePrice: form.category === 'equipment' ? num(form.purchasePrice) : 0,
        hallId: form.category === 'equipment' ? form.hallId : '',
        equipmentStatus: form.category === 'equipment' ? form.equipmentStatus : '',
        warrantyUntil: form.category === 'equipment' ? form.warrantyUntil : '',
        initialPrice: num(form.initialPrice),
        usageType: isMed ? form.usageType : '',
        productionDate: isMed ? form.productionDate : '',
        dosePerBird: isMed && form.dosePerBird.trim() !== '' ? num(form.dosePerBird) : 0
      });
    } else {
      // ویرایش: currentStock و lastPrice نباید تغییر کنن
      updateItem(form.id, {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        minStock: num(form.minStock),
        supplierId: form.supplierId,
        expireDate: hasExpiry ? form.expireDate : '',
        withdrawalDays: isMed && form.withdrawalDays.trim() !== '' ? int(form.withdrawalDays) : null,
        batchNo: isMed ? form.batchNo.trim() : '',
        storage: form.storage,
        notes: form.notes.trim(),
        purchaseDate: form.category === 'equipment' ? form.purchaseDate : '',
        purchasePrice: form.category === 'equipment' ? num(form.purchasePrice) : 0,
        hallId: form.category === 'equipment' ? form.hallId : '',
        equipmentStatus: form.category === 'equipment' ? form.equipmentStatus : '',
        warrantyUntil: form.category === 'equipment' ? form.warrantyUntil : '',
        usageType: isMed ? form.usageType : '',
        productionDate: isMed ? form.productionDate : '',
        dosePerBird: isMed && form.dosePerBird.trim() !== '' ? num(form.dosePerBird) : 0
      });
    }
    setOpen(false);
  };

  // آبشاری: فیلدهای اضافی مستقیماً از CATEGORY_DEFAULTS (منبع واحد حقیقت)
  const currentStockForEdit = form.id ? (items.find(x => x.id === form.id)?.currentStock || 0) : 0;
  const extras = CATEGORY_DEFAULTS[form.category];
  const hasExtras = !!(extras && (extras.needsExpiry || extras.needsBatch || extras.needsWithdrawal || extras.needsStorage));
  const isMedicine = form.category === 'medicine' || form.category === 'vaccine';

  return (
    <PageContainer>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <HelpBanner
          id="items-intro"
          icon="📦"
          title="اینجا فقط کالاها تعریف می‌شوند"
          description="موجودی و قیمت از اینجا مدیریت می‌شود. برای ثبت خرید از فروشنده به بخش «معاملات → خرید» بروید. برای ضایعات یا اصلاح دستی به «انبار → ورود/خروج» بروید."
          tone="info"
        actionLabel="برو به خرید ←"
        onAction={() => navigate('/tra/purchases')}
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
          <button type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        items.length === 0 ? (
          <Empty
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
            title="انبار خالی است"
            desc="اولین قلم انبار خود را اضافه کنید — دان، دارو، واکسن، تجهیزات."
            action={<Btn variant="primary" onClick={openNew}>+ افزودن قلم</Btn>}
          />
        ) : (
          <Empty
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
            title="نتیجه‌ای پیدا نشد"
            desc="هیچ کالایی با فیلترهای فعلی هم‌خوانی ندارد. فیلترها را تغییر دهید یا پاک کنید."
            action={<Btn variant="primary" onClick={openNew}>+ افزودن قلم</Btn>}
          />
        )
      ) : (
        <>
          {list.map((it, i) => {
            const sup = contacts.find(c => c.id === it.supplierId);
            const hall = it.hallId ? halls.find(h => h.id === it.hallId) : null;
            const myMovements = movements.filter(m => m.itemId === it.id);
            const isOpen = !ms.selectionMode && expandedId === it.id;
            return (
              <ItemCard
                key={it.id}
                it={it}
                i={i}
                hall={hall}
                sup={sup}
                myMovements={myMovements}
                isOpen={isOpen}
                ms={ms}
                onToggle={() => setExpandedId(isOpen ? null : it.id)}
                onEdit={() => openEdit(it)}
                onAdjust={() => adjustStock(it)}
                onDelete={deleteItem}
                onUndo={(item: any) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000);
                }}
              />
            );
          })}
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <ItemsFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        vErrors={vErrors}
        err={err}
        suppliers={suppliers}
        halls={halls}
        currentStockForEdit={currentStockForEdit}
        save={save}
      />
    </PageContainer>
  );
}
