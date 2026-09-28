import { useState } from 'react';
import { useHal, type Equipment, EQUIP_LABELS } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';

export default function EquipmentPage() {
  const { halls, equipment, addEquip, updateEquip, deleteEquip } = useHal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', hallId:'', type:'lamp', name:'', count:'', unitPrice:'', purchasedAt:'', warranty:'', notes:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (halls.length === 0) {
    return (
      <PageContainer>
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>}
          title="اول یک سالن بسازید"
          desc="تجهیزات داخل سالن قرار می‌گیرند. اول از تب «سالن‌ها» استفاده کنید."
        />
      </PageContainer>
    );
  }

  const openNew = () => { setForm({ id:'', hallId: halls[0].id, type:'lamp', name:'', count:'', unitPrice:'', purchasedAt:'', warranty:'', notes:'' }); setErr(''); setOpen(true); };
  const openEdit = (e: Equipment) => {
    setForm({ id: e.id, hallId: e.hallId, type: e.type, name: e.name, count: e.count ? toFa(e.count) : '', unitPrice: e.unitPrice ? toFa(e.unitPrice) : '', purchasedAt: e.purchasedAt, warranty: e.warranty ? toFa(e.warranty) : '', notes: e.notes });
    setErr(''); setOpen(true);
  };

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری تجهیزات
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = equipment.find((x: any) => x.hallId === form.hallId && x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `تجهیزاتای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    const data = {
      hallId: form.hallId, type: form.type, name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim()
    };
    if (form.id) updateEquip(form.id, data); else addEquip(data);
    setOpen(false);
  };

  const list = filter ? equipment.filter(e => e.hallId === filter) : equipment;
  const target = delId ? equipment.find(e => e.id === delId) : null;
  const totalValue = list.reduce((acc, e) => acc + ((e.count || 0) * (e.unitPrice || 0)), 0);

  return (
    <PageContainer>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilter('')} style={chip(!filter)}>همه</button>
        {halls.map(h => (
          <button key={h.id} onClick={() => setFilter(h.id)} style={chip(filter === h.id)}>{h.name}</button>
        ))}
      </div>

      {list.length > 0 && (
        <div style={{
          padding: '10px 14px', background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-base)', color: 'var(--accent)', fontWeight: 600,
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>ارزش کل تجهیزات:</span>
          <span>{toFa(totalValue.toLocaleString('fa-IR'))} تومان</span>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
          title="تجهیزی ثبت نشده"
          desc="لامپ، فن، هیتر، آبخوری، دانخوری، دوربین و سنسور را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن تجهیز</Btn>}
        />
      ) : (
        <>
          {list.map((e, i) => {
            const hall = halls.find(h => h.id === e.hallId);
            const meta = EQUIP_LABELS[e.type] || { name: 'سایر', icon: '🔧' };
            const value = (e.count || 0) * (e.unitPrice || 0);
            const isOpen = expandedId === e.id;
            return (
              <ExpandableCard
                key={e.id}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji={meta.icon}
                title={e.name}
                subtitle={`${meta.name} · ${hall?.name || '—'}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : e.id)}
                badge={e.count ? <Tag tone="blue">{toFa(e.count)} عدد</Tag> : undefined}
                summary={<>
                  {e.count && <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(e.count)}</b></span>}
                  {value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(value.toLocaleString('fa-IR'))} ت</b></span>}
                  {e.warranty && <span>گارانتی: <b style={{ color: 'var(--text)' }}>{toFa(e.warranty)} ماه</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🔧 مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نوع:</span>
                    <span style={{ fontWeight: 600 }}>{meta.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>سالن:</span>
                    <span style={{ fontWeight: 600 }}>{hall?.name || '—'}</span>
                  </div>
                  {e.count && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>تعداد:</span>
                      <span style={{ fontWeight: 600 }}>{toFa(e.count)} عدد</span>
                    </div>
                  )}
                </div>

                {(e.unitPrice || value > 0 || e.purchasedAt || e.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>💰 مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.unitPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>قیمت واحد:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.unitPrice.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                      {value > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>ارزش کل:</span>
                          <span>{toFa(value.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                      {e.purchasedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>تاریخ خرید:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.purchasedAt)}</span>
                        </div>
                      )}
                      {e.warranty && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>گارانتی:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.warranty)} ماه</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(e)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(e.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن تجهیز</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش تجهیز' : 'افزودن تجهیز'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Grid2>
          <Field label="نوع" required>
            <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {Object.entries(EQUIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
            </Select>
          </Field>
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
        </Grid2>
        <Field label="نام تجهیز" required>
          <Input placeholder="مثلاً: لامپ LED سقفی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </Field>
        <Grid3>
          <Field label="تعداد"><Input placeholder="۰" inputMode="numeric" dir="ltr" value={form.count} onChange={e => setForm({...form, count: e.target.value})} unit="عدد" /></Field>
          <Field label="قیمت واحد"><Input placeholder="۰" inputMode="numeric" dir="ltr" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} unit="ت" /></Field>
          <Field label="گارانتی"><Input placeholder="۶" inputMode="numeric" dir="ltr" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" /></Field>
        </Grid3>
        <Field label="تاریخ خرید"><Input placeholder="۱۴۰۵/۰۷/۰۴" value={form.purchasedAt} onChange={e => setForm({...form, purchasedAt: e.target.value})} /></Field>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف تجهیز"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteEquip(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.name}</b>؟</div>
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
