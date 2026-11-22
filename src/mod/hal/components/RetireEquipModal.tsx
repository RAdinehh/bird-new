/**
 * RetireEquipModal — فروش یا اسقاط تجهیز (SAP standard + اتصال به معاملات)
 */
import { useFormat } from '../../../shr/units/useFormat';



import { useEffect, useState } from 'react';
import { Btn, Field, Grid2, Input, Modal, NumField, Select } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { todayJ } from '../../flk/api/flocksCalc';
import { toFa, toEn } from '../../../shr/utils/fa';
import { getUnitLabel } from '../_typedLabels';
import { useCtc } from '../../ctc/store';
import type { Equipment, SaleInfo } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  onConfirm: (eq: Equipment, info: SaleInfo, options: { qty: number; createInvoice: boolean }) => void;
}

export default function RetireEquipModal({ open, onClose, equipment, onConfirm }: Props) {
  const fmt = useFormat();
  const allContacts = useCtc(s => s.contacts);
  const contacts = allContacts.filter(c => (c.roles || []).includes('customer'));
  const [reason, setReason] = useState<'sale' | 'scrap'>('sale');
  const [qtyStr, setQtyStr] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [partyId, setPartyId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [createInvoice, setCreateInvoice] = useState(true);
  const [note, setNote] = useState('');
  const [soldAt, setSoldAt] = useState(todayJ());

  useEffect(() => {
    if (open && equipment) {
      setReason('sale');
      setQtyStr(String(equipment.count || 1));
      setSalePrice('');
      setPartyId('');
      setBuyer('');
      setCreateInvoice(true);
      setNote('');
      setSoldAt(todayJ());
    }
  }, [open, equipment]);

  const handleClose = () => {
    setReason('sale');
    setQtyStr('1');
    setSalePrice('');
    setPartyId('');
    setBuyer('');
    setCreateInvoice(true);
    setNote('');
    setSoldAt(todayJ());
    onClose();
  };

  if (!equipment) return null;

  const maxQty = Math.max(1, equipment.count || 1);
  const qtyNum = Math.floor(Number(toEn(qtyStr)) || 0);
  const validQty = qtyNum >= 1 && qtyNum <= maxQty;

  const totalCost = (equipment.unitPrice || 0) * (validQty ? qtyNum : 0);
  const salePriceNum = reason === 'sale' ? (parseFloat(toEn(salePrice).replace('٫', '.')) || 0) : 0;
  const profit = salePriceNum - totalCost;
  const isLoss = profit < 0;
  const isProfit = profit > 0;

  const selectedContact = contacts.find(c => c.id === partyId);
  const needsPartyForInvoice = reason === 'sale' && createInvoice && contacts.length > 0 && !partyId;
  const canSave = validQty && (reason === 'scrap' || (reason === 'sale' && salePriceNum > 0 && !needsPartyForInvoice));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`🔚 خروج تجهیز: ${equipment.name}`}
      footer={
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Btn
            variant={reason === 'scrap' ? 'danger' : 'primary'}
            onClick={() => {
              if (!canSave) return;
              const resolvedBuyer = selectedContact?.name || buyer.trim() || undefined;
              const info: SaleInfo = {
                reason,
                count: qtyNum,
                salePrice: salePriceNum,
                totalCost,
                profit,
                soldAt,
                buyer: resolvedBuyer,
                partyId: reason === 'sale' && partyId ? partyId : undefined,
                note: note.trim() || undefined,
                createdAt: new Date().toISOString(),
              };
              onConfirm(equipment, info, { qty: qtyNum, createInvoice: reason === 'sale' && createInvoice && !!partyId });
              handleClose();
            }}
            style={{ flex: 1 }}
            disabled={!canSave}
          >
            {reason === 'scrap' ? '🔚 تایید اسقاط' : '💰 ثبت فروش'}
          </Btn>
          <Btn onClick={handleClose} style={{ flex: 1 }}>لغو</Btn>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Grid2>
          <Field label="نوع خروج" required>
            <Select value={reason} onChange={e => setReason(e.target.value as 'sale' | 'scrap')}>
              <option value="sale">💰 فروش (با مبلغ)</option>
              <option value="scrap">🔚 اسقاط (بدون مبلغ)</option>
            </Select>
          </Field>

          {maxQty > 1 && (
            <Field label={`تعداد خروج (از ${fmt.count(maxQty)} ${getUnitLabel(equipment.unit)})`} required>
              <NumField
                value={qtyStr}
                onChange={e => setQtyStr(e.target.value)}
                min={1}
                max={maxQty}
              />
            </Field>
          )}
        </Grid2>

        {reason === 'sale' && (
          <>
            <Grid2>
              <Field label="مبلغ کل فروش" required>
                <NumField
                  placeholder="مثلاً ۵,۰۰۰,۰۰۰"
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  min={0}
                />
              </Field>
              {contacts.length > 0 ? (
                <Field label="خریدار (طرف حساب)" required={createInvoice}>
                  <SmartSelect
                    value={partyId}
                    placeholder="— انتخاب طرف حساب —"
                    modalTitle="انتخاب خریدار"
                    options={contacts.map(c => ({ value: String(c.id), label: String(c.name) }))}
                    onChange={(val: string) => setPartyId(val)}
                  />
                </Field>
              ) : (
                <Field label="خریدار (اختیاری)">
                  <Input
                    placeholder="نام خریدار"
                    value={buyer}
                    onChange={e => setBuyer(e.target.value)}
                  />
                </Field>
              )}
            </Grid2>

            {contacts.length > 0 && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
                padding: '8px 10px',
                background: 'var(--accent-soft)',
                borderRadius: 'var(--r-md)',
              }}>
                <input
                  type="checkbox"
                  checked={createInvoice}
                  onChange={e => setCreateInvoice(e.target.checked)}
                />
                <span>ثبت خودکار فاکتور فروش در بخش معاملات و مطالبات</span>
              </label>
            )}
          </>
        )}

        <Field label="تاریخ خروج">
          <DatePicker value={soldAt} onChange={setSoldAt} placeholder="انتخاب" autoToday />
        </Field>

        <Field label="یادداشت (اختیاری)">
          <Input
            placeholder={reason === 'scrap' ? 'مثلاً: خراب شد، قابل تعمیر نبود' : 'مثلاً: فروش تجهیز مازاد'}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </Field>

        <div style={{
          padding: '10px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 'var(--fs-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>قیمت خرید ({fmt.num(validQty ? qtyNum : 0)} {getUnitLabel(equipment.unit)}):</span>
            <b>{fmt.money(totalCost)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>مبلغ فروش:</span>
            <b>{fmt.money(salePriceNum)}</b>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border)',
            paddingTop: 6,
            marginTop: 2,
          }}>
            <span style={{ fontWeight: 700 }}>{isProfit ? '✅ سود:' : isLoss ? '❌ ضرر:' : '⚖️ سربه‌سر:'}</span>
            <b style={{
              color: isProfit ? 'var(--accent)' : isLoss ? 'var(--danger)' : 'var(--muted)',
              fontSize: 'var(--fs-md)',
            }}>
              {fmt.money(Math.abs(profit))}
            </b>
          </div>
        </div>
      </div>
    </Modal>
  );
}
