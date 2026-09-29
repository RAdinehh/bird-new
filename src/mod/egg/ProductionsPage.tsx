import { useState, useMemo } from 'react';
import { useEgg, healthyCount, henDayRate, brokenRate, type EggProduction } from './store';
import { useFlk, getAgeDays } from '../flk/store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import ProgressTracker from '../../shr/components/ProgressTracker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

interface F {
  id?: string;
  flockId: string;
  date: string;
  percent: string;
  totalCount: string;
  brokenCount: string;
  softCount: string;
  dirtyCount: string;
  avgWeight: string;
  notes: string;
}

const empty = (): F => ({
  flockId: '', date: '',
  percent: '',
  totalCount: '', brokenCount: '', softCount: '', dirtyCount: '',
  avgWeight: '', notes: ''
});

export default function ProductionsPage() {
  const { productions, addProduction, updateProduction, deleteProduction } = useEgg();
  const { flocks } = useFlk();
  const { birds } = useBrd();

  const activeFlocks = flocks.filter(f => f.status === 'active' && (f.type === 'layer' || f.type === 'breeder'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterFlock, setFilterFlock] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = [...productions];
    if (filterFlock) arr = arr.filter(p => p.flockId === filterFlock);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }, [productions, filterFlock]);

  const openNew = () => {
    if (activeFlocks.length === 0) { showAlert('اول یک گله تخم‌گذار بسازید'); return; }
    setForm({ ...empty(), flockId: activeFlocks[0].id });
    setErr(''); setOpen(true);
  };

  const openEdit = (p: EggProduction) => {
    setForm({
      id: p.id, flockId: p.flockId, date: p.date,
      percent: '',
      totalCount: p.totalCount ? toFa(p.totalCount) : '',
      brokenCount: p.brokenCount ? toFa(p.brokenCount) : '',
      softCount: p.softCount ? toFa(p.softCount) : '',
      dirtyCount: p.dirtyCount ? toFa(p.dirtyCount) : '',
      avgWeight: p.avgWeight ? toFa(p.avgWeight) : '',
      notes: p.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const selectedFlock = activeFlocks.find(f => f.id === form.flockId) || flocks.find(f => f.id === form.flockId);
  const flockCount = selectedFlock ? (selectedFlock.currentCount || selectedFlock.initialCount || 0) : 0;

  // تغییر درصد → تعداد خودکار
  const onPercentChange = (v: string) => {
    if (v === '') {
      setForm(f => ({ ...f, percent: '', totalCount: '' }));
      return;
    }
    const p = Math.max(0, Math.min(100, parseFloat(toEn(v).replace('٫','.')) || 0));
    const cnt = flockCount > 0 ? Math.round((p / 100) * flockCount) : 0;
    setForm(f => ({ ...f, percent: v, totalCount: cnt > 0 ? toFa(cnt) : '' }));
  };

  // تغییر تعداد → درصد خودکار
  const onCountChange = (v: string) => {
    if (v === '') {
      setForm(f => ({ ...f, totalCount: '', percent: '' }));
      return;
    }
    const cnt = parseInt(toEn(v)) || 0;
    const pct = flockCount > 0 && cnt > 0 ? Math.round((cnt / flockCount) * 1000) / 10 : 0;
    setForm(f => ({ ...f, totalCount: v, percent: cnt > 0 ? toFa(pct) : '' }));
  };

  // محاسبه‌ی زنده‌ی مجموع
  const totalEggs = int(form.totalCount) + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);
  const healthy = int(form.totalCount);
  const liveRate = flockCount > 0 && healthy > 0 ? ((healthy / flockCount) * 100).toFixed(1) : '0';

  const save = () => {
    if (form.flockId === '') { setErr('گله اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }

    let total = int(form.totalCount);
    // اگر تخم سالم خالی ولی درصد پر بود
    if (total === 0 && form.percent !== '' && flockCount > 0) {
      const p = parseFloat(toEn(form.percent).replace('٫','.')) || 0;
      total = Math.round((p / 100) * flockCount);
    }

    const broken = int(form.brokenCount);
    const soft = int(form.softCount);
    const dirty = int(form.dirtyCount);

    if (total + broken + soft + dirty === 0) { setErr('حداقل یک عدد وارد کنید'); return; }
    if (flockCount > 0 && total > flockCount) {
      setErr('تخم سالم (' + toFa(total) + ') نمی‌تواند از تعداد گله (' + toFa(flockCount) + ') بیشتر باشد — هر مرغ حداکثر ۱ تخم در روز');
      return;
    }

    const data = {
      flockId: form.flockId,
      date: form.date.trim(),
      totalCount: total,
      brokenCount: broken,
      softCount: soft,
      dirtyCount: dirty,
      avgWeight: form.avgWeight ? num(form.avgWeight) : null,
      notes: form.notes.trim()
    };

    if (form.id === undefined) {
      addProduction(data);
    } else {
      updateProduction(form.id, data);
    }
    setOpen(false);
  };

  const target = delId ? productions.find(p => p.id === delId) : null;

  return (
    <PageContainer>
      {activeFlocks.length > 0 && productions.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFilterFlock('')} style={chip(filterFlock === '')}>همه</button>
          {activeFlocks.map(f => (
            <button key={f.id} onClick={() => setFilterFlock(f.id)} style={chip(filterFlock === f.id)}>{f.name}</button>
          ))}
        </div>
      ) : null}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title="تخم‌گذاری ثبت نشده"
          desc={activeFlocks.length === 0 ? 'اول یک گله تخم‌گذار بسازید.' : 'اولین تخم‌گذاری امروز را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>+ ثبت تخم‌گذاری</Btn>}
        />
      ) : (
        <>
          {list.map((p, i) => {
            const flock = flocks.find(f => f.id === p.flockId);
            const bird = flock ? birds.find(b => b.id === flock.birdId) : null;
            const healthy2 = healthyCount(p);
            const flockCount2 = flock ? (flock.currentCount || flock.initialCount || 0) : 0;
            const rate = henDayRate(p, flockCount2);
            const brokenPct = brokenRate(p);
            const isOpen = expandedId === p.id;
            const ageDays = flock ? getAgeDays(flock) : 0;

            let accent: 'accent' | 'warn' = 'accent';
            let tone: 'green' | 'amber' | 'red' = 'green';
            if (rate > 0 && rate < 60) { accent = 'warn'; tone = 'amber'; }

            return (
              <ExpandableCard
                key={p.id}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji="🥚"
                title={toFa(healthy2) + ' تخم سالم — ' + (flock?.name || '—')}
                subtitle={toFa(p.date) + (bird ? ' · ' + bird.name : '') + (ageDays > 0 ? ' · ' + toFa(ageDays) + ' روز' : '')}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : p.id)}
                badge={rate > 0 ? <Tag tone={tone}>{toFa(rate.toFixed(1))}٪</Tag> : undefined}
                summary={
                  <>
                    <span>کل: <b style={{ color: 'var(--text)' }}>{toFa(p.totalCount)}</b></span>
                    {p.brokenCount > 0 ? <span style={{ color: 'var(--danger)' }}>شکسته: <b>{toFa(p.brokenCount)}</b></span> : null}
                    {brokenPct > 0 ? <span>شکسته: <b style={{ color: 'var(--text)' }}>{toFa(brokenPct.toFixed(1))}٪</b></span> : null}
                  </>
                }
              >
                <SectionTitle>📊 آمار تخم‌گذاری</SectionTitle>
                <Row l="تخم سالم" v={toFa(healthy2)} accent />
                <Row l="تخم شکسته" v={toFa(p.brokenCount)} />
                {p.softCount > 0 ? <Row l="تخم نرم" v={toFa(p.softCount)} /> : null}
                {p.dirtyCount > 0 ? <Row l="تخم کثیف" v={toFa(p.dirtyCount)} /> : null}
                <Row l="جمع کل" v={toFa((p.totalCount || 0) + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0))} />

                {rate > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                    <span>نرخ تخم‌گذاری (Hen-Day):</span>
                    <span>{toFa(rate.toFixed(1))}٪</span>
                  </div>
                ) : null}

                {p.avgWeight ? (
                  <>
                    <SectionTitle>⚖ وزن</SectionTitle>
                    <Row l="وزن میانگین" v={toFa(p.avgWeight) + ' گرم'} />
                  </>
                ) : null}

                {p.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{p.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(p)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(p.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت تخم‌گذاری</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش تخم‌گذاری' : 'ثبت تخم‌گذاری'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Grid2>
          <Field label="گله" required>
            <Select value={form.flockId} onChange={e => setForm({ ...form, flockId: e.target.value, percent: '', totalCount: '' })}>
              {activeFlocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} />
          </Field>
        </Grid2>

        {flockCount > 0 ? (
          <div style={{ padding: '8px 12px', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 600, textAlign: 'center' }}>
            تعداد گله: {toFa(flockCount)} پرنده
          </div>
        ) : null}

        <SectionTitle>🥚 تخم‌گذاری</SectionTitle>

        <Grid2>
          <Field
            label="درصد تخم‌گذاری"
            hint={flockCount > 0 && form.percent !== '' ? toFa(form.percent) + '٪ از ' + toFa(flockCount) : 'اختیاری'}
          >
            <NumField
              value={form.percent}
              onChange={e => onPercentChange(e.target.value)}
              unit="٪"
              max={100}
              min={0}
            />
          </Field>
          <Field
            label="تخم سالم"
            required
            hint={flockCount > 0 ? 'حداکثر ' + toFa(flockCount) : undefined}
          >
            <NumField
              value={form.totalCount}
              onChange={e => onCountChange(e.target.value)}
              unit="عدد"
              max={flockCount || undefined}
              min={0}
            />
          </Field>
        </Grid2>

        {flockCount > 0 && healthy > flockCount ? (
          <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, textAlign: 'center' }}>
            ❌ تخم سالم نمی‌تواند از تعداد گله ({toFa(flockCount)}) بیشتر باشد
          </div>
        ) : null}

        <Grid2>
          <Field label="تخم شکسته">
            <NumField value={form.brokenCount} onChange={e => setForm({ ...form, brokenCount: e.target.value })} unit="عدد" max={flockCount || undefined} min={0} />
          </Field>
          <Field label="تخم نرم">
            <NumField value={form.softCount} onChange={e => setForm({ ...form, softCount: e.target.value })} unit="عدد" max={flockCount || undefined} min={0} />
          </Field>
        </Grid2>
        <Field label="تخم کثیف">
          <NumField value={form.dirtyCount} onChange={e => setForm({ ...form, dirtyCount: e.target.value })} unit="عدد" max={flockCount || undefined} min={0} />
        </Field>

        {/* کادر خلاصه‌ی محاسبات */}
        {totalEggs > 0 ? (
          <div style={{
            padding: '10px 12px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>🥚 تخم سالم:</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{toFa(healthy)}</span>
            </div>
            {int(form.brokenCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>💔 شکسته:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{toFa(int(form.brokenCount))}</span>
              </div>
            ) : null}
            {int(form.softCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>🥚 نرم:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(int(form.softCount))}</span>
              </div>
            ) : null}
            {int(form.dirtyCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>🧹 کثیف:</span>
                <span style={{ fontWeight: 700, color: 'var(--info)' }}>{toFa(int(form.dirtyCount))}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 6, marginTop: 2 }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>جمع کل:</span>
              <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700 }}>{toFa(totalEggs)} عدد</span>
            </div>
            {flockCount > 0 && healthy > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                <span>نرخ تخم‌گذاری:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(liveRate)}٪</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <SectionTitle>⚖ وزن</SectionTitle>
        <Field label="وزن میانگین تخم" hint="اختیاری">
          <NumField value={form.avgWeight} onChange={e => setForm({ ...form, avgWeight: e.target.value })} unit="گرم" min={0} />
        </Field>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {err ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div> : null}
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف تخم‌گذاری"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteProduction(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف ثبت <b>{toFa(target?.date)}</b>؟</div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: accent ? 'var(--accent-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
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
