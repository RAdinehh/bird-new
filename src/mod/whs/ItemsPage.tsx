import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import {
  useWhs, CATEGORY_LABEL, CATEGORY_ICON, CATEGORY_DEFAULTS,
  UNIT_LABEL, STORAGE_LABEL, stockWarning, expiryWarning,
  daysToExpiry, type Item, type ItemCategory, type ItemUnit
} from './store';
import { useCtc } from '../ctc/store';
import { useHal } from '../hal/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import HelpBanner from '../../shr/components/HelpBanner';
import { useNavigate } from 'react-router-dom';
import { Row, SectionTitle } from './helpers';
import { logAction } from '../../cor/logger/auditLog';
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
}

const empty = (): F => ({
  name: '', category: 'feed', unit: 'kg',
  minStock: '', initialStock: '',
  supplierId: '', expireDate: '',
  withdrawalDays: '', batchNo: '', storage: 'room',
  notes: '',
  purchaseDate: '', purchasePrice: '', hallId: '', equipmentStatus: 'active', warrantyUntil: ''
});

const EQUIP_STATUS: Record<string, string> = { active: 'فعال', repair: 'در تعمیر', scrapped: 'اسقاط' };

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

  const list = items;

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
      warrantyUntil: it.warrantyUntil || ''
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
      const _dup = items.find((x: any) => x.name.trim() === _trimmed);
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
        warrantyUntil: form.category === 'equipment' ? form.warrantyUntil : ''
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
        warrantyUntil: form.category === 'equipment' ? form.warrantyUntil : ''
      });
    }
    setOpen(false);
  };

  // آبشاری: فیلدهای اضافی مستقیماً از CATEGORY_DEFAULTS (منبع واحد حقیقت)
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
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
          title="انبار خالی است"
          desc="اولین قلم انبار خود را اضافه کنید — دان، دارو، واکسن، تجهیزات."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن قلم</Btn>}
        />
      ) : (
        <>
          {list.map((it, i) => {
            const stock = stockWarning(it);
            const exp = expiryWarning(it);
            const sup = contacts.find(c => c.id === it.supplierId);
            const hall = it.hallId ? halls.find(h => h.id === it.hallId) : null;
            const myMovements = movements.filter(m => m.itemId === it.id);
            const isOpen = !ms.selectionMode && expandedId === it.id;

            let accent: 'accent' | 'warn' | 'dim' = 'accent';
            if (stock === 'critical' || exp === 'expired') accent = 'warn';
            else if (stock === 'low' || exp === 'soon') accent = 'warn';
            else if (it.currentStock === 0) accent = 'dim';

            const days = daysToExpiry(it.expireDate);

            return (
              <ExpandableCard
                key={it.id}
                id={it.id}
                ms={ms}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji={CATEGORY_ICON[it.category]}
                title={it.name}
                subtitle={`${CATEGORY_LABEL[it.category]} · ${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : it.id)}
                badge={
                  stock === 'critical' ? <Tag tone="red">تمام شد</Tag> :
                  stock === 'low' ? <Tag tone="amber">کم</Tag> :
                  exp === 'expired' ? <Tag tone="red">منقضی</Tag> :
                  exp === 'soon' ? <Tag tone="amber">نزدیک انقضا</Tag> :
                  <Tag tone="green">موجود</Tag>
                }
                stats={
                  <>
                    <span>موجودی: <b style={{ color: 'var(--text)' }}>{toFa(it.currentStock)} {UNIT_LABEL[it.unit]}</b></span>
                    {it.minStock > 0 ? <span>حد: <b style={{ color: 'var(--text)' }}>{toFa(it.minStock)}</b></span> : null}
                    {it.lastPrice > 0 ? <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa((it.currentStock * it.lastPrice).toLocaleString('fa-IR'))} ت</b></span> : null}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> مشخصات قلم</SectionTitle>
                <Row l="دسته" v={CATEGORY_LABEL[it.category]} />
                <Row l="واحد" v={UNIT_LABEL[it.unit]} />
                <Row l="موجودی فعلی" v={`${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`} />
                {it.minStock > 0 ? <Row l="حداقل موجودی" v={`${toFa(it.minStock)} ${UNIT_LABEL[it.unit]}`} /> : null}
                {it.lastPrice > 0 ? <Row l="قیمت آخرین خرید" v={`${toFa(it.lastPrice.toLocaleString('fa-IR'))} ت`} /> : null}
                {sup ? <Row l="تأمین‌کننده" v={sup.name} /> : null}

                {it.currentStock > 0 && it.lastPrice > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                     background: 'var(--accent-soft)', color: 'var(--accent)',
                     borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                    <span>ارزش موجودی:</span>
                    <span>{toFa((it.currentStock * it.lastPrice).toLocaleString('fa-IR'))} ت</span>
                  </div>
                ) : null}

                {it.category === 'medicine' || it.category === 'vaccine' ? (
                  <>
                    <SectionTitle>💊 اطلاعات دارویی</SectionTitle>
                    {it.batchNo ? <Row l="شماره بچ" v={it.batchNo} /> : null}
                    {it.expireDate ? <Row l="تاریخ انقضا" v={toFa(it.expireDate)} /> : null}
                    {days !== null ? (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                        background: days < 0 ? 'var(--danger-soft)' : days <= 30 ? 'var(--warn-soft)' : 'var(--input-bg)',
                        color: days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'var(--muted)',
                        borderRadius: 'var(--r-sm)', fontWeight: 700
                      }}>
                        <span>وضعیت انقضا:</span>
                        <span>{days < 0 ? `${toFa(Math.abs(days))} روز گذشته` : `${toFa(days)} روز مانده`}</span>
                      </div>
                    ) : null}
                    {it.withdrawalDays !== null && it.withdrawalDays !== undefined ? <Row l="دوره منع مصرف" v={`${toFa(it.withdrawalDays)} روز`} /> : null}
                    {it.storage ? <Row l="نگهداری" v={STORAGE_LABEL[it.storage] || it.storage} /> : null}
                  </>
                ) : null}

                {it.category === 'equipment' ? (
                  <>
                    <SectionTitle>🔧 اطلاعات تجهیزات</SectionTitle>
                    {it.purchaseDate ? <Row l="تاریخ خرید" v={toFa(it.purchaseDate)} /> : null}
                    {it.purchasePrice ? <Row l="قیمت خرید" v={`${toFa(it.purchasePrice.toLocaleString('fa-IR'))} ت`} /> : null}
                    {hall ? <Row l="سالن" v={hall.name} /> : null}
                    {it.equipmentStatus ? <Row l="وضعیت" v={EQUIP_STATUS[it.equipmentStatus] || it.equipmentStatus} /> : null}
                    {it.warrantyUntil ? <Row l="گارانتی تا" v={toFa(it.warrantyUntil)} /> : null}
                  </>
                ) : null}

                {myMovements.length > 0 ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> آخرین گردش‌ها ({toFa(myMovements.length)})</SectionTitle>
                    {myMovements.slice(-3).reverse().map(m => (
                      <div key={m.id} style={{ fontSize: 'var(--fs-sm)',
                         padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                         borderRadius: 'var(--r-sm)', display: 'flex',
                         justifyContent: 'space-between' }}>
                        <span>{m.type === 'in' ? '📥' : '📤'} {toFa(m.quantity)} {UNIT_LABEL[it.unit]}</span>
                        <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(m.date)}</span>
                      </div>
                    ))}
                  </>
                ) : null}

                {it.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{it.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(it)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = it.id; const ok = await showConfirmAsync('تأیید حذف', 'این مورد حذف شود؟', { danger: true }); if (!ok) return; const item = items.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteItem(idToDel);
                    logAction('delete', 'whs', 'حذف از انبار');  toastMsg.deleted('')
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش قلم' : 'افزودن قلم'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="نام قلم" required error={vErrors.name}>
          <Input placeholder="مثلاً — ذرت، نیوکاسل، ویتامین..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Grid2>
          <Field label="دسته" required error={vErrors.category}>
            <Select value={form.category} onChange={e => {
              const newCat = e.target.value as ItemCategory;
              const def = CATEGORY_DEFAULTS[newCat];
              setForm(f => ({
                ...f,
                category: newCat,
                unit: def.unit,
                storage: def.storage,
                expireDate: def.needsExpiry ? f.expireDate : '',
                withdrawalDays: def.needsWithdrawal ? f.withdrawalDays : '',
              }));
            }}>
              {(Object.keys(CATEGORY_LABEL) as ItemCategory[]).map(c =>
                <option key={c} value={c}>{CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}</option>
              )}
            </Select>
          </Field>
          <Field label="واحد">
            <Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as ItemUnit })}>
              {(Object.keys(UNIT_LABEL) as ItemUnit[]).map(u =>
                <option key={u} value={u}>{UNIT_LABEL[u]}</option>
              )}
            </Select>
          </Field>
        </Grid2>

        <Grid2>
          {!form.id && (
            <Field label="موجودی اولیه" hint="فقط هنگام ایجاد">
              <NumField placeholder="مثلاً — ۱۰۰" value={form.initialStock} onChange={e => setForm({ ...form, initialStock: e.target.value })} unit={UNIT_LABEL[form.unit]} min={0} />
            </Field>
          )}
          <Field label="حداقل موجودی" hint="هشدار کمبود">
            <NumField placeholder="مثلاً — ۱۰۰" unit={form.unit || "عدد"} value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
          </Field>
          
        </Grid2>

        <Field label="تأمین‌کننده" hint="فقط فروشنده‌ها">
<SmartSelect
              value={form.supplierId}
              onChange={v => setForm(f => ({ ...f, supplierId: v }))}
              options={suppliers.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (s => s.phone || undefined)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب فروشنده"
              autoThreshold={6}
            />
        </Field>

        {hasExtras && (
          <>
            <SectionTitle>{extras.title}</SectionTitle>
            {(extras.needsBatch || extras.needsExpiry) && (
              <Grid2>
                {extras.needsBatch && (
                  <Field label="شماره بچ">
                    <Input placeholder="..." dir="ltr" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} />
                  </Field>
                )}
                {extras.needsExpiry && (
                  <Field label="تاریخ انقضا">
                    <DatePicker value={form.expireDate} onChange={v => setForm({ ...form, expireDate: v })}  autoToday />
                  </Field>
                )}
              </Grid2>
            )}
            {(extras.needsWithdrawal || extras.needsStorage) && (
              <Grid2>
                {extras.needsWithdrawal && (
                  <Field label="دوره منع مصرف">
                    <NumField placeholder="مثلاً — ۳" value={form.withdrawalDays} onChange={e => setForm({ ...form, withdrawalDays: e.target.value })} unit="روز" min={0} />
                  </Field>
                )}
                {extras.needsStorage && (
                  <Field label="نگهداری">
                    <Select value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}>
                      <option value="room">دمای اتاق</option>
                      <option value="fridge">یخچال (۲-۸°)</option>
                      <option value="freezer">فریزر</option>
                    </Select>
                  </Field>
                )}
              </Grid2>
            )}
          </>
        )}

        {form.category === 'equipment' && (
          <>
            <SectionTitle>🔧 اطلاعات تجهیزات</SectionTitle>
            <Grid2>
              <Field label="تاریخ خرید">
                <DatePicker value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} />
              </Field>
              <Field label="قیمت خرید (کل)">
                <MoneyField placeholder="مثلاً — ۵٬۰۰۰٬۰۰۰" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="سالن استقرار" hint="اختیاری">
                <Select value={form.hallId} onChange={e => setForm({ ...form, hallId: e.target.value })}>
                  <option value="">— بدون سالن —</option>
                  {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </Field>
              <Field label="وضعیت">
                <Select value={form.equipmentStatus} onChange={e => setForm({ ...form, equipmentStatus: e.target.value })}>
                  <option value="active">✅ فعال</option>
                  <option value="repair">🔧 در تعمیر</option>
                  <option value="scrapped">❌ اسقاط</option>
                </Select>
              </Field>
            </Grid2>
            <Field label="گارانتی تا" hint="اختیاری — برای هشدار تموم‌شدن">
              <DatePicker value={form.warrantyUntil} onChange={v => setForm({ ...form, warrantyUntil: v })} />
            </Field>
          </>
        )}

        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
    </PageContainer>
  );
}
