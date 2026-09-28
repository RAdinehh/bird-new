import { useState, useMemo, useEffect } from 'react';
import { useBrd, type Bird } from './store';
import { findBirdPreset } from './presets';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

interface F { id?: string; name: string; cycleDays: string; fcrStandard: string; }
const empty: F = { name: '', cycleDays: '', fcrStandard: '' };

export default function BirdsPage() {
  const { birds: _birdsRaw, breeds, addBird, updateBird, deleteBird, dedupeBirds } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [error, setError] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // فیلتر تکرارها تو render
  const birds = useMemo(() => {
    const seen = new Set<string>();
    return _birdsRaw.filter(b => {
      const k = (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_birdsRaw]);

  const openNew = () => { setForm(empty); setError(''); setOpen(true); };
  const openEdit = (b: Bird) => {
    setForm({ id: b.id, name: b.name, cycleDays: b.cycleDays ? toFa(b.cycleDays) : '', fcrStandard: b.fcrStandard ? toFa(b.fcrStandard) : '' });
    setError(''); setOpen(true);
  };
  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری پرنده
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = birds.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `پرندهای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setError('نام پرنده اجباری است'); return; }
    const payload = {
      name: form.name.trim(), nameEn: '',
      cycleDays: form.cycleDays ? parseInt(toEn(form.cycleDays)) || null : null,
      fcrStandard: form.fcrStandard ? parseFloat(toEn(form.fcrStandard).replace('٫', '.')) || null : null
    };
    if (form.id) updateBird(form.id, payload); else addBird(payload);
    setOpen(false);
  };
  const target = delId ? birds.find(b => b.id === delId) : null;

  return (
    <PageContainer>
      {birds.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>}
          title="هنوز پرنده‌ای اضافه نکرده‌اید"
          desc="اولین پرنده‌ی خود را بسازید — مثلاً «مرغ». بعد از آن می‌توانید نژادهایش را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن پرنده</Btn>}
        />
      ) : (
        <>
          {birds.map((b, i) => {
            const birdBreeds = breeds.filter(x => x.birdId === b.id);
            const isOpen = expandedId === b.id;
            return (
              <ExpandableCard
                key={b.id}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji="🐔"
                title={b.name}
                subtitle={b.nameEn || ''}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                badge={<Tag tone="blue">{toFa(birdBreeds.length)} نژاد</Tag>}
                summary={
                  <>
                    {b.cycleDays ? <span>چرخه: <b style={{ color: 'var(--text)' }}>{toFa(b.cycleDays)} روز</b></span> : null}
                    {b.fcrStandard ? <span>FCR: <b style={{ color: 'var(--text)' }}>{toFa(b.fcrStandard)}</b></span> : null}
                  </>
                }
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📊 مشخصات کامل</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام انگلیسی:</span>
                    <span style={{ fontWeight: 600 }}>{b.nameEn || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>چرخه زندگی:</span>
                    <span style={{ fontWeight: 600 }}>{b.cycleDays ? `${toFa(b.cycleDays)} روز` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>FCR استاندارد:</span>
                    <span style={{ fontWeight: 600 }}>{b.fcrStandard ? toFa(b.fcrStandard) : '—'}</span>
                  </div>
                </div>

                {birdBreeds.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🧬 نژادهای این پرنده</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {birdBreeds.map(bd => (
                        <span key={bd.id} style={{ padding: '4px 10px', background: 'var(--purple-soft)', color: 'var(--purple)', borderRadius: 6, fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                          {bd.name}{bd.fcr ? ` · FCR ${toFa(bd.fcr)}` : ''}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(b)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(b.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن پرنده</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش پرنده' : 'افزودن پرنده'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="نام پرنده" required>
          <Input
          placeholder="مثلاً: مرغ"
          value={form.name}
          onChange={e => {
            const newName = e.target.value;
            const preset = findBirdPreset(newName);
            setForm(f => ({
              ...f,
              name: newName,
              cycleDays: preset?.cycleDays ? toFa(preset.cycleDays) : f.cycleDays,
              fcrStandard: preset?.fcrStandard ? toFa(preset.fcrStandard) : f.fcrStandard,
            }));
          }}
          error={error || undefined}
        />
        </Field>
        <Field label="چرخه زندگی (روز)" hint="از شروع تا پایان دوره">
          <Input
            placeholder="۰"
            inputMode="numeric"
            dir="ltr"
            value={form.cycleDays}
            onChange={e => setForm({ ...form, cycleDays: e.target.value })}
          />
        </Field>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 8 }}>
          💡 <b>چرخه زندگی</b> یعنی چند روز طول می‌کشد تا این پرنده دوره‌اش کامل شود. مثال: جوجه گوشتی ۴۲ روز، مرغ تخم‌گذار ۵۰۰ روز.
        </div>

        <Field label="FCR استاندارد" hint="ضریب تبدیل غذایی مرجع">
          <Input
            placeholder="۲٫۰"
            inputMode="decimal"
            dir="ltr"
            value={form.fcrStandard}
            onChange={e => setForm({ ...form, fcrStandard: e.target.value })}
          />
        </Field>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 8 }}>
          💡 <b>FCR</b> یعنی چند کیلو دان لازم است تا پرنده ۱ کیلو وزن اضافه کند. هرچه کمتر، بهتر. مثال: ۱.۶ عالی، ۱.۸ متوسط، ۲.۰+ ضعیف.
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف پرنده"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteBird(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          آیا از حذف <b>{target?.name}</b> مطمئن هستید؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>تمام نژادهای مربوط به این پرنده هم حذف می‌شوند.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}
