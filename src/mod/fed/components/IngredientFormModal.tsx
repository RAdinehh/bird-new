/**
 * IngredientFormModal — فرم افزودن/ویرایش ماده اولیه
 */
import { Field, Grid2, Input, Modal, MoneyField, NumField, Select, Textarea, ErrorBox, BtnRow, Btn } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa } from '../../../shr/utils/fa';
import { CATEGORY_LABEL, CATEGORY_ICON, type IngredientCategory } from '../store';
import { INGREDIENT_STANDARDS } from '../standards';
import { SectionTitle } from '../helpers';
import type { F } from '../types-ingredients';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  err: string;
  vErrors: Record<string, string>;
  items: any[];
  pickFromLibrary: (key: string) => void;
  save: () => void;
}

export default function IngredientFormModal(props: Props) {
  const { open, setOpen, form, setForm, err, vErrors, items, pickFromLibrary, save } = props;

  return (
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش ماده' : 'افزودن ماده اولیه'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
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

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اتصال به انبار</SectionTitle>
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
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
