import { useState, useMemo } from 'react';
import { format as formatJalali } from 'date-fns-jalali';
import { useFed, STAGE_LABEL, formulaTotal, calcNutrients, formulaValid, type Formula, type FormulaLine } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import SmartSelect from '../../shr/components/SmartSelect';
import { Row, SectionTitle, NutrientRow } from './helpers';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';

interface F {
  id?: string;
  name: string;
  requirementId: string;
  lines: FormulaLine[];
  date: string;
  status: 'draft' | 'active' | 'archived';
  notes: string;
}

const empty = (): F => ({
  name: '', requirementId: '', lines: [],
  date: '', status: 'draft', notes: ''
});

export default function FormulasPage() {
  const { ingredients, requirements, formulas, addFormula, updateFormula, deleteFormula } = useFed();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(
    () => [...formulas].sort((a, b) => b.date.localeCompare(a.date)),
    [formulas]
  );

  const openNew = () => {
    if (ingredients.length === 0) { showAlert('اول مواد اولیه بسازید'); return; }
    const lastF = formulas
      .filter(x => x.requirementId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    setForm({
      ...empty(),
      date: formatJalali(new Date(), 'yyyy/MM/dd'),
      ...(lastF?.requirementId ? { requirementId: lastF.requirementId } : {}),
    });
    setErr(''); setOpen(true);
  };

  const openEdit = (f: Formula) => {
    setForm({
      id: f.id, name: f.name, requirementId: f.requirementId,
      lines: f.lines || [], date: f.date,
      status: f.status, notes: f.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const total = useMemo(() => formulaTotal(form.lines), [form.lines]);
  const nutrients = useMemo(() => calcNutrients(form.lines, ingredients), [form.lines, ingredients]);
  const validation = useMemo(() => formulaValid(form.lines, ingredients), [form.lines, ingredients]);

  const selectedReq = requirements.find(r => r.id === form.requirementId);

  const addLine = () => {
    const usedIds = form.lines.map(l => l.ingredientId);
    const available = ingredients.find(i => !usedIds.includes(i.id));
    if (available === undefined) { showAlert('همه مواد اضافه شده‌اند'); return; }
    setForm(f => ({
      ...f,
      lines: [...f.lines, { id: crypto.randomUUID(), ingredientId: available.id, percent: 0 }]
    }));
  };

  const updateLine = (id: string, patch: Partial<FormulaLine>) => {
    setForm(f => ({
      ...f,
      lines: f.lines.map(x => x.id === id ? { ...x, ...patch } : x)
    }));
  };

  const removeLine = (id: string) => {
    setForm(f => ({ ...f, lines: f.lines.filter(x => x.id !== id) }));
  };

  const autoBalance = () => {
    // هر خط را به صورت مساوی تقسیم می‌کند (کمک ساده)
    if (form.lines.length === 0) return;
    const each = Math.floor((100 / form.lines.length) * 100) / 100;
    const newLines = form.lines.map((l, idx) => ({
      ...l,
      percent: idx === form.lines.length - 1
        ? Math.round((100 - each * (form.lines.length - 1)) * 100) / 100
        : each
    }));
    setForm(f => ({ ...f, lines: newLines }));
  };

  const save = () => {
    // 🔒 جلوگیری قاطع از نام تکراری جیره
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = formulas.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `جیرهای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (form.name.trim() === '') { setErr('نام جیره اجباری است'); return; }
    if (form.lines.length === 0) { setErr('حداقل یک ماده اضافه کنید'); return; }
    const v = formulaValid(form.lines, ingredients);
    if (!v.valid) { setErr(v.errors[0]); return; }

    const data = {
      name: form.name.trim(),
      requirementId: form.requirementId,
      lines: form.lines,
      date: form.date.trim(),
      status: form.status,
      notes: form.notes.trim()
    };

    if (form.id === undefined) {
      addFormula(data);
    } else {
      updateFormula(form.id, data);
    }
    setOpen(false);
  };

  const target = delId ? formulas.find(f => f.id === delId) : null;

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addFormula(item.item);
      showToast('فرمول بازگردانی شد', 'success', 2000);
    } catch (err) {
      showToast('بازگردانی ناموفق', 'error', 2000);
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
      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="جیره‌ای ساخته نشده"
          desc="اولین جیره‌ی خود را بسازید — ترکیب مواد اولیه با درصد."
          action={<Btn variant="primary" onClick={openNew}>+ ساخت جیره</Btn>}
        />
      ) : (
        <>
          {list.map((f, i) => {
            const isOpen = expandedId === f.id;
            const req = requirements.find(r => r.id === f.requirementId);
            const n = calcNutrients(f.lines, ingredients);
            const statusLabel = f.status === 'active' ? 'فعال' : f.status === 'archived' ? 'آرشیو' : 'پیش‌نویس';
            const statusTone: 'green' | 'gray' | 'amber' = f.status === 'active' ? 'green' : f.status === 'archived' ? 'gray' : 'amber';

            return (
              <ExpandableCard
                key={f.id}
                accent={f.status === 'active' ? 'accent' : f.status === 'archived' ? 'dim' : 'warn'}
                index={toFa(i + 1)}
                iconEmoji="🌾"
                title={f.name}
                subtitle={`${req ? req.name : '—'} · ${toFa(f.date)}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : f.id)}
                badge={<Tag tone={statusTone}>{statusLabel}</Tag>}
                stats={
                  <>
                    <span>پروتئین: <b style={{ color: 'var(--text)' }}>{toFa(n.protein)}٪</b></span>
                    <span>انرژی: <b style={{ color: 'var(--text)' }}>{toFa(n.energy)}</b></span>
                    {n.price > 0 ? <span>قیمت: <b style={{ color: 'var(--text)' }}>{toFa(n.price.toLocaleString('fa-IR'))} ت/kg</b></span> : null}
                  </>
                }
              >
                <SectionTitle>🥗 مواد تشکیل‌دهنده</SectionTitle>
                {f.lines.map(line => {
                  const ing = ingredients.find(x => x.id === line.ingredientId);
                  if (ing === undefined) return null;
                  return (
                    <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span>{ing.name}</span>
                      <span style={{ fontWeight: 600 }}>{toFa(line.percent)}٪</span>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between',
                   fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)',
                   color: 'var(--accent)', borderRadius: 'var(--r-sm)',
                   fontWeight: 700 }}>
                  <span>مجموع:</span>
                  <span>{toFa(total.toFixed(2))}٪</span>
                </div>

                <SectionTitle>📊 مواد مغذی</SectionTitle>
                <Grid2>
                  <Row l="پروتئین" v={`${toFa(n.protein)} ٪`} />
                  <Row l="انرژی" v={`${toFa(n.energy)} kcal`} />
                </Grid2>
                <Grid2>
                  <Row l="کلسیم" v={`${toFa(n.calcium)} ٪`} />
                  <Row l="فسفر" v={`${toFa(n.phosphorus)} ٪`} />
                </Grid2>
                <Grid2>
                  <Row l="متیونین" v={`${toFa(n.methionine)} ٪`} />
                  <Row l="لیزین" v={`${toFa(n.lysine)} ٪`} />
                </Grid2>

                {n.price > 0 ? (
                  <>
                    <SectionTitle>💰 مالی</SectionTitle>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)',
                       color: 'var(--accent)', borderRadius: 'var(--r-sm)',
                       fontWeight: 700 }}>
                      <span>هزینه هر کیلوگرم:</span>
                      <span>{toFa(n.price.toLocaleString('fa-IR'))} ت</span>
                    </div>
                  </>
                ) : null}

                {f.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(f)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(f.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ساخت جیره</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش جیره' : 'ساخت جیره جدید'}
        footer={<BtnRow><Btn onClick={() => setOpen(false)}>لغو</Btn><Btn variant="primary" onClick={save}>ذخیره</Btn></BtnRow>}
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
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>ماده {toFa(idx + 1)}</span>
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

        <SectionTitle>📊 مواد مغذی محاسبه‌شده</SectionTitle>
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
            <span>💰 هزینه هر کیلوگرم:</span>
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
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف جیره"
        footer={<BtnRow><Btn onClick={() => setDelId(null)}>لغو</Btn><Btn variant="danger" onClick={async () => { const idToDel = delId; if (!idToDel) return; const ok = await showConfirmAsync('تأیید حذف', 'این فرمول حذف شود؟', { danger: true }); if (!ok) return; const item = formulas.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteFormula(idToDel); setDelId(null); showToast('فرمول حذف شد', 'info', 1800); }}>حذف کن</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.name}</b>؟</div>
      </Modal>
    </PageContainer>
  );
}
