/**
 * ContactsPage — مخاطبین (carousel tabs مثل hal)
 */
import { useState } from 'react';
import { useCtc, type Person, type Role, CUSTOMER_TYPES } from './store';
import { useCarousel } from '../../shr/hooks/useCarousel';
import { toFa, toEn } from '../../shr/utils/fa';
import { showConfirmAsync } from '../../cor/store/dialog';
import ContactFormModal from './components/ContactFormModal';
import ContactTabPanel from './components/ContactTabPanel';

interface F {
  id?: string; name: string; phone: string; phone2: string; email: string;
  address: string; city: string; nationalId: string; roles: Role[]; notes: string;
  customerType: string;
  customerTypes: string[]; trustScore: string; defaultDiscount: string;
  supplierTypes: string[]; position: string; startDate: string; salaryType: string; salaryAmount: string; insurance: boolean;
}

const empty: F = {
  name: '', phone: '', phone2: '', email: '', address: '', city: '', nationalId: '', roles: ['customer'], notes: '',
  customerType: 'wholesale', customerTypes: [], trustScore: '', defaultDiscount: '', supplierTypes: [],
  position: '', startDate: '', salaryType: 'monthly', salaryAmount: '', insurance: false,
};

type TabId = 'all' | 'customer' | 'supplier' | 'worker';

export default function ContactsPage() {
  const { contacts, add, update } = useCtc();
  const [tab, setTab] = useState<TabId>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };

  const openEdit = (p: Person) => {
    setForm({
      id: p.id, name: p.name, phone: p.phone, phone2: p.phone2, email: p.email,
      address: p.address, city: p.city, nationalId: p.nationalId, roles: p.roles, notes: p.notes,
      customerType: p.customerType || 'wholesale',
      customerTypes: p.customerTypes || (p.customerType ? [p.customerType] : []),
      trustScore: p.trustScore ? toFa(p.trustScore) : '',
      defaultDiscount: p.defaultDiscount ? toFa(p.defaultDiscount) : '',
      supplierTypes: p.supplierTypes || [],
      position: p.position, startDate: p.startDate,
      salaryType: p.salaryType || 'monthly',
      salaryAmount: p.salaryAmount ? toFa(p.salaryAmount) : '',
      insurance: p.insurance,
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;

  const save = async () => {
    if (!form.name.trim()) { setErr('نام اجباری است'); return; }
    if (form.roles.length === 0) { setErr('حداقل یک نقش انتخاب کنید'); return; }

    if (!form.id) {
      const trimmedName = form.name.trim();
      const trimmedPhone = form.phone.trim();
      const nameDup = contacts.find(c => c.name.trim() === trimmedName);
      const phoneDup = trimmedPhone ? contacts.find(c => c.phone.trim() === trimmedPhone) : null;

      if (nameDup && phoneDup && nameDup.id === phoneDup.id) {
        const ok = await showConfirmAsync(
          `شخصی با همین نام و شماره تلفن قبلاً ثبت شده («${nameDup.name}»). باز هم اضافه شود؟`,
          '⚠️ تکرار کامل',
        );
        if (!ok) return;
      } else if (nameDup) {
        const ok = await showConfirmAsync(
          `شخصی با نام «${nameDup.name}» قبلاً ثبت شده. باز هم اضافه شود؟`,
          '⚠️ نام تکراری',
        );
        if (!ok) return;
      } else if (phoneDup) {
        const ok = await showConfirmAsync(
          `شخصی با این شماره تلفن قبلاً ثبت شده («${phoneDup.name}»). باز هم اضافه شود؟`,
          '⚠️ تلفن تکراری',
        );
        if (!ok) return;
      }
    }

    const data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
      name: form.name.trim(), phone: form.phone.trim(), phone2: form.phone2.trim(), email: form.email.trim(),
      address: form.address.trim(), city: form.city.trim(), nationalId: form.nationalId.trim(),
      roles: form.roles, notes: form.notes.trim(), customerType: form.customerTypes[0] || '',
      customerTypes: form.customerTypes,
      trustScore: form.trustScore ? parseInt(toEn(form.trustScore)) || null : null,
      defaultDiscount: num(form.defaultDiscount), supplierTypes: form.supplierTypes,
      position: form.position.trim(), startDate: form.startDate.trim(), salaryType: form.salaryType,
      salaryAmount: num(form.salaryAmount), insurance: form.insurance,
    };
    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  const tabIds: TabId[] = ['all', 'customer', 'supplier', 'worker'];
  const { containerRef, trackRef, setInstant } = useCarousel(
    tabIds,
    tab,
    (id) => setTab(id as TabId),
  );

  const tabCount = (t: TabId) => t === 'all' ? contacts.length : contacts.filter(c => c.roles.includes(t as Role)).length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'همه' },
    { id: 'customer', label: 'مشتریان' },
    { id: 'supplier', label: 'فروشندگان' },
    { id: 'worker', label: 'کارگران' },
  ];

  return (
    <div>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)', position: 'sticky',
        top: 52, zIndex: 11, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => { setInstant(); setTab(t.id); }}
            style={{
              padding: '11px 12px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 12,
              background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)',
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              padding: '1px 5px',
              borderRadius: 8,
              fontWeight: 700,
            }}>{toFa(tabCount(t.id))}</span>
            {tab === t.id && (
              <div style={{
                position: 'absolute', bottom: 0,
                right: 12, left: 12, height: 3,
                background: 'var(--accent)',
                borderRadius: '3px 3px 0 0',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          isolation: 'isolate',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            direction: 'ltr',
            willChange: 'transform',
            touchAction: 'pan-y',
            width: '100%',
            minWidth: 0,
          }}
        >
          {tabIds.map(id => (
            <div
              key={id}
              style={{
                flex: '0 0 100%',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                direction: 'rtl',
                overflow: 'hidden',
                boxSizing: 'border-box',
                isolation: 'isolate',
              }}
            >
              <ContactTabPanel
                tab={id}
                active={tab === id}
                onEdit={openEdit}
                onAdd={openNew}
              />
            </div>
          ))}
        </div>
      </div>

      <ContactFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        onSave={save}
      />
    </div>
  );
}
