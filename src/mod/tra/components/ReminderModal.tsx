/**
 * ReminderModal.tsx — ثبت یادآوری برای فاکتور
 *
 * ۳ روش: تلفنی / حضوری / سایر (با کانال آزاد)
 * پیام قابل ویرایش با لحن صمیمی و محترمانه
 */
import { useState, useEffect } from 'react';
import { Btn, BtnRow, Field, Input, Modal, Textarea } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { daysUntilDue } from '../helpers';
import { useSet } from '../../set/store';
import { useCtc } from '../../ctc/store';
import { useTra } from '../store';
import { remaining } from '../calc';
import { copyText, shareText } from '../../../shr/utils/clipboard';
import { toastMsg } from '../../../cor/store/toast';
import type { Invoice } from '../types';

const CAT_LABEL: Record<string, string> = {
  chick: 'جوجه یک‌روزه',
  adult: 'پرنده بالغ',
  egg: 'تخم',
  fertile_egg: 'تخم نطفه‌دار',
  broken: 'تخم شکسته',
  feed: 'دان',
  medicine: 'دارو',
  vaccine: 'واکسن',
  herbal: 'داروی گیاهی',
  equipment: 'تجهیزات',
  manure: 'کود',
  other: 'سایر',
};

function getFarmName(state: unknown): string {
  if (!state || typeof state !== 'object') return 'مرغداری';
  if (!('farm' in state)) return 'مرغداری';
  const farm = state.farm;
  if (!farm || typeof farm !== 'object') return 'مرغداری';
  if (!('name' in farm)) return 'مرغداری';
  const name = farm.name;
  return typeof name === 'string' && name.trim() ? name : 'مرغداری';
}

const CHANNEL_PRESETS = ['واتس‌اپ', 'پیامک', 'تلگرام', 'اینستاگرام', 'ایمیل'];

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function ReminderModal({ open, onClose, invoice }: Props) {
  const addReminder = useTra(s => s.addReminder);
  const allocations = useTra(s => s.allocations);
  const contacts = useCtc(s => s.contacts);
  const settingsState = useSet();

  const [channel, setChannel] = useState('واتس‌اپ');
  const [note, setNote] = useState('');
  const [intervalDaysStr, setIntervalDaysStr] = useState('7');
  const [message, setMessage] = useState('');

  const party = invoice ? contacts.find(c => c.id === invoice.partyId) : null;
  const salutation = party?.gender === 'male' ? 'جناب آقای' : party?.gender === 'female' ? 'سرکار خانم' : 'جناب';
  const lastName = party?.name?.trim().split(/\s+/).slice(-1)[0] || party?.name || '';
  const farmName = getFarmName(settingsState);
  const amount = invoice ? remaining(invoice, allocations) : 0;
  const days = invoice ? daysUntilDue(invoice) : null;
  const itemName = invoice
    ? (invoice.items?.[0]?.description || CAT_LABEL[invoice.category] || invoice.category || '—')
    : '';
  const amountFa = toFa(amount.toLocaleString('fa-IR'));
  const daysPhrase = days === null
    ? ''
    : days < 0
      ? `${toFa(Math.abs(days))} روز از سررسید گذشته`
      : days === 0
        ? 'سرسید امروز است'
        : `${toFa(days)} روز تا سررسید مانده`;

  const generateMessage = (): string => {
    if (!invoice || !party) return '';
    return `سلام ${salutation} ${lastName} عزیز 🌹
امیدوارم حالتون خوب باشه

یادآوری دوستانه:
📦 خرید «${itemName}»
💰 مبلغ: ${amountFa} تومان
📅 ${daysPhrase}

ان‌شاءالله فرصتی داشتید، لطف می‌کنید تسویه بفرمایید.
از همراهی و اعتمادتون صمیمانه سپاسگزارم 🙏

با احترام،
${farmName} 🐔`;
  };

  useEffect(() => {
    if (open && invoice && party) {
      setMessage(generateMessage());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  const handleSave = () => {
    if (!invoice) return;
    const intervalDays = Math.max(1, Math.min(365, parseInt(toEn(intervalDaysStr)) || 7));
    addReminder(invoice.id, {
      method: 'other',
      methodLabel: channel.trim() || undefined,
      note: note.trim(),
      intervalDays,
    });
    toastMsg.saved();
    onClose();
  };

  const handleCopy = async () => {
    const ok = await copyText(message);
    if (ok) toastMsg.success('کپی شد');
    else toastMsg.error('کپی نشد');
  };

  const handleShare = async () => {
    const result = await shareText({ title: `یادآوری ${party?.name || ''}`, text: message });
    if (result.status === 'shared') toastMsg.success('ارسال شد');
    else if (result.status === 'copied') toastMsg.info('کپی شد — در اپ دیگر paste کنید');
    else if (result.status === 'failed') toastMsg.error('اشتراک ناموفق');
  };

  if (!invoice) return null;

  const chipStyle = (active: boolean) => ({
    padding: '6px 12px',
    fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const isCustomChannel = !CHANNEL_PRESETS.includes(channel);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📨 ثبت یادآوری"
      size="md"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ثبت یادآوری</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        marginBottom: 'var(--sp-2)',
        fontSize: 'var(--fs-sm)',
        lineHeight: 1.8,
      }}>
        <div style={{ fontWeight: 700 }}>{salutation} {party?.name || '—'}</div>
        <div style={{ color: 'var(--muted)' }}>📦 {itemName} • 💰 {amountFa} تومان</div>
        <div style={{ color: 'var(--muted)' }}>📅 {daysPhrase}</div>
      </div>

      <Field label="کانال">
        <div style={{ display: 'flex', gap: 4, width: '100%', marginBottom: isCustomChannel ? 6 : 0 }}>
          {CHANNEL_PRESETS.map(c => (
            <button key={c} type="button" onClick={() => setChannel(c)} style={{ ...chipStyle(channel === c), flex: 1, padding: '6px 2px', fontSize: 'var(--fs-xs)', minWidth: 0 }}>
              {c}
            </button>
          ))}
          <button type="button" onClick={() => setChannel('')} style={{ ...chipStyle(isCustomChannel), flex: 1, padding: '6px 2px', fontSize: 'var(--fs-xs)', minWidth: 0 }}>
            سایر
          </button>
        </div>
        {isCustomChannel && (
          <Input
            value={channel}
            onChange={e => setChannel(e.target.value)}
            placeholder="نام کانال..."
            autoFocus={false}
          />
        )}
      </Field>

      <Field label="پیام">
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={8}
          maxHeight={240}
        />
      </Field>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn size="sm" variant="outline" onClick={handleShare} style={{ flex: 1 }}>📤 ارسال پیام</Btn>
        <Btn size="sm" variant="outline" onClick={handleCopy} style={{ flex: 1 }}>📋 کپی</Btn>
      </div>


      <Field label="یادآوری بعدی">
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
          {[3, 7, 30].map(d => (
            <button key={d} type="button" onClick={() => setIntervalDaysStr(String(d))} style={{ ...chipStyle(intervalDaysStr === String(d)), flex: 1, height: 32, padding: 0, fontSize: 'var(--fs-sm)', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {toFa(d)}
            </button>
          ))}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              inputMode="tel"
              value={toFa(intervalDaysStr)}
              onChange={e => setIntervalDaysStr(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
              style={{
                width: '100%',
                height: 32,
                boxSizing: 'border-box',
                padding: '0 0 0 16px',
                fontSize: 'var(--fs-sm)',
                textAlign: 'center',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--muted)', pointerEvents: 'none' }}>روز</span>
          </div>
        </div>
      </Field>

      <Field label="یادداشت داخلی (اختیاری)">
        <Input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="گفت تا آخر هفته می‌آره"
        />
      </Field>
    </Modal>
  );
}
