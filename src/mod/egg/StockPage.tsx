import { useState, useMemo } from 'react';
import { useEgg, calcStock, toPieces, saleTotal, EGG_TYPE_LABEL, UNIT_LABEL, PAYMENT_LABEL, type EggSale, type EggType } from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import SmartSelect from '../../shr/components/SmartSelect';

interface F {
  id?: string;
  date: string;
  type: EggType;
  count: string;
  unit: 'piece' | 'shikan' | 'box' | 'carton';
  unitPrice: string;
  customerId: string;
  paymentType: 'cash' | 'card' | 'debt';
  notes: string;
}

const empty = (): F => ({
  date: '', type: 'eating', count: '', unit: 'shikan',
  unitPrice: '', customerId: '', paymentType: 'cash', notes: ''
});

export default function StockPage() {
  const { productions, sales, addSale, deleteSale } = useEgg();
  const { contacts } = useCtc();
  const customers = contacts.filter(c => c.roles.includes('customer'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stock = useMemo(() => calcStock(productions, sales), [productions, sales]);

  const list = useMemo(
    () => [...sales].sort((a, b) => b.date.localeCompare(a.date)),
    [sales]
  );

  const openNew = () => {
    if (customers.length === 0) { showAlert('اول یک مشتری در مخاطبین بسازید'); return; }
    setForm({ ...empty(), customerId: customers[0].id });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;
  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;

  const currentTypeStock = (type: EggType) => {
    if (type === 'eating') return stock.eating;
    if (type === 'fertile') return stock.fertile;
    return stock.broken;
  };

  const selectedStock = currentTypeStock(form.type);
  const pieces = toPieces(int(form.count), form.unit);
  const total = saleTotal(int(form.count), num(form.unitPrice));

  const save = () => {
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    if (form.customerId === '') { setErr('مشتری اجباری است'); return; }
    const c = int(form.count);
    if (c <= 0) { setErr('تعداد باید بیشتر از صفر باشد'); return; }
    if (pieces > selectedStock) {
      setErr(`موجودی کافی نیست — موجودی: ${toFa(selectedStock)} عدد`);
      return;
    }
    if (num(form.unitPrice) <= 0) { setErr('قیمت واحد اجباری است'); return; }

    const data = {
      date: form.date.trim(),
      type: form.type,
      count: c,
      unit: form.unit,
      unitPrice: num(form.unitPrice),
      totalPrice: total,
      customerId: form.customerId,
      paymentType: form.paymentType,
      notes: form.notes.trim()
    };

    addSale(data);
    setOpen(false);
  };

  const target = delId ? sales.find(s => s.id === delId) : null;

  return (
    <PageContainer>
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
        📦 موجودی انبار
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <div style={{
          padding: '12px 10px', textAlign: 'center',
          background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)'
        }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>خوراکی</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--accent)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            {toFa(stock.eating.toLocaleString('fa-IR'))}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>عدد</div>
        </div>
        <div style={{
          padding: '12px 10px', textAlign: 'center',
          background: 'var(--purple-soft)', border: '1px solid var(--purple)',
          borderRadius: 'var(--r-md)'
        }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--purple)', fontWeight: 700 }}>نطفه‌دار</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--purple)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            {toFa(stock.fertile.toLocaleString('fa-IR'))}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>عدد</div>
        </div>
        <div style={{
          padding: '12px 10px', textAlign: 'center',
          background: 'var(--warn-soft)', border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)'
        }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>شکسته</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--warn)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            {toFa(stock.broken.toLocaleString('fa-IR'))}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>عدد</div>
        </div>
      </div>

      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', marginTop: 8 }}>
        💰 فروش‌ها
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="فروشی ثبت نشده"
          desc={customers.length === 0 ? 'اول از مخاطبین یک مشتری بسازید.' : 'اولین فروش تخم را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>+ ثبت فروش</Btn>}
        />
      ) : (
        <>
          {list.map((s, i) => {
            const cus = contacts.find(c => c.id === s.customerId);
            const isOpen = expandedId === s.id;
            const pieces = toPieces(s.count, s.unit);

            return (
              <ExpandableCard
                key={s.id}
                accent={s.paymentType === 'debt' ? 'warn' : 'accent'}
                index={toFa(i + 1)}
                iconEmoji="💵"
                title={`${EGG_TYPE_LABEL[s.type]} — ${toFa(s.totalPrice.toLocaleString('fa-IR'))} ت`}
                subtitle={`${cus?.name || '—'} · ${toFa(s.date)}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : s.id)}
                badge={<Tag tone={s.paymentType === 'debt' ? 'amber' : 'green'}>{PAYMENT_LABEL[s.paymentType]}</Tag>}
                summary={
                  <>
                    <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(s.count)} {UNIT_LABEL[s.unit].split(' ')[0]}</b></span>
                    <span>عدد: <b style={{ color: 'var(--text)' }}>{toFa(pieces.toLocaleString('fa-IR'))}</b></span>
                  </>
                }
              >
                <SectionTitle>📋 اطلاعات فروش</SectionTitle>
                <Row l="مشتری" v={cus?.name || '—'} />
                <Row l="تاریخ" v={toFa(s.date)} />
                <Row l="نوع تخم" v={EGG_TYPE_LABEL[s.type]} />
                <Row l="روش پرداخت" v={PAYMENT_LABEL[s.paymentType]} />

                <SectionTitle>🥚 تعداد</SectionTitle>
                <Row l="تعداد" v={`${toFa(s.count)} ${UNIT_LABEL[s.unit]}`} />
                <Row l="معادل عدد" v={`${toFa(pieces.toLocaleString('fa-IR'))} عدد`} />

                <SectionTitle>💰 مالی</SectionTitle>
                <Row l="قیمت واحد" v={`${toFa(s.unitPrice.toLocaleString('fa-IR'))} ت`} />
                <div style={{ display: 'flex', justifyContent: 'space-between',
                   fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)',
                   color: 'var(--accent)', borderRadius: 'var(--r-sm)',
                   fontWeight: 700 }}>
                  <span>جمع کل:</span>
                  <span>{toFa(s.totalPrice.toLocaleString('fa-IR'))} ت</span>
                </div>

                {s.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: '8px 10px', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{s.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => setDelId(s.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت فروش</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت فروش تخم"
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Grid2>
          <Field label="مشتری" required>
<SmartSelect
              value={form.customerId}
              onChange={v => setForm(f => ({ ...f, customerId: v }))}
              options={customers.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (c => c.phone || undefined)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب مشتری"
              autoThreshold={6}
            />
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} />
          </Field>
        </Grid2>

        <Field label="نوع تخم" required hint={`موجودی این نوع: ${toFa(selectedStock)} عدد`}>
          <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EggType })}>
            <option value="eating">🥚 خوراکی ({toFa(stock.eating)})</option>
            <option value="fertile">🌱 نطفه‌دار ({toFa(stock.fertile)})</option>
            <option value="broken">💔 شکسته ({toFa(stock.broken)})</option>
          </Select>
        </Field>

        <Grid2>
          <Field label="واحد" required>
            <Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as 'piece' | 'shikan' | 'box' | 'carton' })}>
              <option value="piece">عدد</option>
              <option value="shikan">شانه (۳۰ عدد)</option>
              <option value="box">جعبه (۱۰ عدد)</option>
              <option value="carton">کارتن (۳۶۰ عدد)</option>
            </Select>
          </Field>
          <Field label="تعداد" required>
            <NumField value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} max={100000} min={0} />
          </Field>
        </Grid2>

        {pieces > 0 ? (
          <div style={{
            padding: '8px 12px',
            background: pieces > selectedStock ? 'var(--danger-soft)' : 'var(--accent-soft)',
            border: '1px solid ' + (pieces > selectedStock ? 'var(--danger)' : 'var(--accent-border)'),
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            color: pieces > selectedStock ? 'var(--danger)' : 'var(--accent)',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            معادل {toFa(pieces.toLocaleString('fa-IR'))} عدد از {toFa(selectedStock)} موجودی
          </div>
        ) : null}

        <Field label="قیمت واحد" required hint={`قیمت هر ${UNIT_LABEL[form.unit].split(' ')[0]}`}>
          <MoneyField value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
        </Field>

        {total > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between',
             fontSize: 'var(--fs-md)', padding: '10px 12px', background: 'var(--accent-soft)',
             color: 'var(--accent)', borderRadius: 'var(--r-md)', fontWeight: 700 }}>
            <span>جمع کل:</span>
            <span>{toFa(total.toLocaleString('fa-IR'))} ت</span>
          </div>
        ) : null}

        <Field label="روش پرداخت">
          <Select value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value as 'cash' | 'card' | 'debt' })}>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
            <option value="debt">نسیه (بدهی)</option>
          </Select>
        </Field>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {err ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div> : null}
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف فروش"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteSale(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>
          حذف فروش به <b>{contacts.find(c => c.id === target?.customerId)?.name}</b>؟
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
       padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)',
       fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}
