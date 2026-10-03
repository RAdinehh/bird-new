import { useState, useMemo, useEffect } from 'react';
import { useBrd, type Breed } from './store';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { Btn, BtnRow, Empty, Field,
  Grid2, Input, Modal, NumField,
  PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';


/** پیدا کردن کلید استاندارد از اسم نژاد (match نرم) */
function findStandardKey(name: string): string | undefined {
  const clean = name.trim();
  if (!clean) return undefined;
  // match دقیق با nameFa
  for (const [key, std] of Object.entries(DEFAULT_STANDARDS)) {
    if (std.nameFa === clean) return key;
  }
  // match دقیق با nameEn
  for (const [key, std] of Object.entries(DEFAULT_STANDARDS)) {
    if (std.nameEn && std.nameEn.toLowerCase() === clean.toLowerCase()) return key;
  }
  // match جزئی
  for (const [key, std] of Object.entries(DEFAULT_STANDARDS)) {
    if (clean.includes(std.nameFa) || std.nameFa.includes(clean)) return key;
    if (std.nameEn && (clean.toLowerCase().includes(std.nameEn.toLowerCase()) || std.nameEn.toLowerCase().includes(clean.toLowerCase()))) return key;
  }
  return undefined;
}

export default function BreedsPage() {
  const { birds, breeds: _breedsRaw, dedupeBreeds, addBreed, updateBreed, deleteBreed } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', birdId:'', name:'', fcr:'', standardKey:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
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
  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addBreed(item.item);
      showToast('نژاد بازگردانی شد', 'success', 2000);
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
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="اول باید پرنده بسازید"
          desc="نژاد به پرنده متصل می‌شود. اول به تب «پرنده‌ها» بروید و یک پرنده بسازید."
        />
      </PageContainer>
    );
  }

  const openNew = () => {
    setForm({ id:'', birdId: birds[0].id, name:'', fcr:'', standardKey:'' });
    setErr(''); setOpen(true);
  };

  const openEdit = (b: Breed) => {
    setForm({ id: b.id, birdId: b.birdId, name: b.name, fcr: b.fcr ? toFa(b.fcr) : '', standardKey: (b as any).standardKey || '' });
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
                subtitle={`پرنده — ${bird?.name || '—'}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                badge={b.fcr ? <Tag tone="purple">FCR {toFa(b.fcr)}</Tag> : undefined}
                stats={<>
                  <span>پرنده: <b style={{ color: 'var(--text)' }}>{bird?.name || '—'}</b></span>
                  {b.fcr && <span>FCR: <b style={{ color: 'var(--text)' }}>{toFa(b.fcr)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> مشخصات نژاد</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام نژاد:</span>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>پرنده:</span>
                    <span style={{ fontWeight: 600 }}>{bird?.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
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
                subtitle: undefined,
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب پرنده"
              autoThreshold={6}
            />
        </Field>
        <Grid2>
          <Field label="نام نژاد" required>
            <Input placeholder="مثلاً — مرندی" value={form.name} onChange={e => {
                const newName = e.target.value;
                const matchedKey = findStandardKey(newName);
                setForm(f => ({
                  ...f,
                  name: newName,
                  standardKey: matchedKey || f.standardKey,
                  fcr: matchedKey && DEFAULT_STANDARDS[matchedKey]?.growth?.weightByAge?.[0]?.fcr
                    ? toFa(DEFAULT_STANDARDS[matchedKey].growth.weightByAge[0].fcr)
                    : f.fcr,
                }));
              }} />
          </Field>
          <Field label="FCR">
            <NumField placeholder="۲٫۰" value={form.fcr} onChange={e => setForm({ ...form, fcr: e.target.value })} min={0.5} max={5} unit="FCR" autoClamp />
          </Field>
        </Grid2>
        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف نژاد"
        footer={<BtnRow><Btn variant="danger" onClick={async () => { const idToDel = delId; if (!idToDel) return; const ok = await showConfirmAsync('تأیید حذف', 'این نژاد حذف شود؟', { danger: true }); if (!ok) return; const item = breeds.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteBreed(idToDel);
              logAction('delete', 'brd', 'حذف از پرنده و نژاد'); setDelId(null); showToast('نژاد حذف شد', 'info', 1800); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
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
