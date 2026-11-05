/**
 * MultiPayModal.tsx — پرداخت گروهی به چند فاکتور
 * یک PartyPayment می‌سازد و بین چند فاکتور توزیع می‌کند.
 */
import { useState, useMemo, useEffect } from 'react';
import { Btn, BtnRow, Field, Grid2, MoneyField, Modal, NumField, SectionTitle, Select, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { toFa, toEn } from '../../../shr/utils/fa';
import { useTra, remaining, paidSum, type Invoice, type PartyPayment } from '../store';
import { useCtc } from '../../ctc/store';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  kind: 'sale' | 'purchase';
  prefillPartyId?: string;
  prefillInvoiceId?: string;
}

export default function MultiPayModal({ open, onClose, kind, prefillPartyId, prefillInvoiceId }: Props) {
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
  const [manualMode, setManualMode] = useState(false);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});
  const [err, setErr] = useState('');

  // 🆕 Prefill از props (دکمه 💳 روی ردیف فاکتور)
  useEffect(() => {
    if (!open) return;
    if (prefillPartyId) {
      setPartyId(prefillPartyId);
      if (prefillInvoiceId) {
        setSelectedIds(new Set([prefillInvoiceId]));
      } else {
        const auto = invoices
          .filter(inv => inv.type === kind && inv.partyId === prefillPartyId && remaining(inv) > 0)
          .map(inv => inv.id);
        setSelectedIds(new Set(auto));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillPartyId, prefillInvoiceId]);

  // فاکتورهای معوق این طرف حساب
  const unpaid = useMemo(() => {
    if (!partyId) return [];
    return invoices
      .filter(inv => inv.type === kind && inv.partyId === partyId && remaining(inv) > 0)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [invoices, partyId, kind]);

  const totalAmount = parseFloat(toEn(amount)) || 0;

  // توزیع خودکار: از قدیمی‌ترین فاکتور تا سیر شدن مبلغ
  const fifoAllocations = useMemo(() => {
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

  const allocations = manualMode ? manualAllocations : fifoAllocations;

  const toggleManualMode = () => {
    if (!manualMode) setManualAllocations({ ...fifoAllocations });
    setManualMode(!manualMode);
  };

  const setManualAlloc = (invId: string, value: number) => {
    setManualAllocations(prev => ({ ...prev, [invId]: Math.max(0, value) }));
  };

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
    setManualMode(false); setManualAllocations({});
  };

  const fail = (msg: string) => {
    setErr(msg);
  };

  const handleConfirm = async () => {
    setErr('');
    if (!partyId) return fail('طرف حساب را انتخاب کنید');
    if (!date) return fail('تاریخ را انتخاب کنید');
    if (totalAmount <= 0) return fail('مبلغ را وارد کنید');
    if (selectedIds.size === 0) return fail('حداقل یک فاکتور انتخاب کنید');
    if (totalAllocated <= 0) return fail('مبلغ توزیع‌شده صفر است');
    if (method === 'check' && !checkNo.trim()) return fail('شماره چک الزامی است');

    // 🆕 محافظت اعداد ریز
    if (totalAllocated < 1000) {
      return fail('مبلغ توزیع‌شده خیلی کوچک است. حداقل ۱,۰۰۰ تومان.');
    }
    if (totalAllocated < 10000) {
      const ok = await showConfirmAsync(
        'تأیید مبلغ کوچک',
        'مبلغ توزیع‌شده کمتر از ۱۰,۰۰۰ تومان است. ادامه می‌دهید؟',
        { confirmText: 'ادامه' }
      );
      if (!ok) return;
    }

    // 🆕 محافظت در حالت دستی
    if (manualMode && totalAllocated > totalAmount + 0.5) {
      return fail('مجموع تخصیص دستی بیشتر از مبلغ کل است');
    }

    // 🆕 کانفرمیشن overpayment
    if (leftover > 0.5) {
      const ok = await showConfirmAsync(
        'ثبت پیش‌پرداخت',
        'مبلغ اضافه به عنوان «پیش‌پرداخت» برای این طرف حساب ثبت می‌شود. ادامه می‌دهید؟',
        { confirmText: 'ثبت' }
      );
      if (!ok) return;
    }

    try {
      // ۱. ساخت PartyPayment
      const ppId = addPartyPayment({
        partyId,
        date,
        amount: totalAmount,
        method,
        type: leftover > 0.5 ? 'advance' : 'regular',
        checkNo: method === 'check' ? checkNo : '',
        bank: method === 'check' ? bank : '',
        dueDate: method === 'check' ? dueDate : '',
        notes: notes || (leftover > 0.5 ? 'پرداخت گروهی + پیش‌پرداخت' : 'پرداخت گروهی به چند فاکتور'),
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
      fail(e?.message || 'خطا در ثبت پرداخت');
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
            onChange={v => {
                setPartyId(v);
                // 🆕 auto-select all unpaid (SAP F-28 / Odoo standard)
                const auto = invoices
                  .filter(inv => inv.type === kind && inv.partyId === v && remaining(inv) > 0)
                  .map(inv => inv.id);
                setSelectedIds(new Set(auto));
              }}
            options={contacts
              .filter(c => kind === 'sale' ? c.roles?.includes('customer') : c.roles?.includes('supplier'))
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
            placeholder="مثلاً ۵٬۰۰۰٬۰۰۰"
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
                placeholder="مثلاً ۰۰۱"
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
                placeholder="مثلاً ملی"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {manualMode ? '✏️ تخصیص دستی' : '📊 تخصیص خودکار (FIFO)'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set(unpaid.map(i => i.id)))}
                    style={{ padding: '4px 8px', fontSize: 'var(--fs-xs)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit' }}
                  >همه</button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    style={{ padding: '4px 8px', fontSize: 'var(--fs-xs)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit' }}
                  >هیچ</button>
                  <button
                    type="button"
                    onClick={toggleManualMode}
                    style={{ padding: '4px 10px', fontSize: 'var(--fs-xs)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit' }}
                  >
                    {manualMode ? 'بازگشت به FIFO' : 'ویرایش دستی'}
                  </button>
                </div>
              </div>
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        فاکتور {inv.number || inv.id.slice(0, 8)}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                        📅 {toFa(inv.date)} • مانده: {toFa(rem.toLocaleString('fa-IR'))} تومان
                      </div>
                    </div>
                    {isSelected && manualMode && (
                      <input
                        type="number"
                        min={0}
                        max={rem}
                        value={manualAllocations[inv.id] || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          setManualAlloc(inv.id, Number(e.target.value) || 0);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={String(rem)}
                        style={{ width: 110, padding: '4px 8px', fontSize: 'var(--fs-xs)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums', textAlign: 'left' }}
                      />
                    )}
                    {isSelected && !manualMode && alloc > 0 && (
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
                <span style={{ color: 'var(--warn)' }}>پیش‌پرداخت: <b>{toFa(leftover.toLocaleString('fa-IR'))} تومان</b></span>
              )}
              {leftover <= 0.5 && leftover > -0.5 && (
                <span style={{ color: 'var(--accent)' }}>✅ کامل توزیع شد</span>
              )}
              {leftover < -0.5 && (
                <span style={{ color: 'var(--danger)' }}>⚠️ بیشتر از مبلغ کل</span>
              )}
            </div>
          )}
        </>
      )}

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
