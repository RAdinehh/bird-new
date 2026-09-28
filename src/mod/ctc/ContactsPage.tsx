import { useState, useMemo } from 'react';
import { useCtc, type Person, type Role, ROLE_LABEL, CUSTOMER_TYPES, SUPPLIER_TYPES, SALARY_TYPES, avatarLetter } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';

interface F {
  id?: string; name: string; phone: string; phone2: string; email: string;
  address: string; city: string; nationalId: string; roles: Role[]; notes: string;
  customerType: string; trustScore: string; defaultDiscount: string;
  supplierTypes: string[]; position: string; startDate: string; salaryType: string; salaryAmount: string; insurance: boolean;
}
const empty: F = {
  name:'', phone:'', phone2:'', email:'', address:'', city:'', nationalId:'', roles: ['customer'], notes: '',
  customerType:'wholesale', trustScore:'', defaultDiscount:'', supplierTypes: [],
  position:'', startDate:'', salaryType:'monthly', salaryAmount:'', insurance:false
};
type TabId = 'all' | 'customer' | 'supplier' | 'worker';

export default function ContactsPage() {
  const { contacts, add, update, remove } = useCtc();
  const [tab, setTab] = useState<TabId>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };
  const openEdit = (p: Person) => {
    setForm({
      id: p.id, name: p.name, phone: p.phone, phone2: p.phone2, email: p.email,
      address: p.address, city: p.city, nationalId: p.nationalId, roles: p.roles, notes: p.notes,
      customerType: p.customerType || 'wholesale', trustScore: p.trustScore ? toFa(p.trustScore) : '', defaultDiscount: p.defaultDiscount ? toFa(p.defaultDiscount) : '',
      supplierTypes: p.supplierTypes || [], position: p.position, startDate: p.startDate,
      salaryType: p.salaryType || 'monthly', salaryAmount: p.salaryAmount ? toFa(p.salaryAmount) : '', insurance: p.insurance
    });
    setErr(''); setOpen(true);
  };
  const toggleRole = (r: Role) => setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }));
  const toggleSupType = (t: string) => setForm(f => ({ ...f, supplierTypes: f.supplierTypes.includes(t) ? f.supplierTypes.filter(x => x !== t) : [...f.supplierTypes, t] }));
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const save = () => {
    if (!form.name.trim()) { setErr('نام اجباری است'); return; }
    if (form.roles.length === 0) { setErr('حداقل یک نقش انتخاب کنید'); return; }
    const data: Omit<Person, 'id'|'createdAt'|'updatedAt'> = {
      name: form.name.trim(), phone: form.phone.trim(), phone2: form.phone2.trim(), email: form.email.trim(),
      address: form.address.trim(), city: form.city.trim(), nationalId: form.nationalId.trim(),
      roles: form.roles, notes: form.notes.trim(), customerType: form.customerType,
      trustScore: form.trustScore ? parseInt(toEn(form.trustScore)) || null : null,
      defaultDiscount: num(form.defaultDiscount), supplierTypes: form.supplierTypes,
      position: form.position.trim(), startDate: form.startDate.trim(), salaryType: form.salaryType,
      salaryAmount: num(form.salaryAmount), insurance: form.insurance
    };
    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  const list = useMemo(() => {
    let arr = contacts;
    if (tab !== 'all') arr = arr.filter(c => c.roles.includes(tab as Role));
    if (q.trim()) {
      const t = q.trim();
      arr = arr.filter(c => c.name.includes(t) || c.phone.includes(t) || c.city.includes(t) || c.address.includes(t));
    }
    return arr;
  }, [contacts, tab, q]);

  const target = delId ? contacts.find(c => c.id === delId) : null;
  const tabCount = (t: TabId) => t === 'all' ? contacts.length : contacts.filter(c => c.roles.includes(t as Role)).length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'همه' }, { id: 'customer', label: 'مشتریان' },
    { id: 'supplier', label: 'فروشندگان' }, { id: 'worker', label: 'کارگران' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 12px', background: 'var(--header-bg)', position: 'sticky', top: 52, zIndex: 11, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 12px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            {t.label}
            <span style={{ fontSize: 10, background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)', color: tab === t.id ? 'var(--accent)' : 'var(--muted)', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>{toFa(tabCount(t.id))}</span>
            {tab === t.id && <div style={{ position: 'absolute', bottom: 0, right: 12, left: 12, height: 2.5, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>

      <PageContainer>
        <div style={{ height: 38, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجو..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', minWidth: 0 }} />
        </div>

        {list.length === 0 ? (
          <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>}
            title={q ? 'نتیجه‌ای یافت نشد' : 'هنوز مخاطبی ثبت نشده'} desc={q ? 'عبارت دیگری امتحان کنید' : 'اولین مخاطب خود را بسازید.'}
            action={!q ? <Btn variant="primary" onClick={openNew}>+ افزودن مخاطب</Btn> : undefined} />
        ) : (
          <>
            {list.map((p, i) => {
              const primaryRole: Role = p.roles.includes('supplier') ? 'supplier' : p.roles.includes('worker') ? 'worker' : 'customer';
              const accent = primaryRole === 'worker' ? 'purple' : primaryRole === 'supplier' ? 'accent' : 'info';
              const isOpen = expandedId === p.id;
              return (
                <ExpandableCard key={p.id} accent={accent as any} index={toFa(i + 1)}
                  iconEmoji={avatarLetter(p.name)}
                  title={p.name}
                  subtitle={`${p.phone || '—'}${p.city ? ` · ${p.city}` : ''}`}
                  isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : p.id)}
                  badge={<div style={{ display: 'flex', gap: 3 }}>
                    {p.roles.map(r => <Tag key={r} tone={(r === 'customer' ? 'blue' : r === 'supplier' ? 'green' : 'purple') as any}>{ROLE_LABEL[r]}</Tag>)}
                  </div>}
                  summary={<>
                    {p.roles.includes('customer') && p.trustScore ? <span>اعتبار: <b style={{ color: 'var(--text)' }}>{toFa(p.trustScore)}/۱۰</b></span> : null}
                    {p.roles.includes('worker') && p.position ? <span>سمت: <b style={{ color: 'var(--text)' }}>{p.position}</b></span> : null}
                    {p.roles.includes('supplier') && p.supplierTypes.length > 0 ? <span>کالاها: <b style={{ color: 'var(--text)' }}>{toFa(p.supplierTypes.length)}</b></span> : null}
                  </>}
                >
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📞 اطلاعات تماس</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Row l="تلفن اصلی" v={p.phone || '—'} />
                    {p.phone2 && <Row l="تلفن دوم" v={p.phone2} />}
                    {p.email && <Row l="ایمیل" v={p.email} />}
                    {p.nationalId && <Row l="کد ملی" v={p.nationalId} />}
                  </div>

                  {(p.city || p.address) && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
                      <div style={{ fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', lineHeight: 1.7 }}>
                        {p.city && <div>{p.city}</div>}
                        {p.address && <div style={{ color: 'var(--muted)' }}>{p.address}</div>}
                      </div>
                    </>
                  )}

                  {p.roles.includes('customer') && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🛒 اطلاعات مشتری</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Row l="نوع" v={CUSTOMER_TYPES.find(x => x[0] === p.customerType)?.[1] || '—'} />
                        {p.trustScore && <Row l="اعتبار" v={`${toFa(p.trustScore)} از ۱۰`} />}
                        {p.defaultDiscount && <Row l="تخفیف پیش‌فرض" v={`${toFa(p.defaultDiscount)}٪`} />}
                      </div>
                    </>
                  )}

                  {p.roles.includes('supplier') && p.supplierTypes.length > 0 && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📦 کالاهای فروشنده</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.supplierTypes.map(t => (
                          <span key={t} style={{ padding: '4px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 6, fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                            {SUPPLIER_TYPES.find(x => x[0] === t)?.[1] || t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {p.roles.includes('worker') && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>👷 اطلاعات کارگر</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {p.position && <Row l="سمت" v={p.position} />}
                        {p.startDate && <Row l="تاریخ شروع" v={toFa(p.startDate)} />}
                        {p.salaryAmount && <Row l={`حقوق ${SALARY_TYPES.find(x => x[0] === p.salaryType)?.[1] || ''}`} v={`${toFa(p.salaryAmount.toLocaleString('fa-IR'))} ت`} />}
                        {p.insurance && <Row l="بیمه" v="دارد" accent />}
                      </div>
                    </>
                  )}

                  {p.notes && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                      <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{p.notes}</div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                    <Btn size="sm" onClick={() => openEdit(p)} style={{ flex: 1 }}>ویرایش</Btn>
                    <Btn size="sm" onClick={() => setDelId(p.id)} style={{ flex: 1 }}>حذف</Btn>
                  </div>
                </ExpandableCard>
              );
            })}
            <Btn variant="primary" full onClick={openNew}>+ افزودن مخاطب</Btn>
          </>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش مخاطب' : 'افزودن مخاطب'}
          footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
          <Field label="نقش‌ها" required hint="یک شخص می‌تواند چند نقش داشته باشد">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['customer', 'supplier', 'worker'] as Role[]).map(r => (
                <button key={r} onClick={() => toggleRole(r)} style={{
                  padding: '6px 12px', fontSize: 'var(--fs-sm)',
                  background: form.roles.includes(r) ? 'var(--accent-soft)' : 'var(--btn-bg)',
                  border: `1px solid ${form.roles.includes(r) ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)', color: form.roles.includes(r) ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: form.roles.includes(r) ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit'
                }}>{ROLE_LABEL[r]}</button>
              ))}
            </div>
          </Field>
          <Field label="نام" required><Input placeholder="..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Grid2>
            <Field label="تلفن اصلی"><Input placeholder="۰۹..." inputMode="tel" dir="ltr" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
            <Field label="تلفن دوم"><Input placeholder="۰۹..." inputMode="tel" dir="ltr" value={form.phone2} onChange={e => setForm({...form, phone2: e.target.value})} /></Field>
          </Grid2>
          <Grid2>
            <Field label="ایمیل"><Input placeholder="..." dir="ltr" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
            <Field label="کد ملی"><Input placeholder="..." inputMode="numeric" dir="ltr" value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})} /></Field>
          </Grid2>
          <Grid2>
            <Field label="شهر"><Input placeholder="..." value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></Field>
            <Field label="آدرس"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
          </Grid2>

          {form.roles.includes('customer') && (
            <DepBox title="اطلاعات مشتری">
              <Grid2>
                <Field label="نوع مشتری"><Select value={form.customerType} onChange={e => setForm({...form, customerType: e.target.value})}>{CUSTOMER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
                <Field label="امتیاز اعتبار"><Input placeholder="۵" inputMode="numeric" dir="ltr" value={form.trustScore} onChange={e => setForm({...form, trustScore: e.target.value})} /></Field>
              </Grid2>
              <Field label="تخفیف پیش‌فرض"><Input placeholder="۰" inputMode="numeric" dir="ltr" value={form.defaultDiscount} onChange={e => setForm({...form, defaultDiscount: e.target.value})} unit="٪" /></Field>
            </DepBox>
          )}

          {form.roles.includes('supplier') && (
            <DepBox title="اطلاعات فروشنده">
              <Field label="چه چیزی می‌فروشد؟" hint="چند مورد قابل انتخاب">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SUPPLIER_TYPES.map(([v, l]) => (
                    <button key={v} onClick={() => toggleSupType(v)} style={{
                      padding: '5px 10px', fontSize: 'var(--fs-sm)',
                      background: form.supplierTypes.includes(v) ? 'var(--accent-soft)' : 'var(--btn-bg)',
                      border: `1px solid ${form.supplierTypes.includes(v) ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-sm)', color: form.supplierTypes.includes(v) ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: form.supplierTypes.includes(v) ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit'
                    }}>{l}</button>
                  ))}
                </div>
              </Field>
            </DepBox>
          )}

          {form.roles.includes('worker') && (
            <DepBox title="اطلاعات کارگر">
              <Grid2>
                <Field label="سمت"><Input placeholder="مثلاً: کارگر عمومی" value={form.position} onChange={e => setForm({...form, position: e.target.value})} /></Field>
                <Field label="تاریخ شروع"><Input placeholder="۱۴۰۵/۰۷/۰۴" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></Field>
              </Grid2>
              <Grid2>
                <Field label="نوع حقوق"><Select value={form.salaryType} onChange={e => setForm({...form, salaryType: e.target.value})}>{SALARY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
                <Field label="مبلغ حقوق"><Input placeholder="۰" inputMode="numeric" dir="ltr" value={form.salaryAmount} onChange={e => setForm({...form, salaryAmount: e.target.value})} unit="ت" /></Field>
              </Grid2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>بیمه دارد</div>
                <button onClick={() => setForm({...form, insurance: !form.insurance})} style={{
                  width: 38, height: 22, borderRadius: 11,
                  background: form.insurance ? 'var(--accent)' : 'var(--dim)',
                  position: 'relative', border: 'none', cursor: 'pointer', padding: 0
                }}>
                  <span style={{ position: 'absolute', top: 2, right: form.insurance ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'right .2s' }} />
                </button>
              </div>
            </DepBox>
          )}

          <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
          {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
        </Modal>

        <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف مخاطب"
          footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) remove(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.name}</b>؟</div>
        </Modal>
      </PageContainer>
    </div>
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

function DepBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--accent-soft)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {title}
      </div>
      {children}
    </div>
  );
}
