/**
 * FormulaFormModal — فرم ساخت/ویرایش جیره
 */
import { Field, Grid2, Input, Modal, NumField, Select, Textarea, ErrorBox, BtnRow, Btn } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa, toEn } from '../../../shr/utils/fa';
import { NutrientRow, SectionTitle } from '../helpers';
import { type FormulaLine } from '../store';
import type { F } from '../types-formulas';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  err: string;
  vErrors: Record<string, string>;
  ingredients: any[];
  requirements: any[];
  total: number;
  nutrients: any;
  selectedReq: any;
  addLine: () => void;
  updateLine: (id: string, patch: Partial<FormulaLine>) => void;
  removeLine: (id: string) => void;
  autoBalance: () => void;
  save: () => void;
}

export default function FormulaFormModal(props: Props) {
  const {
    open, setOpen, form, setForm, err, vErrors,
    ingredients, requirements, total, nutrients, selectedReq,
    addLine, updateLine, removeLine, autoBalance, save,
  } = props;

  return (
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش جیره' : 'ساخت جیره جدید'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="نام جیره" required>
          <Input placeholder="مثلاً — جیره لیر زمستان" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Grid2>
          <Field label="نیاز مرجع" hint="برای مقایسه">
<SmartSelect
              value={form.requirementId}
              onChange={v => setForm(f => ({ ...f, requirementId: v }))}
              options={requirements.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (r => r.name)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب نیاز"
              autoThreshold={6}
            />
          </Field>
          <Field label="تاریخ">
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
          </Field>
        </Grid2>

        <SectionTitle>
          🌾 مواد تشکیل‌دهنده — مجموع: {toFa(total.toFixed(2))}٪
        </SectionTitle>

        {total !== 100 && form.lines.length > 0 ? (
          <div style={{
            padding: 'var(--pad-normal)',
            background: total > 100 ? 'var(--danger-soft)' : 'var(--warn-soft)',
            border: '1px solid ' + (total > 100 ? 'var(--danger)' : 'var(--warn)'),
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-xs)',
            color: total > 100 ? 'var(--danger)' : 'var(--warn)',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {total > 100 ? '❌ مجموع بیشتر از ۱۰۰ است' : '⚠ مجموع باید ۱۰۰ باشد'}
          </div>
        ) : null}

        {form.lines.length > 1 ? (
          <Btn size="sm" full onClick={autoBalance}>⚖ تقسیم مساوی (کمک)</Btn>
        ) : null}

        {form.lines.map((line, idx) => {
          const ing = ingredients.find(x => x.id === line.ingredientId);
          if (ing === undefined) return null;
          const usedIds = form.lines.filter(l => l.id !== line.id).map(l => l.ingredientId);
          const available = ingredients.filter(i => !usedIds.includes(i.id));
          return (
            <div key={line.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)',
               border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
               display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>ماده {toFa(idx + 1)}</span>
                <button type="button" onClick={() => removeLine(line.id)} style={{ background: 'none',
                   border: 'none', color: 'var(--danger)', cursor: 'pointer',
                   fontFamily: 'inherit', fontSize: 'var(--fs-base)' }}>✕</button>
              </div>
              <Select value={line.ingredientId} onChange={e => updateLine(line.id, { ingredientId: e.target.value })}>
                {available.map(i => <option key={i.id} value={i.id}>{i.name} ({toFa(i.protein)}٪ پروتئین)</option>)}
              </Select>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Field label="درصد در جیره">
                    <NumField placeholder="مثلاً — ۱۰"
                      value={String(line.percent)}
                      onChange={e => updateLine(line.id, { percent: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })}
                      unit="٪"
                      max={100}
                      min={0}
                    />
                  </Field>
                </div>
                <div style={{
                  paddingBottom: 12,
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  color: (100 - total) < 0 ? 'var(--danger)' : 'var(--muted)',
                  whiteSpace: 'nowrap'
                }}>
                  {toFa((100 - total).toFixed(2))}٪ مانده
                </div>
              </div>
              {ing.maxPercent > 0 && line.percent > ing.maxPercent ? (
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>⚠ حداکثر {toFa(ing.maxPercent)}٪ برای این ماده</div>
              ) : null}
              {ing.minPercent > 0 && line.percent < ing.minPercent && line.percent > 0 ? (
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠ حداقل {toFa(ing.minPercent)}٪ برای این ماده</div>
              ) : null}
            </div>
          );
        })}

        <Btn size="sm" full onClick={addLine}>+ افزودن ماده</Btn>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> مواد مغذی محاسبه‌شده</SectionTitle>
        <Grid2>
          <NutrientRow l="پروتئین" value={nutrients.protein} target={selectedReq ? selectedReq.protein : undefined} unit="٪" />
          <NutrientRow l="انرژی" value={nutrients.energy} target={selectedReq ? selectedReq.energy : undefined} unit="kcal" />
        </Grid2>
        <Grid2>
          <NutrientRow l="کلسیم" value={nutrients.calcium} target={selectedReq ? selectedReq.calcium : undefined} unit="٪" />
          <NutrientRow l="فسفر" value={nutrients.phosphorus} target={selectedReq ? selectedReq.phosphorus : undefined} unit="٪" />
        </Grid2>
        <Grid2>
          <NutrientRow l="متیونین" value={nutrients.methionine} target={selectedReq ? selectedReq.methionine : undefined} unit="٪" />
          <NutrientRow l="لیزین" value={nutrients.lysine} target={selectedReq ? selectedReq.lysine : undefined} unit="٪" />
        </Grid2>

        {nutrients.price > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between',
             fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)',
             color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
            <span><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هزینه هر کیلوگرم:</span>
            <span>{toFa(nutrients.price.toLocaleString('fa-IR'))} ت</span>
          </div>
        ) : null}

        <SectionTitle>⚙ وضعیت</SectionTitle>
        <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'active' | 'archived' })}>
          <option value="draft">پیش‌نویس</option>
          <option value="active">فعال</option>
          <option value="archived">آرشیو</option>
        </Select>

        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
