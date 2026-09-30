/**
 * ZonesPage — بخش‌های سالن
 */
import { useState, useMemo } from 'react';
import { useHal, type Zone } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';
import { chip } from './helpers';

export default function ZonesPage() {
  const { halls: _hallsRaw, zones: _zonesRaw, addZone, updateZone, deleteZone } = useHal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', hallId:'', name:'', capacity:'', notes:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  const zones = useMemo(() => {
    const seen = new Set<string>();
    return _zonesRaw.filter(z => {
      const k = (z.hallId || '') + '|' + (z.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_zonesRaw]);

  if (halls.length === 0) {
    return (
      <PageContainer>
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
          title="اول یک سالن بسازید"
          desc="بخش، داخل سالن تعریف می‌شود. اول از تب «سالن‌ها» استفاده کنید."
        />
      </PageContainer>
    );
  }

  const openNew = () => { setForm({ id:'', hallId: halls[0].id, name:'', capacity:'', notes:'' }); setErr(''); setOpen(true); };
  const openEdit = (z: Zone) => { setForm({ id: z.id, hallId: z.hallId,
     name: z.name, capacity: z.capacity ? toFa(z.capacity) : '', notes: z.notes }); setErr(''); setOpen(true); };

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری بخش
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = zones.find((x: any) => x.hallId === form.hallId && x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `بخشای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام بخش اجباری است'); return; }
    const data = { hallId: form.hallId, name: form.name.trim(), capacity: form.capacity ? parseInt(toEn(form.capacity)) || null : null,
       notes: form.notes.trim() };
    if (form.id) updateZone(form.id, data); else addZone(data);
    setOpen(false);
  };

  const list = filter ? zones.filter(z => z.hallId === filter) : zones;
  const target = delId ? zones.find(z => z.id === delId) : null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilter('')} style={chip(!filter)}>همه</button>
        {halls.map(h => (
          <button key={h.id} onClick={() => setFilter(h.id)} style={chip(filter === h.id)}>{h.name}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>}
          title="بخشی ثبت نشده"
          desc="بخش، داخل سالن ساخته می‌شود — برای تفکیک انواع پرنده یا نژاد."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن بخش</Btn>}
        />
      ) : (
        <>
          {list.map((z, i) => {
            const hall = halls.find(h => h.id === z.hallId);
            const isOpen = expandedId === z.id;
            return (
              <ExpandableCard
                key={z.id}
                accent="purple"
                index={toFa(i + 1)}
                iconEmoji="🗂"
                title={z.name}
                subtitle={hall?.name || '—'}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : z.id)}
                badge={z.capacity ? <Tag tone="purple">{toFa(z.capacity)} پرنده</Tag> : undefined}
                stats={<>
                  <span>سالن: <b style={{ color: 'var(--text)' }}>{hall?.name || '—'}</b></span>
                  {z.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{toFa(z.capacity)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🗂 مشخصات بخش</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام بخش:</span>
                    <span style={{ fontWeight: 600 }}>{z.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>سالن:</span>
                    <span style={{ fontWeight: 600 }}>{hall?.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>ظرفیت:</span>
                    <span style={{ fontWeight: 600 }}>{z.capacity ? `${toFa(z.capacity)} پرنده` : '—'}</span>
                  </div>
                </div>
                {z.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{z.notes}</div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(z)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(z.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن بخش</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش بخش' : 'افزودن بخش'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="سالن" required>
<SmartSelect
              value={form.hallId}
              onChange={v => setForm(f => ({ ...f, hallId: v }))}
              options={halls.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (h => h.name)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب سالن"
              autoThreshold={6}
            />
        </Field>
        <Grid2>
          <Field label="نام بخش" required><Input placeholder="مثلاً — بخش A" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="ظرفیت"><NumField placeholder="۰" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} unit="پرنده" min={0} /></Field>
        </Grid2>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف بخش"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteZone(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.name}</b>؟</div>
      </Modal>
    </PageContainer>
  );
}
