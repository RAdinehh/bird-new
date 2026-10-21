/**
 * MultiPayModal.tsx — پرداخت گروهی به چند فاکتور
 * یک PartyPayment می‌سازد و بین چند فاکتور توزیع می‌کند.
 */
import { useState, useMemo } from 'react';
import { Btn, BtnRow, Field, Grid2, MoneyField, Modal, NumField, SectionTitle, Select, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa, toEn } from '../../../shr/utils/fa';
import { useTra, remaining, paidSum, type Invoice, type PartyPayment } from '../store';
import { useCtc } from '../../ctc/store';
import { toastMsg } from '../../../cor/store/toast';

interface Props {
  open: boolean;
  onClose: () => void;
  kind: 'sale' | 'purchase';
}

export default function MultiPayModal({ open, onClose, kind }: Props) {
  const { invoices, addPartyPayment, updateInvoice } = useTra();
  const contacts = useCtc(s => s.contacts);
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'check'>('cash');
  const [checkNo, setCheckNo] = useState('');
  const [bank, setBank] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');

  // فاکتورهای معوق این طرف حساب
  const unpaid = useMemo(() => {
    if (!partyId) return [];
    return invoices
      .filter(inv => inv.type === kind && inv.partyId === partyId && remaining(inv) > 0)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [invoices, partyId, kind]);

  const totalAmount = parseFloat(toEn(amount)) || 0;

  // توزیع خودکار: از قدیمی‌ترین فاکتور تا سیر شدن مبلغ
  const allocations = useMemo(() => {
    if (totalAmount <= 0 || unpaid.length === 0) return {} as Record<string, number>;
    let left = totalAmount;
    const result: Record<string, number> = {};
    for (const inv of unpaid) {
      if (!selectedIds.has(inv.id)) continue;
      if (left <= 0) break;
      const rem = remaining(inv);
      const allocate = Math.min(left, rem);
      result[inv.id] = allocate;
      left -= allocate;
    }
    return result;
  }, [totalAmount, unpaid, selectedIds]);

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const leftover = totalAmount - totalAllocated;

  const toggleInvoice = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setPartyId(''); setDate(''); setAmount(''); setMethod('cash');
    setCheckNo(''); setBank(''); setDueDate(''); setNotes('');
    setSelectedIds(new Set()); setErr('');
  };

  const handleConfirm = () => {
    setErr('');
    if (!partyId) { setErr('طرف حساب را انتخاب کنید'); return; }
    if (!date) { setErr('تاریخ را انتخاب کنید'); return; }
    if (totalAmount <= 0) { setErr('مبلغ را وارد کنید'); return; }
    if (selectedIds.size === 0) { setErr('حداقل یک فاکتور انتخاب کنید'); return; }
    if (totalAllocated <= 0) { setErr('مبلغ توزیع‌شده صفر است'); return; }
    if (method === 'check' && !checkNo.trim()) { setErr('شماره چک الزامی است'); return; }

    try {
      // ۱. ساخت PartyPayment
      const ppId = addPartyPayment({
        partyId,
        date,
        amount: totalAllocated,
        method,
        type: 'regular',
        checkNo: method === 'check' ? checkNo : '',
        bank: method === 'check' ? bank : '',
        dueDate: method === 'check' ? dueDate : '',
        notes: notes || 'پرداخت گروهی به چند فاکتور',
      } as Omit<PartyPayment, 'id'|'createdAt'|'updatedAt'>);

      // ۲. افزودن Payment به هر فاکتور
      let count = 0;
      for (const [invId, allocAmount] of Object.entries(allocations)) {
        const inv = invoices.find(x => x.id === invId);
        if (!inv || allocAmount <= 0) continue;
        const newPayment = {
          id: crypto.randomUUID(),
          date,
          amount: allocAmount,
          method,
          type: 'regular' as const,
          checkNo: method === 'check' ? checkNo : '',
          bank: method === 'check' ? bank : '',
          dueDate: method === 'check' ? dueDate : '',
          notes: 'تخصیص از پرداخت گروهی',
          partyPaymentId: ppId,
          status: method === 'check' ? ('pending' as const) : undefined,
        };
        updateInvoice(invId, {
          payments: [...(inv.payments || []), newPayment],
        });
        count++;
      }

      toastMsg.success(`پرداخت به ${toFa(count)} فاکتور توزیع شد`);
      reset();
      onClose();
    } catch (e: any) {
      console.error('[MultiPay]', e);
      setErr(e?.message || 'خطا در ثبت پرداخت');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={kind === 'sale' ? '💳 دریافت گروهی' : '💳 پرداخت گروهی'}
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleConfirm}>ثبت پرداخت</Btn>
          <Btn onClick={() => { reset(); onClose(); }}>لغو</Btn>
        </BtnRow>
      }
    >
      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)' }}>📋</span> اطلاعات پرداخت</SectionTitle>

      <Grid2>
        <Field label="طرف حساب" required>
          <SmartSelect
            value={partyId}
            onChange={v => { setPartyId(v); setSelectedIds(new Set()); }}
            options={contacts
              .filter(c => kind === 'sale' ? true : true)
              .map(c => ({ value: c.id, label: c.name }))}
            placeholder="— انتخاب —"
            modalTitle="انتخاب طرف حساب"
            autoThreshold={6}
          />
        </Field>
        <Field label="تاریخ" required>
          <DatePicker value={date} onChange={setDate} autoToday />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="مبلغ کل" required>
          <MoneyField
            placeholder="مثلاً — ۵٬۰۰۰٬۰۰۰"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </Field>
        <Field label="روش">
          <Select value={method} onChange={e => setMethod(e.target.value as any)}>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
            <option value="check">چک</option>
          </Select>
        </Field>
      </Grid2>

      {method === 'check' && (
        <>
          <Grid2>
            <Field label="شماره چک" required>
              <input
                value={checkNo}
                onChange={e => setCheckNo(e.target.value)}
                placeholder="مثلاً — ۰۰۱"
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--input-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none',
                }}
                dir="ltr"
              />
            </Field>
            <Field label="بانک">
              <input
                value={bank}
                onChange={e => setBank(e.target.value)}
                placeholder="مثلاً — ملی"
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--input-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none',
                }}
              />
            </Field>
          </Grid2>
          <Field label="سرسید چک">
            <DatePicker value={dueDate} onChange={setDueDate} autoToday />
          </Field>
        </>
      )}

      <Field label="یادداشت">
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="اختیاری"
          style={{
            width: '100%', padding: '10px 12px',
            background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none',
          }}
        />
      </Field>

      {partyId && (
        <>
          <SectionTitle><span style={{ fontSize: 'var(--fs-sm)' }}>📄</span> فاکتورهای بدهکار ({toFa(unpaid.length)})</SectionTitle>
          {unpaid.length === 0 ? (
            <div style={{ padding: 'var(--pad-normal)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
              این طرف حساب فاکتور بدهکاری ندارد ✅
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unpaid.map(inv => {
                const rem = remaining(inv);
                const isSelected = selectedIds.has(inv.id);
                const alloc = allocations[inv.id] || 0;
                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleInvoice(inv.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: 'var(--pad-normal)',
                      background: isSelected ? 'var(--accent-soft)' : 'var(--input-bg)',
                      border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-sm)',
                      cursor: 'pointer',
                      fontSize: 'var(--fs-sm)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleInvoice(inv.id)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        فاکتور {inv.number || inv.id.slice(0, 8)}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                        📅 {toFa(inv.date)} • مانده: {toFa(rem.toLocaleString('fa-IR'))} تومان
                      </div>
                    </div>
                    {isSelected && alloc > 0 && (
                      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--fs-sm)' }}>
                        {toFa(alloc.toLocaleString('fa-IR'))} تومان
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {totalAmount > 0 && selectedIds.size > 0 && (
            <div style={{
              marginTop: 8, padding: 'var(--pad-normal)',
              background: leftover > 0.5 ? 'var(--warn-soft)' : 'var(--accent-soft)',
              border: `1px solid ${leftover > 0.5 ? 'var(--warn)' : 'var(--accent)'}`,
              borderRadius: 'var(--r-md)',
              fontSize: 'var(--fs-sm)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>توزیع‌شده: <b>{toFa(totalAllocated.toLocaleString('fa-IR'))} تومان</b></span>
              {leftover > 0.5 && (
                <span style={{ color: 'var(--warn)' }}>باقی‌مانده: <b>{toFa(leftover.toLocaleString('fa-IR'))} تومان</b></span>
              )}
              {leftover <= 0.5 && leftover > -0.5 && (
                <span style={{ color: 'var(--accent)' }}>✅ کامل توزیع شد</span>
              )}
            </div>
          )}
        </>
      )}

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
