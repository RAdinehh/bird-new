import { useState, useMemo } from 'react';
import { useFed, CATEGORY_LABEL, CATEGORY_ICON, type Ingredient, type IngredientCategory } from './store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';

interface F {
  id?: string;
  name: string;
  category: IngredientCategory;
  protein: string; energy: string; fat: string; fiber: string;
  calcium: string; phosphorus: string;
  methionine: string; lysine: string;
  minPercent: string; maxPercent: string;
  price: string;
  stockItemId: string;
  notes: string;
}

const empty = (): F => ({
  name: '', category: 'energy',
  protein: '', energy: '', fat: '', fiber: '',
  calcium: '', phosphorus: '', methionine: '', lysine: '',
  minPercent: '', maxPercent: '',
  price: '', stockItemId: '', notes: ''
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

  const list = useMemo(() => {
    let arr = ingredients;
    if (filterCat) arr = arr.filter(i => i.category === filterCat);
    return arr;
  }, [ingredients, filterCat]);

  const openNew = () => {
    setForm(empty());
    setErr(''); setOpen(true);
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
      notes: it.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const save = () => {
    if (form.name.trim() === '') { setErr('نام ماده اجباری است'); return; }

    const data = {
      name: form.name.trim(),
      category: form.category,
      protein: num(form.protein),
      energy: num(form.energy),
      fat: num(form.fat),
      fiber: num(form.fiber),
      calcium: num(form.calcium),
      phosphorus: num(form.phosphorus),
      methionine: num(form.methionine),
      lysine: num(form.lysine),
      minPercent: num(form.minPercent),
      maxPercent: num(form.maxPercent),
      price: num(form.price),
      stockItemId: form.stockItemId,
      notes: form.notes.trim()
    };

    if (form.id === undefined) {
      addIngredient(data);
    } else {
      updateIngredient(form.id, data);
    }
    setOpen(false);
  };

  const target = delId ? ingredients.find(i => i.id === delId) : null;

  return (
    <PageContainer>
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

            return (
              <ExpandableCard
                key={it.id}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji={CATEGORY_ICON[it.category]}
                title={it.name}
                subtitle={`${CATEGORY_LABEL[it.category]} · پروتئین ${toFa(it.protein)}٪`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : it.id)}
                badge={it.price > 0 ? <Tag tone="blue">{toFa(it.price.toLocaleString('fa-IR'))} ت/kg</Tag> : undefined}
                summary={
                  <>
                    <span>پروتئین: <b style={{ color: 'var(--text)' }}>{toFa(it.protein)}٪</b></span>
                    <span>انرژی: <b style={{ color: 'var(--text)' }}>{toFa(it.energy)}</b></span>
                    {it.price > 0 ? <span>قیمت: <b style={{ color: 'var(--text)' }}>{toFa(it.price.toLocaleString('fa-IR'))}</b></span> : null}
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

                {(it.minPercent > 0 || it.maxPercent > 0) ? (
                  <>
                    <SectionTitle>⚖ محدوده استفاده</SectionTitle>
                    {it.minPercent > 0 ? <Row l="حداقل" v={`${toFa(it.minPercent)} ٪`} /> : null}
                    {it.maxPercent > 0 ? <Row l="حداکثر" v={`${toFa(it.maxPercent)} ٪`} /> : null}
                  </>
                ) : null}

                <SectionTitle>💰 مالی و انبار</SectionTitle>
                {it.price > 0 ? <Row l="قیمت هر کیلوگرم" v={`${toFa(it.price.toLocaleString('fa-IR'))} ت`} /> : null}
                {stockItem ? <Row l="کالای انبار" v={`${stockItem.name} (${toFa(stockItem.currentStock)} ${UNIT_LABEL[stockItem.unit]})`} /> : null}

                {it.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{it.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(it)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(it.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن ماده</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش ماده' : 'افزودن ماده اولیه'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
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
          <Field label="قیمت هر کیلوگرم">
            <Input mode="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} unit="ت" />
          </Field>
        </Grid2>

        <SectionTitle>🥗 ترکیبات (درصد یا واحد)</SectionTitle>
        <Grid2>
          <Field label="پروتئین خام"><Input mode="number" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} unit="٪" /></Field>
          <Field label="انرژی (kcal/kg)"><Input mode="number" value={form.energy} onChange={e => setForm({ ...form, energy: e.target.value })} /></Field>
        </Grid2>
        <Grid2>
          <Field label="چربی"><Input mode="number" value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} unit="٪" /></Field>
          <Field label="فیبر"><Input mode="number" value={form.fiber} onChange={e => setForm({ ...form, fiber: e.target.value })} unit="٪" /></Field>
        </Grid2>
        <Grid2>
          <Field label="کلسیم"><Input mode="number" value={form.calcium} onChange={e => setForm({ ...form, calcium: e.target.value })} unit="٪" /></Field>
          <Field label="فسفر"><Input mode="number" value={form.phosphorus} onChange={e => setForm({ ...form, phosphorus: e.target.value })} unit="٪" /></Field>
        </Grid2>
        <Grid2>
          <Field label="متیونین"><Input mode="number" value={form.methionine} onChange={e => setForm({ ...form, methionine: e.target.value })} unit="٪" /></Field>
          <Field label="لیزین"><Input mode="number" value={form.lysine} onChange={e => setForm({ ...form, lysine: e.target.value })} unit="٪" /></Field>
        </Grid2>

        <SectionTitle>⚖ محدوده استفاده در جیره</SectionTitle>
        <Grid2>
          <Field label="حداقل" hint="۰ = بدون محدودیت"><Input mode="number" value={form.minPercent} onChange={e => setForm({ ...form, minPercent: e.target.value })} unit="٪" /></Field>
          <Field label="حداکثر" hint="۰ = بدون محدودیت"><Input mode="number" value={form.maxPercent} onChange={e => setForm({ ...form, maxPercent: e.target.value })} unit="٪" max={100} /></Field>
        </Grid2>

        <SectionTitle>📦 اتصال به انبار (اختیاری)</SectionTitle>
        <Field label="کالای مرتبط در انبار" hint="اگر انبار متصل شود، موجودی خودکار کم می‌شود">
          <Select value={form.stockItemId} onChange={e => setForm({ ...form, stockItemId: e.target.value })}>
            <option value="">— بدون اتصال —</option>
            {items.map(si => (
              <option key={si.id} value={si.id}>{si.name} ({toFa(si.currentStock)} {UNIT_LABEL[si.unit]})</option>
            ))}
          </Select>
        </Field>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {err ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div> : null}
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

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
