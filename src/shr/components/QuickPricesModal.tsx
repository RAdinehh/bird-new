import { useState, useEffect } from 'react';
import { Modal, Field, Input, Btn, BtnRow } from './ui';
import { useSet, DEFAULT_MARKET_PRICES, type MarketPrices } from '../../mod/set/store';
import { toFa, toEn } from '../utils/fa';
import { toastMsg } from '../../cor/store/toast';

const ALL_FIELDS: Array<{
  key: keyof Omit<MarketPrices, 'updatedAt'>;
  label: string;
  unit: string;
  icon: string;
  hint: string;
}> = [
  { key: 'liveChicken', label: 'مرغ زنده', unit: 'تومان/کیلوگرم', icon: '🐔', hint: 'قیمت روز (هر کیلو)' },
  { key: 'liveTurkey', label: 'بوقلمون زنده', unit: 'تومان/کیلوگرم', icon: '🦃', hint: 'قیمت روز (هر کیلو)' },
  { key: 'liveGoose', label: 'غاز زنده', unit: 'تومان/کیلوگرم', icon: '🦢', hint: 'قیمت روز (هر کیلو)' },
  { key: 'liveDuck', label: 'اردک زنده', unit: 'تومان/کیلوگرم', icon: '🦆', hint: 'قیمت روز (هر کیلو)' },
  { key: 'liveQuail', label: 'بلدرچین زنده', unit: 'تومان/کیلوگرم', icon: '🐦', hint: 'قیمت روز (هر کیلو)' },
  { key: 'chickDay1', label: 'جوجه یک‌روزه', unit: 'تومان/عدد', icon: '🐣', hint: 'قیمت خرید (هر عدد)' },
  { key: 'eggTable', label: 'تخم‌مرغ خوراکی', unit: 'تومان/عدد', icon: '🥚', hint: 'قیمت فروش (هر عدد)' },
  { key: 'eggFertile', label: 'تخم نطفه‌دار', unit: 'تومان/عدد', icon: '🥚', hint: 'قیمت نطفه‌دار (هر عدد)' },
  { key: 'culledBird', label: 'مرغ حذفی', unit: 'تومان/عدد', icon: '🐓', hint: 'قیمت حذفی (هر عدد)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** @deprecated — فیلدها همیشه همه نمایش داده می‌شوند (۹ فیلد کم است) */
  restrictToKinds?: string[];
}

export default function QuickPricesModal({ open, onClose }: Props) {
  const marketPrices = useSet(s => s.marketPrices) || DEFAULT_MARKET_PRICES;
  const setAllMarketPrices = useSet(s => s.setAllMarketPrices);

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const f: Record<string, string> = {};
    for (const field of ALL_FIELDS) {
      const v = marketPrices[field.key];
      f[field.key] = v > 0 ? String(v) : '';
    }
    setForm(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const savedAt = marketPrices.updatedAt || '';

  const handleChange = (key: string, raw: string) => {
    setForm(f => ({ ...f, [key]: raw }));
  };

  const handleSave = () => {
    const prices: Record<string, number> = {};
    for (const field of ALL_FIELDS) {
      prices[field.key] = Number(toEn(form[field.key] || '0')) || 0;
    }
    setAllMarketPrices(prices);
    toastMsg.success('قیمت‌ها ذخیره شد');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="💰 قیمت‌های بازار"
      size="md"
      footer={<BtnRow><Btn variant="primary" onClick={handleSave}>💾 ذخیره</Btn><Btn onClick={onClose}>انصراف</Btn></BtnRow>}
    >
      <div style={{
        padding: 10, background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', marginBottom: 10,
      }}>
        قیمت‌ها را دستی وارد کنید. فقط فیلد مربوط به پرنده‌های گله را پر کنید — بقیه خالی بمانند.
        {savedAt && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
            آخرین به‌روزرسانی: {toFa(savedAt)}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ALL_FIELDS.map(field => (
          <Field key={field.key} label={`${field.icon} ${field.label}`}>
            <Input
              mode="number"
              inputMode="numeric"
              value={form[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.hint}
            />
          </Field>
        ))}
      </div>
    </Modal>
  );
}
