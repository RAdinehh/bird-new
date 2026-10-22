/**
 * RetireEquipModal — فروش یا اسقاط تجهیز (SAP standard)
 */
import { useState } from 'react';
import { Btn, Field, Grid2, Input, Modal, NumField, Select } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { todayJ } from '../../flk/api/flocksCalc';
import { toFa, toEn } from '../../../shr/utils/fa';
import type { Equipment, SaleInfo } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  onConfirm: (eq: Equipment, info: SaleInfo) => void;
}

export default function RetireEquipModal({ open, onClose, equipment, onConfirm }: Props) {
  const [reason, setReason] = useState<'sale' | 'scrap'>('sale');
  const [salePrice, setSalePrice] = useState('');
  const [buyer, setBuyer] = useState('');
  const [note, setNote] = useState('');
  const [soldAt, setSoldAt] = useState(todayJ());

  const handleClose = () => {
    setReason('sale');
    setSalePrice('');
    setBuyer('');
    setNote('');
    setSoldAt(todayJ());
    onClose();
  };

  if (!equipment) return null;

  const totalCost = (equipment.unitPrice || 0) * (equipment.count || 1);
  const salePriceNum = reason === 'sale' ? (parseFloat(toEn(salePrice).replace('٫','.')) || 0) : 0;
  const profit = salePriceNum - totalCost;
  const isLoss = profit < 0;
  const isProfit = profit > 0;
  const canSave = reason === 'scrap' || (reason === 'sale' && salePriceNum > 0);

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
              const info: SaleInfo = {
                reason,
                salePrice: salePriceNum,
                totalCost,
                profit,
                soldAt,
                buyer: buyer.trim() || undefined,
                note: note.trim() || undefined,
                createdAt: new Date().toISOString(),
              };
              onConfirm(equipment, info);
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
        <Field label="نوع خروج" required>
          <Select value={reason} onChange={e => setReason(e.target.value as 'sale' | 'scrap')}>
            <option value="sale">💰 فروش (با مبلغ)</option>
            <option value="scrap">🔚 اسقاط (بدون مبلغ)</option>
          </Select>
        </Field>

        {reason === 'sale' && (
          <Grid2>
            <Field label="مبلغ فروش" required>
              <NumField
                placeholder="مثلاً ۵,۰۰۰,۰۰۰"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
                min={0}
              />
            </Field>
            <Field label="خریدار (اختیاری)">
              <Input
                placeholder="نام خریدار"
                value={buyer}
                onChange={e => setBuyer(e.target.value)}
              />
            </Field>
          </Grid2>
        )}

        <Field label="تاریخ خروج">
          <DatePicker value={soldAt} onChange={setSoldAt} placeholder="انتخاب" autoToday />
        </Field>

        <Field label="یادداشت (اختیاری)">
          <Input
            placeholder={reason === 'scrap' ? 'مثلاً: خراب شد، قابل تعمیر نبود' : 'مثلاً: فروش به همکار'}
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
            <span style={{ color: 'var(--muted)' }}>قیمت خرید کل:</span>
            <b>{toFa(totalCost.toLocaleString('fa-IR'))} تومان</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>مبلغ فروش:</span>
            <b>{toFa(salePriceNum.toLocaleString('fa-IR'))} تومان</b>
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
              {toFa(Math.abs(profit).toLocaleString('fa-IR'))} تومان
            </b>
          </div>
        </div>
      </div>
    </Modal>
  );
}
