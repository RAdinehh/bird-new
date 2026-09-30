import { useState, useMemo } from 'react';
import { useWhs, UNIT_LABEL, MOVEMENT_REASON, CATEGORY_ICON, CATEGORY_LABEL, type Movement, type MovementType, type MovementReason } from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import SmartSelect from '../../shr/components/SmartSelect';
import HelpBanner from '../../shr/components/HelpBanner';
import { useNavigate } from 'react-router-dom';
import { Row, SectionTitle, chip } from './helpers';

interface F {
  id?: string;
  itemId: string;
  type: MovementType;
  quantity: string;
  unitPrice: string;
  reason: MovementReason;
  date: string;
  partyId: string;
  notes: string;
}

export default function MovesPage() {
  const navigate = useNavigate();
  const { items, movements, addMovement, deleteMovement } = useWhs();
  const { contacts } = useCtc();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>({
    itemId: '', type: 'in', quantity: '', unitPrice: '',
    reason: 'purchase', date: '', partyId: '', notes: ''
  });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MovementType | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = [...movements];
    if (filterType) arr = arr.filter(m => m.type === filterType);
    return arr.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
  }, [movements, filterType]);

  const openNew = () => {
    if (items.length === 0) { showAlert('اول یک قلم در انبار بسازید'); return; }
    setForm({
      itemId: items[0].id, type: 'in', quantity: '', unitPrice: '',
      reason: 'purchase', date: '', partyId: '', notes: ''
    });
    setErr(''); setOpen(true);
  };

  const openEdit = (m: Movement) => {
    setForm({
      id: m.id, itemId: m.itemId, type: m.type,
      quantity: m.quantity ? toFa(m.quantity) : '',
      unitPrice: m.unitPrice ? toFa(m.unitPrice) : '',
      reason: m.reason, date: m.date,
      partyId: m.partyId || '', notes: m.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const selectedItem = items.find(i => i.id === form.itemId);
  const currentStock = selectedItem ? selectedItem.currentStock : 0;

  const save = () => {
    if ((form.reason === 'purchase' || form.reason === 'sale') && !form.partyId) {
      setErr(form.reason === 'purchase' ? 'فروشنده اجباری است' : 'مشتری اجباری است');
      return;
    }

    if (form.itemId === '') { setErr('کالا اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    const qty = num(form.quantity);
    if (qty <= 0) { setErr('تعداد باید بیشتر از صفر باشد'); return; }
    if (form.type === 'out' && qty > currentStock) {
      setErr(`موجودی (${toFa(currentStock)}) کافی نیست`);
      return;
    }

    const data = {
      itemId: form.itemId,
      type: form.type,
      quantity: qty,
      unitPrice: num(form.unitPrice),
      reason: form.reason,
      date: form.date.trim(),
      partyId: form.partyId,
      notes: form.notes.trim()
    };

    addMovement(data);
    setOpen(false);
  };

    // فیلتر مخاطبین بر اساس دلیل
  const isPurchase = form.reason === 'purchase';
  const isSale = form.reason === 'sale';
  const isAdjustment = form.reason === 'adjustment';
  const filteredContacts = isPurchase
    ? contacts.filter(c => c.roles.includes('supplier'))
    : isSale
      ? contacts.filter(c => c.roles.includes('customer'))
      : contacts;
  const partyRequired = isPurchase || isSale;
  const partyLabel = isPurchase
    ? 'فروشنده'
    : isSale
      ? 'مشتری'
      : 'طرف معامله';

  const target = delId ? movements.find(m => m.id === delId) : null;

  return (
    <PageContainer>
        <HelpBanner
          id="moves-intro"
          icon="⚠️"
          title="این صفحه فقط برای اصلاح دستی است"
          description="موارد استفاده — ضایعات (دان خراب شد)، شمارش دستی، هدیه، مرجوعی. برای خرید از فروشنده یا فروش به مشتری، از بخش «معاملات» استفاده کنید."
          tone="warn"
        actionLabel="برو به معاملات ←"
        onAction={() => navigate('/tra/purchases')}
        />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterType('')} style={chip(filterType === '')}>
          همه ({toFa(movements.length)})
        </button>
        <button onClick={() => setFilterType('in')} style={chip(filterType === 'in')}>
          📥 ورود ({toFa(movements.filter(m => m.type === 'in').length)})
        </button>
        <button onClick={() => setFilterType('out')} style={chip(filterType === 'out')}>
          📤 خروج ({toFa(movements.filter(m => m.type === 'out').length)})
        </button>
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 16V4M7 4l-4 4M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/></svg>}
          title="گردشی ثبت نشده"
          desc="ورود یا خروج کالا از انبار را ثبت کنید."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت گردش</Btn>}
        />
      ) : (
        <>
          {list.map((m, i) => {
            const item = items.find(x => x.id === m.itemId);
            const party = contacts.find(c => c.id === m.partyId);
            const isOpen = expandedId === m.id;
            const accent = m.type === 'in' ? 'accent' : 'warn';
            const total = m.quantity * m.unitPrice;

            return (
              <ExpandableCard
                key={m.id}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji={m.type === 'in' ? '📥' : '📤'}
                title={`${m.type === 'in' ? 'ورود' : 'خروج'} ${toFa(m.quantity)} ${item ? UNIT_LABEL[item.unit] : ''} — ${item?.name || '—'}`}
                subtitle={`${toFa(m.date)} · ${MOVEMENT_REASON[m.reason]}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : m.id)}
                badge={<Tag tone={m.type === 'in' ? 'green' : 'amber'}>{m.type === 'in' ? 'ورود' : 'خروج'}</Tag>}
                stats={
                  <>
                    <span>مقدار: <b style={{ color: 'var(--text)' }}>{toFa(m.quantity)}</b></span>
                    {m.unitPrice > 0 ? <span>قیمت: <b style={{ color: 'var(--text)' }}>{toFa(m.unitPrice.toLocaleString('fa-IR'))}</b></span> : null}
                    {total > 0 ? <span>جمع: <b style={{ color: 'var(--text)' }}>{toFa(total.toLocaleString('fa-IR'))} ت</b></span> : null}
                  </>
                }
              >
                <SectionTitle>📋 اطلاعات گردش</SectionTitle>
                <Row l="کالا" v={item ? `${CATEGORY_ICON[item.category]} ${item.name}` : '—'} />
                <Row l="نوع" v={m.type === 'in' ? 'ورود' : 'خروج'} />
                <Row l="دلیل" v={MOVEMENT_REASON[m.reason]} />
                <Row l="تاریخ" v={toFa(m.date)} />
                <Row l="مقدار" v={`${toFa(m.quantity)} ${item ? UNIT_LABEL[item.unit] : ''}`} />
                {party ? <Row l="طرف معامله" v={party.name} /> : null}

                {m.unitPrice > 0 ? (
                  <>
                    <SectionTitle>💰 مالی</SectionTitle>
                    <Row l="قیمت واحد" v={`${toFa(m.unitPrice.toLocaleString('fa-IR'))} ت`} />
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                       background: 'var(--accent-soft)', color: 'var(--accent)',
                       borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                      <span>جمع کل:</span>
                      <span>{toFa(total.toLocaleString('fa-IR'))} ت</span>
                    </div>
                  </>
                ) : null}

                {m.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{m.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => setDelId(m.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت گردش</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت گردش انبار"
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="نوع گردش" required>
          <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as MovementType })}>
            <option value="in">📥 ورود به انبار</option>
            <option value="out">📤 خروج از انبار</option>
          </Select>
        </Field>

        <Field label="کالا" required hint={selectedItem ? `موجودی فعلی — ${toFa(currentStock)} ${UNIT_LABEL[selectedItem.unit]}` : undefined}>
          <SmartSelect
            value={form.itemId}
            onChange={v => setForm({ ...form, itemId: v })}
            options={items.map(it => ({
              value: it.id,
              label: it.name,
              subtitle: `${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`,
              group: it.category,
            }))}
            groupLabels={Object.fromEntries(
              Object.entries(CATEGORY_LABEL).map(([k, v]) => [k, v])
            ) as Record<string, string>}
            groupIcons={Object.fromEntries(
              Object.entries(CATEGORY_ICON).map(([k, v]) => [k, v])
            ) as Record<string, string>}
            placeholder="— انتخاب کالا —"
            modalTitle="انتخاب کالای انبار"
            autoThreshold={6}
          />
        </Field>

        <Grid2>
          <Field label="تعداد" required>
            <NumField placeholder="مثلاً — ۱۰۰"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              unit={selectedItem ? UNIT_LABEL[selectedItem.unit] : ''}
              max={form.type === 'out' ? currentStock : undefined} min={0} />
          </Field>
          <Field label="قیمت واحد">
            <MoneyField placeholder="مثلاً — ۵۰٬۰۰۰" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="دلیل" required>
            <Select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value as MovementReason })}>
              {(Object.keys(MOVEMENT_REASON) as MovementReason[]).map(r =>
                <option key={r} value={r}>{MOVEMENT_REASON[r]}</option>
              )}
            </Select>
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} />
          </Field>
        </Grid2>

        {!isAdjustment && (
          <Field
            label={partyLabel}
            required={partyRequired}
            hint={partyRequired ? undefined : 'اختیاری — از مخاطبین'}
          >
            {filteredContacts.length === 0 ? (
              <div style={{
                padding: 'var(--pad-normal)',
                background: 'var(--warn-soft)',
                border: '1px dashed var(--warn)',
                borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--warn)',
                fontWeight: 600,
              }}>
                ⚠️ {isPurchase ? 'هیچ فروشنده‌ای تعریف نشده' : isSale ? 'هیچ مشتری‌ای تعریف نشده' : 'مخاطبی تعریف نشده'} — از بخش «مخاطبین» اضافه کنید
              </div>
            ) : (
              <SmartSelect
                value={form.partyId}
                onChange={v => setForm({ ...form, partyId: v })}
                options={filteredContacts.map(c => ({
                  value: c.id,
                  label: c.name,
                  subtitle: c.roles.length > 0
                    ? c.roles.map(r => r === 'customer' ? 'مشتری' : r === 'supplier' ? 'فروشنده' : 'کارگر').join('، ')
                    : undefined,
                }))}
                placeholder={partyRequired ? `— انتخاب ${partyLabel} —` : '— بدون مخاطب —'}
                modalTitle={`انتخاب ${partyLabel}`}
                autoThreshold={6}
              />
            )}
          </Field>
        )}

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف گردش"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteMovement(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف این گردش؟</div>
      </Modal>
    </PageContainer>
  );
}
