import { useState, useEffect } from 'react';
import { Modal, Field, Input, Btn, BtnRow } from './ui';
import { useSet, DEFAULT_MARKET_PRICES, type MarketPrices } from '../../mod/set/store';
import { toFa, toEn } from '../utils/fa';
import { toastMsg } from '../../cor/store/toast';

/** تبدیل عدد لاتین به فرمت با جداکننده فارسی */
function formatWithSep(val: string | number): string {
  if (val === '' || val === null || val === undefined) return '';
  const num = Number(String(val).replace(/[^0-9]/g, ''));
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('fa-IR');
}

const ALL_FIELDS: Array<{
  key: keyof Omit<MarketPrices, 'updatedAt'>;
  label: string;
  unit: string;
  icon: string;
  kind?: string;
}> = [
  { key: 'liveChicken', label: 'مرغ زنده', unit: 'تومان/کیلوگرم', icon: '🐔', kind: 'chicken' },
  { key: 'liveTurkey', label: 'بوقلمون زنده', unit: 'تومان/کیلوگرم', icon: '🦃', kind: 'turkey' },
  { key: 'liveGoose', label: 'غاز زنده', unit: 'تومان/کیلوگرم', icon: '🦢', kind: 'goose' },
  { key: 'liveDuck', label: 'اردک زنده', unit: 'تومان/کیلوگرم', icon: '🦆', kind: 'duck' },
  { key: 'liveQuail', label: 'بلدرچین زنده', unit: 'تومان/کیلوگرم', icon: '🐦', kind: 'quail' },
  { key: 'chickDay1', label: 'جوجه یک‌روزه', unit: 'تومان/عدد', icon: '🐣' },
  { key: 'eggTable', label: 'تخم‌مرغ خوراکی', unit: 'تومان/عدد', icon: '🥚' },
  { key: 'eggFertile', label: 'تخم نطفه‌دار', unit: 'تومان/عدد', icon: '🥚' },
  { key: 'culledBird', label: 'مرغ حذفی', unit: 'تومان/عدد', icon: '🐓' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  restrictToKinds?: string[];
}

export default function QuickPricesModal({ open, onClose, restrictToKinds }: Props) {
  const marketPrices = useSet(s => s.marketPrices) || DEFAULT_MARKET_PRICES;
  const setAllMarketPrices = useSet(s => s.setAllMarketPrices);

  const fields = restrictToKinds && restrictToKinds.length > 0
    ? ALL_FIELDS.filter(f => !f.kind || restrictToKinds.includes(f.kind))
    : ALL_FIELDS;

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const f: Record<string, string> = {};
    for (const field of fields) {
      const v = marketPrices[field.key];
      f[field.key] = v > 0 ? String(v) : '';
    }
    setForm(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const savedAt = marketPrices.updatedAt || '';

  const handleChange = (key: string, raw: string) => {
    const cleaned = toEn(raw.replace(/[^0-9۰-۹]/g, ''));
    setForm(f => ({ ...f, [key]: cleaned }));
  };

  const handleSave = () => {
    const prices: Record<string, number> = {};
    for (const field of fields) {
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
        قیمت‌ها را دستی وارد کنید. هر وقت خواستید آپدیت کنید.
        {savedAt && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
            آخرین به‌روزرسانی: {toFa(savedAt)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fields.map(field => (
          <Field key={field.key} label={`${field.icon} ${field.label} (${field.unit})`}>
            <Input
              value={formatWithSep(form[field.key] || '')}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder="مثلاً ۸۵,۰۰۰"
              inputMode="tel"
            />
          </Field>
        ))}
      </div>
    </Modal>
  );
}
