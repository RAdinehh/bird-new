import { useState, useMemo } from 'react';
import { useFed, STAGE_LABEL, STAGE_LABEL_LONG, type Requirement } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import { Row, SectionTitle } from './helpers';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

interface F {
  id?: string;
  name: string;
  birdType: string;
  stage: string;
  protein: string; energy: string;
  calcium: string; phosphorus: string;
  methionine: string; lysine: string;
  notes: string;
}

const empty = (): F => ({
  name: '', birdType: 'مرغ', stage: 'layer',
  protein: '', energy: '',
  calcium: '', phosphorus: '',
  methionine: '', lysine: '',
  notes: ''
});

const PRESETS: Record<string, Partial<F>> = {
  // === مرغ تخم‌گذار ===
  'مرغ-starter':   { protein: '22',   energy: '2950', calcium: '1',   phosphorus: '0.45', methionine: '0.5',  lysine: '1.35' },
  'مرغ-grower':    { protein: '19',   energy: '2850', calcium: '0.9', phosphorus: '0.4',  methionine: '0.4',  lysine: '1.1' },
  'مرغ-developer': { protein: '17',   energy: '2750', calcium: '1',   phosphorus: '0.4',  methionine: '0.35', lysine: '0.9' },
  'مرغ-prelayer':  { protein: '16.5', energy: '2750', calcium: '2.5', phosphorus: '0.45', methionine: '0.38', lysine: '0.85' },
  'مرغ-layer':     { protein: '16.5', energy: '2800', calcium: '3.8', phosphorus: '0.45', methionine: '0.38', lysine: '0.85' },
  'مرغ-breeder':   { protein: '16.5', energy: '2800', calcium: '3.2', phosphorus: '0.45', methionine: '0.4',  lysine: '0.85' },
  // === مرغ گوشتی ===
  'گوشتی-starter':   { protein: '22', energy: '3000', calcium: '1',   phosphorus: '0.45', methionine: '0.5',  lysine: '1.2' },
  'گوشتی-grower':    { protein: '20', energy: '3100', calcium: '0.9', phosphorus: '0.4',  methionine: '0.45', lysine: '1.1' },
  'گوشتی-finisher':  { protein: '18', energy: '3200', calcium: '0.8', phosphorus: '0.35', methionine: '0.4',  lysine: '1.0' },
  // === فینیشر مرغ تخم‌گذار (کمتر رایجه) ===
  'مرغ-finisher':  { protein: '18',   energy: '3100', calcium: '1',   phosphorus: '0.45', methionine: '0.5',  lysine: '1.2' },
};

export default function RequirementsPage() {
  const { requirements, addRequirement, updateRequirement, deleteRequirement } = useFed();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(
    () => [...requirements].sort((a, b) => a.name.localeCompare(b.name)),
    [requirements]
  );

  const openNew = () => {
    const lastR = requirements.filter(x => x.birdType).slice().reverse()[0];
    setForm({ ...empty(), ...(lastR?.birdType ? { birdType: lastR.birdType } : {}) }); setErr(''); setOpen(true);
  };

  const openEdit = (r: Requirement) => {
    setForm({
      id: r.id, name: r.name, birdType: r.birdType, stage: r.stage,
      protein: r.protein ? toFa(r.protein) : '',
      energy: r.energy ? toFa(r.energy) : '',
      calcium: r.calcium ? toFa(r.calcium) : '',
      phosphorus: r.phosphorus ? toFa(r.phosphorus) : '',
      methionine: r.methionine ? toFa(r.methionine) : '',
      lysine: r.lysine ? toFa(r.lysine) : '',
      notes: r.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری نیاز
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = requirements.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `نیازای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (form.name.trim() === '') { setErr('نام نیاز اجباری است'); return; }

    const data = {
      name: form.name.trim(),
      birdType: form.birdType.trim(),
      stage: form.stage,
      protein: num(form.protein),
      energy: num(form.energy),
      calcium: num(form.calcium),
      phosphorus: num(form.phosphorus),
      methionine: num(form.methionine),
      lysine: num(form.lysine),
      notes: form.notes.trim()
    };

    if (form.id === undefined) {
      addRequirement(data);
    } else {
      updateRequirement(form.id, data);
    }
    setOpen(false);
  };

  const applyPreset = () => {
    const key = form.birdType.trim() + '-' + form.stage;
    const preset = PRESETS[key];
    if (preset) {
      setForm(f => ({ ...f, ...preset }));
    }
  };

  const target = delId ? requirements.find(r => r.id === delId) : null;
  const presetAvailable = PRESETS[form.birdType.trim() + '-' + form.stage] !== undefined;

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addRequirement(item.item);
      showToast('نیاز بازگردانی شد', 'success', 2000);
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
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 11H3v10h18V11h-6M12 2v10M9 5l3-3 3 3"/></svg>}
          title="نیازی ثبت نشده"
          desc="نیازهای غذایی هر مرحله از پرورش را تعریف کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن نیاز</Btn>}
        />
      ) : (
        <>
          {list.map((r, i) => {
            const isOpen = expandedId === r.id;
            const stageLabel = STAGE_LABEL[r.stage] || r.stage;
            return (
              <ExpandableCard
                key={r.id}
                accent="info"
                index={toFa(i + 1)}
                iconEmoji="📊"
                title={r.name}
                subtitle={`${r.birdType} · ${stageLabel}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : r.id)}
                badge={<Tag tone="blue">{toFa(r.protein)}٪ پروتئین</Tag>}
                stats={
                  <>
                    <span>پروتئین: <b style={{ color: 'var(--text)' }}>{toFa(r.protein)}٪</b></span>
                    <span>انرژی: <b style={{ color: 'var(--text)' }}>{toFa(r.energy)}</b></span>
                    <span>کلسیم: <b style={{ color: 'var(--text)' }}>{toFa(r.calcium)}٪</b></span>
                  </>
                }
              >
                <SectionTitle>🐔 مشخصات</SectionTitle>
                <Row l="نوع پرنده" v={r.birdType} />
                <Row l="مرحله" v={stageLabel} />

                <SectionTitle>🥗 نیازهای مغذی</SectionTitle>
                <Grid2>
                  <Row l="پروتئین خام" v={`${toFa(r.protein)} ٪`} />
                  <Row l="انرژی" v={`${toFa(r.energy)} kcal/kg`} />
                </Grid2>
                <Grid2>
                  <Row l="کلسیم" v={`${toFa(r.calcium)} ٪`} />
                  <Row l="فسفر" v={`${toFa(r.phosphorus)} ٪`} />
                </Grid2>
                <Grid2>
                  <Row l="متیونین" v={`${toFa(r.methionine)} ٪`} />
                  <Row l="لیزین" v={`${toFa(r.lysine)} ٪`} />
                </Grid2>

                {r.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{r.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(r)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(r.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن نیاز</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش نیاز' : 'افزودن نیاز غذایی'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="نام نیاز" required>
          <Input placeholder="مثلاً — مرغ تخم‌گذار — لیر" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Grid2>
          <Field label="نوع پرنده">
            <Input placeholder="مرغ" value={form.birdType} onChange={e => setForm({ ...form, birdType: e.target.value })} />
          </Field>
          <Field label="مرحله">
            <Select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              {(Object.keys(STAGE_LABEL)).map(s =>
                <option key={s} value={s}>{STAGE_LABEL_LONG[s]}</option>
              )}
            </Select>
          </Field>
        </Grid2>

        {presetAvailable ? (
          <Btn size="sm" full onClick={applyPreset}>
            ✨ پر کردن خودکار با مقادیر پیش‌فرض
          </Btn>
        ) : null}

        <SectionTitle>🥗 نیازهای مغذی</SectionTitle>
        <Grid2>
          <Field label="پروتئین خام"><NumField value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="انرژی"><NumField value={form.energy} onChange={e => setForm({ ...form, energy: e.target.value })} unit="kcal" min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="کلسیم"><NumField value={form.calcium} onChange={e => setForm({ ...form, calcium: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="فسفر"><NumField value={form.phosphorus} onChange={e => setForm({ ...form, phosphorus: e.target.value })} unit="٪" min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="متیونین"><NumField value={form.methionine} onChange={e => setForm({ ...form, methionine: e.target.value })} unit="٪" min={0} /></Field>
          <Field label="لیزین"><NumField value={form.lysine} onChange={e => setForm({ ...form, lysine: e.target.value })} unit="٪" min={0} /></Field>
        </Grid2>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف نیاز"
        footer={<BtnRow><Btn variant="danger" onClick={async () => { const idToDel = delId; if (!idToDel) return; const ok = await showConfirmAsync('تأیید حذف', 'این نیاز حذف شود؟', { danger: true }); if (!ok) return; const item = requirements.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteRequirement(idToDel);
              logAction('delete', 'fed', 'حذف از جیره‌نویسی'); setDelId(null); showToast('نیاز حذف شد', 'info', 1800); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>
          حذف <b>{target?.name}</b>؟
        </div>
      </Modal>
    </PageContainer>
  );
}
