import { useState, useMemo, useEffect } from 'react';
import { useFed, CATEGORY_LABEL, CATEGORY_ICON, type Ingredient, type IngredientCategory } from './store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { INGREDIENT_STANDARDS } from './standards';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';
import { Row, SectionTitle, chip } from './helpers';

interface F {
  id?: string;
  name: string;
  category: IngredientCategory;
  protein: string; energy: string; fat: string; fiber: string;
  calcium: string; phosphorus: string; methionine: string; lysine: string;
  minPercent: string; maxPercent: string;
  price: string;
  stockItemId: string;
  standardKey: string;
  notes: string;
}

const empty = (): F => ({
  name: '', category: 'energy',
  protein: '', energy: '', fat: '', fiber: '',
  calcium: '', phosphorus: '', methionine: '', lysine: '',
  minPercent: '', maxPercent: '',
  price: '', stockItemId: '', standardKey: '', notes: ''
});

export default function IngredientsPage() {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useFed();
  const { items } = useWhs();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<IngredientCategory | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  // === Seed خودکار مواد CORE (فقط یک بار) ===
  useEffect(() => {
    // اول: پاک کردن تکرارها
    useFed.getState().dedupeCore();

    // دوم: اضافه کردن مواد کم
    const state = useFed.getState();
    const existingKeys = state.ingredients
      .filter(i => i.standardKey)
      .map(i => i.standardKey);

    INGREDIENT_STANDARDS.forEach(s => {
      if (existingKeys.includes(s.key)) return;
      state.addIngredient({
        name: s.name,
        category: s.category,
        protein: s.protein, energy: s.energy, fat: s.fat, fiber: s.fiber,
        calcium: s.calcium, phosphorus: s.phosphorus,
        methionine: s.methionine, lysine: s.lysine,
        minPercent: s.minPercent, maxPercent: s.maxPercent,
        price: 0, stockItemId: '',
        isCore: true, standardKey: s.key,
        notes: s.notes || '',
      });
    });
  }, []);

  const list = useMemo(() => {
    let arr = ingredients;
    if (!showHidden) arr = arr.filter(i => !i.isHidden);
    if (filterCat) arr = arr.filter(i => i.category === filterCat);
    return arr;
  }, [ingredients, filterCat, showHidden]);

  const hiddenCount = useMemo(() => ingredients.filter(i => i.isHidden).length, [ingredients]);

  const openNew = () => {
    setForm(empty()); setErr(''); setOpen(true);
  };

  // === انتخاب از کتابخانه ===
  const pickFromLibrary = (key: string) => {
    const s = INGREDIENT_STANDARDS.find(x => x.key === key);
    if (!s) return;
    setForm({
      name: s.name, category: s.category,
      protein: toFa(s.protein), energy: toFa(s.energy),
      fat: toFa(s.fat), fiber: toFa(s.fiber),
      calcium: toFa(s.calcium), phosphorus: toFa(s.phosphorus),
      methionine: toFa(s.methionine), lysine: toFa(s.lysine),
      minPercent: toFa(s.minPercent), maxPercent: toFa(s.maxPercent),
      price: '', stockItemId: '', standardKey: s.key, notes: s.notes || ''
    });
  };

  const openEdit = (it: Ingredient) => {
    setForm({
      id: it.id, name: it.name, category: it.category,
      protein: it.protein ? toFa(it.protein) : '',
      energy: it.energy ? toFa(it.energy) : '',
      fat: it.fat ? toFa(it.fat) : '',
      fiber: it.fiber ? toFa(it.fiber) : '',
      calcium: it.calcium ? toFa(it.calcium) : '',
      phosphorus: it.phosphorus ? toFa(it.phosphorus) : '',
      methionine: it.methionine ? toFa(it.methionine) : '',
      lysine: it.lysine ? toFa(it.lysine) : '',
      minPercent: it.minPercent ? toFa(it.minPercent) : '',
      maxPercent: it.maxPercent ? toFa(it.maxPercent) : '',
      price: it.price ? toFa(it.price) : '',
      stockItemId: it.stockItemId || '',
      standardKey: it.standardKey || '',
      notes: it.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const toggleHide = (it: Ingredient) => {
    updateIngredient(it.id, { isHidden: !it.isHidden });
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری ماده اولیه
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = ingredients.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `ماده اولیهای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (form.name.trim() === '') { setErr('نام ماده اجباری است'); return; }
    const data = {
      name: form.name.trim(), category: form.category,
      protein: num(form.protein), energy: num(form.energy),
      fat: num(form.fat), fiber: num(form.fiber),
      calcium: num(form.calcium), phosphorus: num(form.phosphorus),
      methionine: num(form.methionine), lysine: num(form.lysine),
      minPercent: num(form.minPercent), maxPercent: num(form.maxPercent),
      price: num(form.price), stockItemId: form.stockItemId,
      standardKey: form.standardKey,
      notes: form.notes.trim()
    };
    if (form.id === undefined) addIngredient(data);
    else updateIngredient(form.id, data);
    setOpen(false);
  };

  const target = delId ? ingredients.find(i => i.id === delId) : null;

  return (
    <PageContainer>
        <HelpBanner
          id="ingredients-intro"
          icon="🌾"
          title="مواد اولیه جیره"
          description="ذرت، کنجاله، سبوس و... را اینجا تعریف کنید. درصد پروتئین و انرژی هر ماده برای ساخت جیره لازم است."
          tone="info"
        />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterCat('')} style={chip(filterCat === '')}>
          همه ({toFa(ingredients.length)})
        </button>
        {(Object.keys(CATEGORY_LABEL) as IngredientCategory[]).map(c => {
          const cnt = ingredients.filter(i => i.category === c).length;
          if (cnt === 0) return null;
          return (
            <button key={c} onClick={() => setFilterCat(c)} style={chip(filterCat === c)}>
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]} ({toFa(cnt)})
            </button>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowHidden(!showHidden)}
          style={{
            padding: '6px 11px', fontSize: 'var(--fs-sm)',
            background: showHidden ? 'var(--warn-soft)' : 'var(--btn-bg)',
            border: '1px solid ' + (showHidden ? 'var(--warn)' : 'var(--border)'),
            borderRadius: 'var(--r-sm)',
            color: showHidden ? 'var(--warn)' : 'var(--muted)',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            marginTop: 4
          }}
        >
          👁️ {showHidden ? 'مخفی کردن' : 'نمایش'} پنهان‌شده‌ها ({toFa(hiddenCount)})
        </button>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="مواد اولیه ثبت نشده"
          desc="ذرت، سویا، کنجاله، مکمل‌ها را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن ماده</Btn>}
        />
      ) : (
        <>
          {list.map((it, i) => {
            const isOpen = expandedId === it.id;
            const stockItem = items.find(x => x.id === it.stockItemId);
            const livePrice = stockItem?.lastPrice || 0;
            const displayPrice = livePrice > 0 ? livePrice : it.price;

            return (
              <ExpandableCard
                key={it.id}
                accent={it.isHidden ? 'dim' : (it.isCore ? 'blue' : 'accent')}
                index={toFa(i + 1)}
                iconEmoji={CATEGORY_ICON[it.category]}
                title={it.name}
                subtitle={`${CATEGORY_LABEL[it.category]} · پروتئین ${toFa(it.protein)}٪`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : it.id)}
                badge={
                  it.isHidden
                    ? <Tag tone="gray">پنهان</Tag>
                    : it.isCore
                    ? <Tag tone="blue">پیش‌فرض</Tag>
                    : (displayPrice > 0 ? <Tag tone="green">{toFa(displayPrice.toLocaleString('fa-IR'))} ت</Tag> : undefined)
                }
                stats={
                  <>
                    <span>پروتئین: <b>{toFa(it.protein)}٪</b></span>
                    <span>انرژی: <b>{toFa(it.energy)}</b></span>
                    {displayPrice > 0 && <span>قیمت: <b>{toFa(displayPrice.toLocaleString('fa-IR'))}</b></span>}
                  </>
                }
              >
                <SectionTitle>🥗 ترکیبات</SectionTitle>
                <Grid2>
                  <Row l="پروتئین" v={`${toFa(it.protein)} ٪`} />
                  <Row l="انرژی" v={`${toFa(it.energy)} kcal`} />
                </Grid2>
                <Grid2>
                  <Row l="چربی" v={`${toFa(it.fat)} ٪`} />
                  <Row l="فیبر" v={`${toFa(it.fiber)} ٪`} />
                </Grid2>
                <Grid2>
                  <Row l="کلسیم" v={`${toFa(it.calcium)} ٪`} />
                  <Row l="فسفر" v={`${toFa(it.phosphorus)} ٪`} />
                </Grid2>
                <Grid2>
                  <Row l="متیونین" v={`${toFa(it.methionine)} ٪`} />
                  <Row l="لیزین" v={`${toFa(it.lysine)} ٪`} />
                </Grid2>

                {(it.minPercent > 0 || it.maxPercent > 0) && (
                  <>
                    <SectionTitle>⚖ محدوده استفاده</SectionTitle>
                    {it.minPercent > 0 && <Row l="حداقل" v={`${toFa(it.minPercent)} ٪`} />}
                    {it.maxPercent > 0 && <Row l="حداکثر" v={`${toFa(it.maxPercent)} ٪`} />}
                  </>
                )}

                <SectionTitle>💰 مالی و انبار</SectionTitle>
                {livePrice > 0 && <Row l="قیمت انبار" v={`${toFa(livePrice.toLocaleString('fa-IR'))} ت/kg`} />}
                {!livePrice && it.price > 0 && <Row l="قیمت دستی" v={`${toFa(it.price.toLocaleString('fa-IR'))} ت/kg`} />}
                {stockItem ? (
                  <Row l="کالای انبار" v={`${stockItem.name} (${toFa(stockItem.currentStock)} ${UNIT_LABEL[stockItem.unit]})`} />
                ) : (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)',
                     padding: 'var(--pad-tight)', background: 'var(--warn-soft)',
                     borderRadius: 'var(--r-sm)' }}>
                    ⚠️ به انبار وصل نیست — موقع مصرف، موجودی کم نمیشه
                  </div>
                )}

                {it.notes && (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{it.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(it)} style={{ flex: 1 }}>ویرایش مقادیر</Btn>
                  {it.isCore ? (
                    <Btn size="sm" onClick={() => toggleHide(it)} style={{ flex: 1 }}>
                      {it.isHidden ? '👁️ نمایش' : '👁️‍🗨️ پنهان'}
                    </Btn>
                  ) : (
                    <Btn size="sm" onClick={() => setDelId(it.id)} style={{ flex: 1 }}>حذف</Btn>
                  )}
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن ماده اولیه جدید</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش ماده' : 'افزودن ماده اولیه'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        {!form.id && (
          <Field label="انتخاب سریع از کتابخانه" hint="یکی از مواد پیش‌فرض را انتخاب کنید">
            <Select value={form.standardKey} onChange={e => pickFromLibrary(e.target.value)}>
              <option value="">— انتخاب از کتابخانه (اختیاری) —</option>
              {INGREDIENT_STANDARDS.map(s => (
                <option key={s.key} value={s.key}>{CATEGORY_ICON[s.category]} {s.name}</option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="نام ماده" required>
          <Input placeholder="ذرت، سویا، کنجاله..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Grid2>
          <Field label="دسته" required>
            <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as IngredientCategory })}>
              {(Object.keys(CATEGORY_LABEL) as IngredientCategory[]).map(c =>
                <option key={c} value={c}>{CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}</option>
              )}
            </Select>
          </Field>
          <Field label="قیمت دستی (اختیاری)" hint="اگر پر شود، بر قیمت انبار اولویت دارد">
            <MoneyField placeholder="مثلاً — ۲٬۵۰۰٬۰۰۰" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </Field>
        </Grid2>

        <SectionTitle>🥗 ترکیبات</SectionTitle>
        <Grid2>
          <Field label="پروتئین خام"><NumField value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="انرژی (kcal/kg)"><NumField value={form.energy} onChange={e => setForm({ ...form, energy: e.target.value })} min={0} unit="kcal" /></Field>
        </Grid2>
        <Grid2>
          <Field label="چربی"><NumField value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="فیبر"><NumField value={form.fiber} onChange={e => setForm({ ...form, fiber: e.target.value })} unit="٪" min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="کلسیم"><NumField value={form.calcium} onChange={e => setForm({ ...form, calcium: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="فسفر"><NumField value={form.phosphorus} onChange={e => setForm({ ...form, phosphorus: e.target.value })} unit="٪" min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="متیونین"><NumField value={form.methionine} onChange={e => setForm({ ...form, methionine: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="لیزین"><NumField value={form.lysine} onChange={e => setForm({ ...form, lysine: e.target.value })} unit="٪" min={0} /></Field>
        </Grid2>

        <SectionTitle>⚖ محدوده استفاده در جیره</SectionTitle>
        <Grid2>
          <Field label="حداقل" hint="۰ = بدون محدودیت"><NumField value={form.minPercent} onChange={e => setForm({ ...form, minPercent: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="حداکثر" hint="۰ = بدون محدودیت"><NumField value={form.maxPercent} onChange={e => setForm({ ...form, maxPercent: e.target.value })} unit="٪" max={100} min={0} /></Field>
        </Grid2>

        <SectionTitle>📦 اتصال به انبار</SectionTitle>
        <Field label="کالای مرتبط" hint="اگر وصل شود، موجودی خودکار کم و قیمت از انبار خونده می‌شود">
<SmartSelect
              value={form.stockItemId}
              onChange={v => setForm(f => ({ ...f, stockItemId: v }))}
              options={items.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (i => i.name)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب کالا"
              autoThreshold={6}
            />
        </Field>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف ماده"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteIngredient(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>
          حذف <b>{target?.name}</b>؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>از تمام جیره‌ها هم حذف می‌شود.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}
