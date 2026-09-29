import { useState, useMemo } from 'react';
import {
  useWhs, CATEGORY_LABEL, CATEGORY_ICON, CATEGORY_DEFAULTS,
  UNIT_LABEL, STORAGE_LABEL, stockWarning, expiryWarning,
  daysToExpiry, type Item, type ItemCategory, type ItemUnit
} from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showConfirmAsync , showAlert} from '../../cor/store/dialog';
import HelpBanner from '../../shr/components/HelpBanner';
import { useNavigate } from 'react-router-dom';

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
}

const empty = (): F => ({
  name: '', category: 'feed', unit: 'kg',
  minStock: '', initialStock: '',
  supplierId: '', expireDate: '',
  withdrawalDays: '', batchNo: '', storage: 'room',
  notes: ''
});

export default function ItemsPage() {
  const navigate = useNavigate();
  const { items, movements, addItem, updateItem, deleteItem } = useWhs();
  const { contacts } = useCtc();
  const suppliers = contacts.filter(c => c.roles.includes('supplier'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<ItemCategory | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = items;
    if (filterCat) arr = arr.filter(i => i.category === filterCat);
    return arr;
  }, [items, filterCat]);

  const openNew = () => {
    setForm(empty());
    setErr(''); setOpen(true);
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
      notes: it.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;
  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;

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
        expireDate: isMed ? form.expireDate : '',
        withdrawalDays: isMed && form.withdrawalDays.trim() !== '' ? int(form.withdrawalDays) : null,
        batchNo: isMed ? form.batchNo.trim() : '',
        storage: form.storage,
        notes: form.notes.trim()
      });
    } else {
      // ویرایش: currentStock و lastPrice نباید تغییر کنن
      updateItem(form.id, {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        minStock: num(form.minStock),
        supplierId: form.supplierId,
        expireDate: isMed ? form.expireDate : '',
        withdrawalDays: isMed && form.withdrawalDays.trim() !== '' ? int(form.withdrawalDays) : null,
        batchNo: isMed ? form.batchNo.trim() : '',
        storage: form.storage,
        notes: form.notes.trim()
      });
    }
    setOpen(false);
  };

  const target = delId ? items.find(i => i.id === delId) : null;
  const isMedicine = form.category === 'medicine' || form.category === 'vaccine';

  return (
    <PageContainer>
        <HelpBanner
          id="items-intro"
          icon="📦"
          title="اینجا فقط کالاها تعریف می‌شوند"
          description="موجودی و قیمت از اینجا مدیریت می‌شود. برای ثبت خرید از فروشنده به بخش «معاملات → خرید» بروید. برای ضایعات یا اصلاح دستی به «انبار → ورود/خروج» بروید."
          tone="info"
        actionLabel="برو به خرید ←"
        onAction={() => navigate('/tra/purchases')}
        />
      {/* فیلتر دسته */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterCat('')} style={chip(filterCat === '')}>
          همه ({toFa(items.length)})
        </button>
        {(Object.keys(CATEGORY_LABEL) as ItemCategory[]).map(c => {
          const cnt = items.filter(i => i.category === c).length;
          if (cnt === 0) return null;
          return (
            <button key={c} onClick={() => setFilterCat(c)} style={chip(filterCat === c)}>
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]} ({toFa(cnt)})
            </button>
          );
        })}
      </div>

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
            const myMovements = movements.filter(m => m.itemId === it.id);
            const isOpen = expandedId === it.id;

            let accent: 'accent' | 'warn' | 'dim' = 'accent';
            if (stock === 'critical' || exp === 'expired') accent = 'warn';
            else if (stock === 'low' || exp === 'soon') accent = 'warn';
            else if (it.currentStock === 0) accent = 'dim';

            const days = daysToExpiry(it.expireDate);

            return (
              <ExpandableCard
                key={it.id}
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
                summary={
                  <>
                    <span>موجودی: <b style={{ color: 'var(--text)' }}>{toFa(it.currentStock)} {UNIT_LABEL[it.unit]}</b></span>
                    {it.minStock > 0 ? <span>حد: <b style={{ color: 'var(--text)' }}>{toFa(it.minStock)}</b></span> : null}
                    {it.lastPrice > 0 ? <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa((it.currentStock * it.lastPrice).toLocaleString('fa-IR'))} ت</b></span> : null}
                  </>
                }
              >
                <SectionTitle>📦 مشخصات قلم</SectionTitle>
                <Row l="دسته" v={CATEGORY_LABEL[it.category]} />
                <Row l="واحد" v={UNIT_LABEL[it.unit]} />
                <Row l="موجودی فعلی" v={`${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`} />
                {it.minStock > 0 ? <Row l="حداقل موجودی" v={`${toFa(it.minStock)} ${UNIT_LABEL[it.unit]}`} /> : null}
                {it.lastPrice > 0 ? <Row l="قیمت آخرین خرید" v={`${toFa(it.lastPrice.toLocaleString('fa-IR'))} ت`} /> : null}
                {sup ? <Row l="تأمین‌کننده" v={sup.name} /> : null}

                {it.currentStock > 0 && it.lastPrice > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: '8px 10px',
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
                        display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px',
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

                {myMovements.length > 0 ? (
                  <>
                    <SectionTitle>📋 آخرین گردش‌ها ({toFa(myMovements.length)})</SectionTitle>
                    {myMovements.slice(-3).reverse().map(m => (
                      <div key={m.id} style={{ fontSize: 'var(--fs-sm)',
                         padding: '6px 10px', background: 'var(--input-bg)',
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
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: '8px 10px', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{it.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(it)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(it.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن قلم</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش قلم' : 'افزودن قلم'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="نام قلم" required>
          <Input placeholder="مثلاً: ذرت، نیوکاسل، ویتامین..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Grid2>
          <Field label="دسته" required>
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

        <Grid3>
          {!form.id && (
            <Field label="موجودی اولیه" hint="اگه الان موجودی داری، اینجا وارد کن — بعد از این، فقط از معاملات به‌روز میشه">
              <NumField value={form.initialStock} onChange={e => setForm({ ...form, initialStock: e.target.value })} unit={UNIT_LABEL[form.unit]} min={0} />
            </Field>
          )}
          <Field label="حداقل موجودی" hint="برای هشدار">
            <NumField value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
          </Field>
          
        </Grid3>

        <Field label="تأمین‌کننده" hint="از مخاطبین">
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

        {isMedicine ? (
          <>
            <SectionTitle>💊 اطلاعات دارویی</SectionTitle>
            <Grid2>
              <Field label="شماره بچ">
                <Input placeholder="..." dir="ltr" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} />
              </Field>
              <Field label="تاریخ انقضا">
                <DatePicker value={form.expireDate} onChange={v => setForm({ ...form, expireDate: v })} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="دوره منع مصرف" hint="روز">
                <NumField value={form.withdrawalDays} onChange={e => setForm({ ...form, withdrawalDays: e.target.value })} unit="روز" min={0} />
              </Field>
              <Field label="نگهداری">
                <Select value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}>
                  <option value="room">دمای اتاق</option>
                  <option value="fridge">یخچال (۲-۸°)</option>
                  <option value="freezer">فریزر</option>
                </Select>
              </Field>
            </Grid2>
          </>
        ) : null}

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {err ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div> : null}
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف قلم"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteItem(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>
          حذف <b>{target?.name}</b>؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>تمام گردش‌های انبار این قلم هم حذف می‌شوند.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
       fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)',
       borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      paddingTop: 10, marginTop: 4,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)'
    }}>{children}</div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
