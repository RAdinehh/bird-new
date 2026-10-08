import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { createContactSchema } from '../../shr/validation/rules/ctc';
import { useSwipeTabs } from '../../shr/hooks/useSwipeTabs';
import ContactFormModal from './components/ContactFormModal';
import { useCtc, type Person, type Role, ROLE_LABEL, CUSTOMER_TYPES, SUPPLIER_TYPES, SALARY_TYPES, avatarLetter } from './store';
import { Btn, BtnRow, DigitField, Empty,
  Field, Grid2, Grid3, Input,
  Modal, NumField, PageContainer, PhoneField,
  Select, Tag, ErrorBox , MoneyField , Textarea } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getCtcContactsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

interface F {
  id?: string; name: string; phone: string; phone2: string; email: string;
  address: string; city: string; nationalId: string; roles: Role[]; notes: string;
  customerType: string;
  customerTypes: string[]; trustScore: string; defaultDiscount: string;
  supplierTypes: string[]; position: string; startDate: string; salaryType: string; salaryAmount: string; insurance: boolean;
}
const empty: F = {
  name:'', phone:'', phone2:'', email:'', address:'', city:'', nationalId:'', roles: ['customer'], notes: '',
  customerType:'wholesale', customerTypes: [], trustScore:'', defaultDiscount:'', supplierTypes: [],
  position:'', startDate:'', salaryType:'monthly', salaryAmount:'', insurance:false
};
type TabId = 'all' | 'customer' | 'supplier' | 'worker';

export default function ContactsPage() {
  const { contacts, add, update, remove } = useCtc();
  const [tab, setTab] = useState<TabId>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const swipeRef = useSwipeTabs(['all', 'customer', 'supplier', 'worker'], tab, (id) => setTab(id as TabId));

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };
  const openEdit = (p: Person) => {
    setForm({
      id: p.id, name: p.name, phone: p.phone, phone2: p.phone2, email: p.email,
      address: p.address, city: p.city, nationalId: p.nationalId, roles: p.roles, notes: p.notes,
      customerType: p.customerType ||
        'wholesale', customerTypes: p.customerTypes ||
        (p.customerType ? [p.customerType] : []), trustScore: p.trustScore ? toFa(p.trustScore) : '', defaultDiscount: p.defaultDiscount ? toFa(p.defaultDiscount) : '',
      supplierTypes: p.supplierTypes || [], position: p.position, startDate: p.startDate,
      salaryType: p.salaryType || 'monthly', salaryAmount: p.salaryAmount ? toFa(p.salaryAmount) : '', insurance: p.insurance
    });
    setErr(''); setOpen(true);
  };
  useFab({ label: 'افزودن مخاطب', onClick: openNew });
  const toggleSupType = (t: string) => setForm(f => ({ ...f, supplierTypes: f.supplierTypes.includes(t) ? f.supplierTypes.filter(x => x !== t) : [...f.supplierTypes, t] }));
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const save = async () => {
    if (!form.name.trim()) { setErr('نام اجباری است'); return; }
    if (form.roles.length === 0) { setErr('حداقل یک نقش انتخاب کنید'); return; }

    // === چک تکراری (فقط برای جدید) ===
    if (!form.id) {
      const trimmedName = form.name.trim();
      const trimmedPhone = form.phone.trim();

      const nameDup = contacts.find(c => c.name.trim() === trimmedName);
      const phoneDup = trimmedPhone
        ? contacts.find(c => c.phone.trim() === trimmedPhone)
        : null;

      if (nameDup && phoneDup && nameDup.id === phoneDup.id) {
        const ok = await showConfirmAsync(
          `شخصی با همین نام و شماره تلفن قبلاً ثبت شده («${nameDup.name}»). باز هم اضافه شود؟`,
          '⚠️ تکرار کامل'
        );
        if (!ok) return;
      } else if (nameDup) {
        const ok = await showConfirmAsync(
          `شخصی با نام «${nameDup.name}» قبلاً ثبت شده. باز هم اضافه شود؟`,
          '⚠️ نام تکراری'
        );
        if (!ok) return;
      } else if (phoneDup) {
        const ok = await showConfirmAsync(
          `شخصی با این شماره تلفن قبلاً ثبت شده («${phoneDup.name}»). باز هم اضافه شود؟`,
          '⚠️ تلفن تکراری'
        );
        if (!ok) return;
      }
    }

    const data: Omit<Person, 'id'|'createdAt'|'updatedAt'> = {
      name: form.name.trim(), phone: form.phone.trim(), phone2: form.phone2.trim(), email: form.email.trim(),
      address: form.address.trim(), city: form.city.trim(), nationalId: form.nationalId.trim(),
      roles: form.roles, notes: form.notes.trim(), customerType: form.customerTypes[0] || '',
      customerTypes: form.customerTypes,
      trustScore: form.trustScore ? parseInt(toEn(form.trustScore)) || null : null,
      defaultDiscount: num(form.defaultDiscount), supplierTypes: form.supplierTypes,
      position: form.position.trim(), startDate: form.startDate.trim(), salaryType: form.salaryType,
      salaryAmount: num(form.salaryAmount), insurance: form.insurance
    };
    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  // مرحله ۱: tab (نگه‌داشته شده)
  const tabFiltered = useMemo(() => {
    let arr = contacts;
    if (tab !== 'all') arr = arr.filter(c => c.roles.includes(tab as Role));
    return arr;
  }, [contacts, tab]);

  // مرحله ۲: FilterBar (فیلتر عمیق)
  const config = useMemo(() => getCtcContactsConfig(), []);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Person>({
    items: tabFiltered,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (p: any) => p.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' مخاطب حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = contacts.find(c => c.id === id);
        if (!item) continue;
        backups.push(item);
        try { remove(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'مخاطب')
    },
  });


  // وقتی وارد حالت انتخاب می‌شیم، کارت‌ها بسته بشن
  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);
  const tabCount = (t: TabId) => t === 'all' ? contacts.length : contacts.filter(c => c.roles.includes(t as Role)).length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'همه' }, { id: 'customer', label: 'مشتریان' },
    { id: 'supplier', label: 'فروشندگان' }, { id: 'worker', label: 'کارگران' }
  ];

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      add(item.item);
      toastMsg.restored('مخاطب')
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق')
    }
    setUndoData(null);
  };

  return (
    <div ref={swipeRef} style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
         padding: '0 12px', background: 'var(--header-bg)', position: 'sticky',
         top: 52, zIndex: 11, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 12px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            {t.label}
            <span style={{ fontSize: 12, background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)',
               color: tab === t.id ? 'var(--accent)' : 'var(--muted)', padding: '1px 5px',
               borderRadius: 8, fontWeight: 700 }}>{toFa(tabCount(t.id))}</span>
            {tab === t.id && <div style={{ position: 'absolute', bottom: 0,
               right: 12, left: 12, height: 3, background: 'var(--accent)',
               borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>

      <PageContainer>
      <HelpBanner
        id="ctc-intro"
        icon="👥"
        title="مخاطبین"
        description="مشتریان، تأمین‌کنندگان و کارگران را اینجا ثبت کنید. هر مخاطب می‌تواند نقش‌های مختلف داشته باشد. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />
      {undoData && (
        <UndoBar
          label="مخاطب حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

        {!ms.selectionMode && list.length > 1 && (
          <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
            برای انتخاب چندتایی، روی یک کارت نگه دارید
          </div>
        )}

        {ms.selectionMode && list.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              type="button"
              onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
              style={{
                padding: '4px 10px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--muted)',
                fontFamily: 'inherit',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
            title={hasActiveFilters ? 'نتیجه‌ای پیدا نشد' : 'هنوز مخاطبی ثبت نشده'}
            desc={hasActiveFilters ? 'فیلترها را تغییر دهید یا پاک کنید.' : 'اولین مخاطب خود را بسازید.'}
            action={!hasActiveFilters ? <Btn variant="primary" onClick={openNew}>+ افزودن مخاطب</Btn> : undefined} />
        ) : (
          <>
            {list.map((p, i) => {
              const primaryRole: Role = p.roles.includes('supplier') ? 'supplier' : p.roles.includes('worker') ? 'worker' : 'customer';
              const accent = primaryRole === 'worker' ? 'purple' : primaryRole === 'supplier' ? 'accent' : 'info';
              const isOpen = !ms.selectionMode && expandedId === p.id;
              return (
                <ExpandableCard key={p.id} id={p.id} ms={ms} accent={accent as any} index={toFa(i + 1)}
                  iconEmoji={avatarLetter(p.name)}
                  title={p.name}
                  subtitle={`${p.phone || '—'}${p.city ? ` · ${p.city}` : ''}`}
                  isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : p.id)}
                  badge={<div style={{ display: 'flex', gap: 3 }}>
                    {p.roles.map(r => <Tag key={r} tone={(r === 'customer' ? 'blue' : r === 'supplier' ? 'green' : 'purple') as any}>{ROLE_LABEL[r]}</Tag>)}
                  </div>}
                  stats={<>
                    {p.roles.includes('customer') && p.trustScore ? <span>اعتبار: <b style={{ color: 'var(--text)' }}>{toFa(p.trustScore)}/۱۰</b></span> : null}
                    {p.roles.includes('worker') && p.position ? <span>سمت: <b style={{ color: 'var(--text)' }}>{p.position}</b></span> : null}
                    {p.roles.includes('supplier') && p.supplierTypes.length > 0 ? <span>کالاها: <b style={{ color: 'var(--text)' }}>{toFa(p.supplierTypes.length)}</b></span> : null}
                  </>}
                >
                  <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📞 اطلاعات تماس</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Row l="تلفن اصلی" v={p.phone || '—'} />
                    {p.phone2 && <Row l="تلفن دوم" v={p.phone2} />}
                    {p.email && <Row l="ایمیل" v={p.email} />}
                    {p.nationalId && <Row l="کد ملی" v={p.nationalId} />}
                  </div>

                  {(p.city || p.address) && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
                      <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                         background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
                         lineHeight: 1.7 }}>
                        {p.city && <div>{p.city}</div>}
                        {p.address && <div style={{ color: 'var(--muted)' }}>{p.address}</div>}
                      </div>
                    </>
                  )}

                  {p.roles.includes('customer') && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🛒 اطلاعات مشتری</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Row l="نوع" v={CUSTOMER_TYPES.find(x => x[0] === p.customerType)?.[1] || '—'} />
                        {p.trustScore && <Row l="اعتبار" v={`${toFa(p.trustScore)} از ۱۰`} />}
                        {p.defaultDiscount && <Row l="تخفیف پیش‌فرض" v={`${toFa(p.defaultDiscount)}٪`} />}
                      </div>
                    </>
                  )}

                  {p.roles.includes('supplier') && p.supplierTypes.length > 0 && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> کالاهای فروشنده</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.supplierTypes.map(t => (
                          <span key={t} style={{ padding: '4px 10px', background: 'var(--accent-soft)',
                             color: 'var(--accent)', borderRadius: 6, fontSize: 'var(--fs-xs)',
                             fontWeight: 600 }}>
                            {SUPPLIER_TYPES.find(x => x[0] === t)?.[1] || t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {p.roles.includes('worker') && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>👷 اطلاعات کارگر</div>
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
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                      <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                         padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                         borderRadius: 'var(--r-sm)' }}>{p.notes}</div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                    <Btn size="sm" onClick={() => openEdit(p)} style={{ flex: 1 }}>ویرایش</Btn>
                    <Btn size="sm" onClick={async () => {
                          const ok = await showConfirmAsync('تأیید حذف', 'این مخاطب حذف شود؟', { danger: true });
                          if (!ok) return;
                          setUndoData({ item: p });
                          setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === p.id ? null : cur), 6000);
                          remove(p.id);
                          logAction('delete', 'ctc', 'حذف از مخاطبین');
                          toastMsg.deleted('مخاطب')
                        }} style={{ flex: 1 }}>حذف</Btn>
                  </div>
                </ExpandableCard>
              );
            })}
          </>
        )}

        {/* نوار شناور */}
      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {/* فاصله زیر نوار */}
      {ms.selectionMode && <div style={{ height: 90 }} />}

      <ContactFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        onSave={save}
      />
      </PageContainer>
    </div>
  );
}

function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
       padding: 'var(--pad-tight)', background: accent ? 'var(--accent-soft)' : 'var(--input-bg)',
       borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}

function DepBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--accent-soft)', border: '1px dashed var(--accent-border)',
       borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex',
       flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700,
         display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8,
         borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {title}
      </div>
      {children}
    </div>
  );
}
