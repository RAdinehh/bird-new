import { useState, useMemo, useEffect } from 'react';
import { useBrd, type Breed } from './store';
import {
  Btn, BtnRow, Empty, Field,
  Grid2, Input, Modal, NumField,
  PageContainer, Select, Tag
} from '../../shr/components/ui';import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';

export default function BreedsPage() {
  const { birds, breeds: _breedsRaw, dedupeBreeds, addBreed, updateBreed, deleteBreed } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', birdId:'', name:'', fcr:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterBird, setFilterBird] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // فیلتر تکرارها تو render (per bird + name)
  const _birdsUnique = useMemo(() => {
    const seen = new Set<string>();
    return birds.filter(b => {
      const k = (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [birds]);

  const breeds = useMemo(() => {
    const seen = new Set<string>();
    return _breedsRaw.filter(b => {
      const k = (b.birdId || '') + '|' + (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_breedsRaw]);

  if (birds.length === 0) {
    return (
      <PageContainer>
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="اول باید پرنده بسازید"
          desc="نژاد به پرنده متصل می‌شود. اول به تب «پرنده‌ها» بروید و یک پرنده بسازید."
        />
      </PageContainer>
    );
  }

  const openNew = () => {
    setForm({ id:'', birdId: birds[0].id, name:'', fcr:'' });
    setErr(''); setOpen(true);
  };

  const openEdit = (b: Breed) => {
    setForm({ id: b.id, birdId: b.birdId, name: b.name, fcr: b.fcr ? toFa(b.fcr) : '' });
    setErr(''); setOpen(true);
  };

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری نژاد
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = breeds.find((x: any) => x.birdId === form.birdId && x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `نژادای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام نژاد اجباری است'); return; }
    const payload = {
      birdId: form.birdId,
      name: form.name.trim(),
      fcr: form.fcr ? parseFloat(toEn(form.fcr).replace('٫','.')) || null : null
    };
    if (form.id) updateBreed(form.id, payload); else addBreed(payload);
    setOpen(false);
  };

  const list = filterBird ? breeds.filter(x => x.birdId === filterBird) : breeds;
  const target = delId ? breeds.find(b => b.id === delId) : null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterBird('')} style={chip(!filterBird)}>همه</button>
        {_birdsUnique.map(b => (
          <button key={b.id} onClick={() => setFilterBird(b.id)} style={chip(filterBird === b.id)}>{b.name}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="نژادی ثبت نشده"
          desc="برای هر پرنده می‌توانید چند نژاد بسازید — مثلاً لگهورن، بلاک استار."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن نژاد</Btn>}
        />
      ) : (
        <>
          {list.map((b, i) => {
            const bird = birds.find(x => x.id === b.birdId);
            const isOpen = expandedId === b.id;
            return (
              <ExpandableCard
                key={b.id}
                accent="purple"
                index={toFa(i + 1)}
                iconEmoji="🧬"
                title={b.name}
                subtitle={`پرنده: ${bird?.name || '—'}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                badge={b.fcr ? <Tag tone="purple">FCR {toFa(b.fcr)}</Tag> : undefined}
                stats={<>
                  <span>پرنده: <b style={{ color: 'var(--text)' }}>{bird?.name || '—'}</b></span>
                  {b.fcr && <span>FCR: <b style={{ color: 'var(--text)' }}>{toFa(b.fcr)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🧬 مشخصات نژاد</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام نژاد:</span>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>پرنده:</span>
                    <span style={{ fontWeight: 600 }}>{bird?.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>FCR:</span>
                    <span style={{ fontWeight: 600 }}>{b.fcr ? toFa(b.fcr) : '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(b)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(b.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن نژاد</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش نژاد' : 'افزودن نژاد'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="پرنده" required hint="نژاد به این پرنده متصل می‌شود">
<SmartSelect
              value={form.birdId}
              onChange={v => setForm(f => ({ ...f, birdId: v }))}
              options={birds.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (b => b.nameEn || undefined)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب پرنده"
              autoThreshold={6}
            />
        </Field>
        <Grid2>
          <Field label="نام نژاد" required>
            <Input placeholder="مثلاً: مرندی" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="FCR">
            <NumField placeholder="۲٫۰" value={form.fcr} onChange={e => setForm({ ...form, fcr: e.target.value })} min={0} unit="FCR" />
          </Field>
        </Grid2>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف نژاد"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteBreed(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          آیا از حذف <b>{target?.name}</b> مطمئن هستید؟
        </div>
      </Modal>
    </PageContainer>
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
