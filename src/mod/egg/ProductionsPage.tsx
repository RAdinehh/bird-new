/**
 * ProductionsPage — ثبت تخم‌گذاری
 */
import { useState, useMemo } from 'react';
import { useEgg, healthyCount, henDayRate, brokenRate, type EggProduction } from './store';
import { useFlk, getAgeDays } from '../flk/store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import ProgressTracker from '../../shr/components/ProgressTracker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { Row, SectionTitle, chip } from './helpers';
import { format as formatJ } from 'date-fns-jalali';
import { logAction } from '../../cor/logger/auditLog';

interface F {
  id?: string;
  flockId: string;
  date: string;
  eatingCount: string;
  fertileCount: string;
  brokenCount: string;
  softCount: string;
  dirtyCount: string;
  avgWeight: string;
  notes: string;
}

const empty = (): F => ({
  flockId: '', date: '',
  eatingCount: '', fertileCount: '',
  brokenCount: '', softCount: '', dirtyCount: '',
  avgWeight: '', notes: '',
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
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [filterFlock, setFilterFlock] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = [...productions];
    if (filterFlock) arr = arr.filter(p => p.flockId === filterFlock);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }, [productions, filterFlock]);

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addProduction(item.item);
      showToast('بازگردانی شد', 'success', 2000);
    } catch (err) {
      showToast('بازگردانی ناموفق', 'error', 2000);
    }
    setUndoData(null);
  };

  const openNew = () => {
    if (activeFlocks.length === 0) { showAlert('اول یک گله تخم‌گذار بسازید'); return; }
    setForm({ ...empty(), flockId: activeFlocks[0].id });
    setErr(''); setOpen(true);
  };

  const openEdit = (p: EggProduction) => {
    setForm({
      id: p.id, flockId: p.flockId, date: p.date,
      eatingCount: p.eatingCount ? toFa(p.eatingCount) : '',
      fertileCount: p.fertileCount ? toFa(p.fertileCount) : '',
      brokenCount: p.brokenCount ? toFa(p.brokenCount) : '',
      softCount: p.softCount ? toFa(p.softCount) : '',
      dirtyCount: p.dirtyCount ? toFa(p.dirtyCount) : '',
      avgWeight: p.avgWeight !== null && p.avgWeight !== undefined ? toFa(p.avgWeight) : '',
      notes: p.notes || '',
    });
    setErr(''); setOpen(true);
  };

  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const selectedFlock = activeFlocks.find(f => f.id === form.flockId) || flocks.find(f => f.id === form.flockId);
  const flockCount = selectedFlock ? (selectedFlock.currentCount || selectedFlock.initialCount || 0) : 0;

  /* liveErrorApplied */
  // اعتبارسنجی زنده
  const liveErrors = (() => {
    const errs: { field: string; msg: string }[] = [];
    const e = int(form.eatingCount);
    const f = int(form.fertileCount);
    const b = int(form.brokenCount);
    const s = int(form.softCount);
    const d = int(form.dirtyCount);
    if (e < 0 || f < 0 || b < 0 || s < 0 || d < 0) errs.push({ field: 'all', msg: 'مقادیر منفی مجاز نیست' });
    if (flockCount > 0 && (e + f) > flockCount) errs.push({ field: 'healthy', msg: `مجموع سالم (${toFa(e + f)}) از تعداد گله (${toFa(flockCount)}) بیشتره` });
    if (e > 0 && e > flockCount) errs.push({ field: 'eating', msg: 'تخم خوراکی از تعداد گله بیشتره' });
    if (f > 0 && f > flockCount) errs.push({ field: 'fertile', msg: 'تخم نطفه‌دار از تعداد گله بیشتره' });
    return errs;
  })();
  const healthySum = int(form.eatingCount) + int(form.fertileCount);
  const totalSum = healthySum + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);

  const totalEggs = int(form.eatingCount) + int(form.fertileCount) + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);
  const healthy = int(form.eatingCount) + int(form.fertileCount);
  const liveRate = flockCount > 0 && healthy > 0 ? ((healthy / flockCount) * 100).toFixed(1) : '0';
  const fertilePercent = healthy > 0 ? Math.round((int(form.fertileCount) / healthy) * 100) : 0;
  const eatingPercent = healthy > 0 ? Math.round((int(form.eatingCount) / healthy) * 100) : 0;

  const save = () => {
    if (form.flockId === '') { setErr('گله اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    const eating = int(form.eatingCount);
    const fertile = int(form.fertileCount);
    const broken = int(form.brokenCount);
    const soft = int(form.softCount);
    const dirty = int(form.dirtyCount);
    const total = eating + fertile + broken + soft + dirty;
    if (total === 0) { setErr('حداقل یک عدد وارد کنید'); return; }
    if (flockCount > 0 && (eating + fertile) > flockCount) {
      setErr('تخم سالم (' + toFa(eating + fertile) + ') نمی‌تواند از تعداد گله (' + toFa(flockCount) + ') بیشتر باشد');
      return;
    }
    const data = {
      flockId: form.flockId,
      date: form.date.trim(),
      eatingCount: eating,
      fertileCount: fertile,
      totalCount: total,
      brokenCount: broken,
      softCount: soft,
      dirtyCount: dirty,
      avgWeight: form.avgWeight ? num(form.avgWeight) : null,
      notes: form.notes.trim(),
    };
    if (form.id === undefined) { addProduction(data); }
    else { updateProduction(form.id, data); }
    setOpen(false);
  };

  const target = delId ? productions.find(p => p.id === delId) : null;

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
        id="egg-prod-intro"
        icon="🥚"
        title="ثبت تخم‌گذاری روزانه"
        description="هر روز تعداد تخم‌ها را بین خوراکی، نطفه‌دار و مصرفی تقسیم کنید."
        tone="info"
      />
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
                stats={
                  <>
                    <span>کل: <b style={{ color: 'var(--text)' }}>{toFa(p.totalCount)}</b></span>
                    {p.brokenCount > 0 ? <span style={{ color: 'var(--danger)' }}>شکسته: <b>{toFa(p.brokenCount)}</b></span> : null}
                    {brokenPct > 0 ? <span>شکسته: <b style={{ color: 'var(--text)' }}>{toFa(brokenPct.toFixed(1))}٪</b></span> : null}
                  </>
                }
              >
                <SectionTitle>📊 آمار تخم‌گذاری</SectionTitle>
                {p.eatingCount > 0 && <Row l="🥚 تخم خوراکی" v={toFa(p.eatingCount)} />}
                {p.fertileCount > 0 && <Row l="🌱 تخم نطفه‌دار" v={toFa(p.fertileCount)} />}
                <Row l="تخم سالم" v={toFa(healthy2)} />
                <Row l="تخم شکسته" v={toFa(p.brokenCount)} />
                {p.softCount > 0 ? <Row l="تخم نرم" v={toFa(p.softCount)} /> : null}
                {p.dirtyCount > 0 ? <Row l="تخم کثیف" v={toFa(p.dirtyCount)} /> : null}
                <Row l="جمع کل" v={toFa((p.totalCount || 0) + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0))} />

                {rate > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
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
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{p.notes}</div>
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
            <Select value={form.flockId} onChange={e => setForm({ ...form, flockId: e.target.value })}>
              {activeFlocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
          </Field>
        </Grid2>

        {flockCount > 0 ? (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
            تعداد گله: {toFa(flockCount)} پرنده
          </div>
        ) : null}

        <SectionTitle>🥚 تخم‌های سالم</SectionTitle>

        <Grid2>
          <Field label="🥚 تخم خوراکی">
            <NumField placeholder="مثلاً — ۴۰" value={form.eatingCount} onChange={e => setForm({ ...form, eatingCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
          <Field label="🌱 تخم نطفه‌دار">
            <NumField placeholder="مثلاً — ۱۰" value={form.fertileCount} onChange={e => setForm({ ...form, fertileCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
        </Grid2>

        {(int(form.eatingCount) > 0 || int(form.fertileCount) > 0) && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.7, textAlign: 'center' }}>
            📊 ترکیب سالم: <b>{toFa(eatingPercent)}٪ خوراکی</b> · <b>{toFa(fertilePercent)}٪ نطفه‌دار</b>
          </div>
        )}

        {/* خطاهای زنده */}
        {liveErrors.length > 0 && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {liveErrors.map((er, i) => (
              <div key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠️</span>
                <span>{er.msg}</span>
              </div>
            ))}
          </div>
        )}

        <SectionTitle>💔 تخم‌های مصرفی</SectionTitle>

        <Grid2>
          <Field label="تخم شکسته">
            <NumField placeholder="مثلاً — ۵" value={form.brokenCount} onChange={e => setForm({ ...form, brokenCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
          <Field label="تخم نرم">
            <NumField placeholder="مثلاً — ۲" value={form.softCount} onChange={e => setForm({ ...form, softCount: e.target.value })} unit="عدد" min={0} integer />
          </Field>
        </Grid2>
        <Field label="تخم کثیف">
          <NumField placeholder="مثلاً — ۳" value={form.dirtyCount} onChange={e => setForm({ ...form, dirtyCount: e.target.value })} unit="عدد" min={0} integer />
        </Field>

        {totalEggs > 0 ? (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                <span style={{ color: 'var(--muted)' }}>⚪ نرم:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(int(form.softCount))}</span>
              </div>
            ) : null}
            {int(form.dirtyCount) > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>🧹 کثیف:</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(int(form.dirtyCount))}</span>
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

        {(int(form.eatingCount) > 0 || int(form.fertileCount) > 0 || (int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount)) > 0) && (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, lineHeight: 1.7 }}>
            {int(form.eatingCount) > 0 && <div>✓ {toFa(int(form.eatingCount))} تخم مرغ خوراکی → انبار</div>}
            {int(form.fertileCount) > 0 && <div>✓ {toFa(int(form.fertileCount))} تخم نطفه‌دار → انبار</div>}
            {(int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount)) > 0 && (
              <div>✓ {toFa(int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount))} تخم مصرفی → انبار مصرفی</div>
            )}
          </div>
        )}

        <SectionTitle>⚖ وزن</SectionTitle>
        <Field label="وزن میانگین تخم" hint="اختیاری">
          <NumField placeholder="مثلاً — ۱.۵" value={form.avgWeight} onChange={e => setForm({ ...form, avgWeight: e.target.value })} unit="گرم" min={0} />
        </Field>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف تخم‌گذاری"
        footer={<BtnRow><Btn variant="danger" onClick={async () => {
          const idToDel = delId; if (!idToDel) return;
          const ok = await showConfirmAsync('تأیید حذف', 'این مورد حذف شود؟', { danger: true });
          if (!ok) return;
          const item = productions.find((x: any) => x.id === idToDel);
          if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); }
          deleteProduction(idToDel);
          logAction('delete', 'egg', 'حذف از تخم‌ها');
          setDelId(null);
          showToast('حذف شد', 'info', 1800);
        }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف ثبت <b>{toFa(target?.date)}</b>؟</div>
      </Modal>
    </PageContainer>
  );
}
