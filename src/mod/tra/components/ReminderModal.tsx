/**
 * ReminderModal.tsx — ثبت یادآوری برای فاکتور
 *
 * ۳ روش: تلفنی / حضوری / سایر (با کانال آزاد)
 * پیام قابل ویرایش با لحن صمیمی و محترمانه
 */
import { useState, useEffect, useRef } from 'react';
import { Btn, BtnRow, Field, Input, Modal, Textarea } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { daysUntilDue } from '../helpers';
import { useSet } from '../../set/store';
import { useCtc } from '../../ctc/store';
import { useTra } from '../store';
import { remaining } from '../calc';
import { copyText, shareText } from '../../../shr/utils/clipboard';
import { toastMsg } from '../../../cor/store/toast';
import DatePicker from '../../../shr/components/DatePicker';
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
  const [promisedDate, setPromisedDate] = useState('');
  const [message, setMessage] = useState('');
  const [isMessageExpanded, setIsMessageExpanded] = useState(false);

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

  // 🆕 scroll reset on open
  const modalContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      let el: HTMLElement | null = modalContentRef.current;
      while (el && el !== document.body) {
        if (el.scrollHeight > el.clientHeight + 10) {
          el.scrollTop = 0;
          break;
        }
        el = el.parentElement;
      }
    }, 100);
    return () => clearTimeout(id);
  }, [open]);

  const handleSave = () => {
    if (!invoice) return;
    const intervalDays = Math.max(1, Math.min(365, parseInt(toEn(intervalDaysStr)) || 7));
    addReminder(invoice.id, {
      method: 'other',
      methodLabel: channel.trim() || undefined,
      note: note.trim(),
      intervalDays,
      ...(promisedDate ? { promisedDate } : {}),
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
  const isCustomInterval = intervalDaysStr !== '' && !['3', '7', '30'].includes(intervalDaysStr);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت یادآوری"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, paddingTop: 16, marginTop: 16, borderTop: '1px solid var(--border)' }}>
          <Btn variant="primary" onClick={handleSave} style={{ flex: 1, padding: '11px 16px', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>ثبت یادآوری</Btn>
          <Btn onClick={onClose} style={{ flex: 1, padding: '11px 16px', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>لغو</Btn>
        </div>
      }
    >
      <div ref={modalContentRef} style={{ padding: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>

        {/* Context */}
        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 800 }}>{salutation} {party?.name || '—'}</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>📦 {itemName} • <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{amountFa} تومان</strong></div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>📅 {daysPhrase}</div>
        </div>

        {/* کانال */}
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 8 }}>کانال</div>
          <div style={{ display: 'flex', gap: 4, width: '100%' }}>
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
            <Input value={channel} onChange={e => setChannel(e.target.value)} placeholder="نام کانال..." style={{ marginTop: 8 }} />
          )}
        </div>

        {/* خط */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

        {/* پیام */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>پیام</div>
            <div style={{ display: 'flex', gap: 2 }}>
              <button type="button" onClick={handleShare} title="ارسال" style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>📤</button>
              <button type="button" onClick={handleCopy} title="کپی" style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>📋</button>
            </div>
          </div>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={isMessageExpanded ? 8 : 4} maxHeight={isMessageExpanded ? 240 : 120} />
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
            <button type="button" onClick={() => setIsMessageExpanded(v => !v)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 'var(--fs-xs)', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, padding: 0 }}>
              {isMessageExpanded ? 'بستن' : 'باز کردن'}
            </button>
          </div>
        </div>

        {/* خط */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

        {/* زمان‌بندی */}
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 8 }}>زمان‌بندی</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 6 }}>تاریخ قول مشتری (اختیاری)</div>
          <DatePicker value={promisedDate} onChange={setPromisedDate} />
          {promisedDate && (
            <div style={{ padding: '6px 10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginTop: 6 }}>
              یادآوری بعدی خودکار روی {toFa(promisedDate)} تنظیم شد
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)', fontWeight: 600 }}>یا</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 6 }}>یادآوری بعدی</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%', opacity: promisedDate ? 0.5 : 1, pointerEvents: promisedDate ? 'none' : 'auto' }}>
            {[3, 7, 30].map(d => (
              <button key={d} type="button" onClick={() => setIntervalDaysStr(String(d))} style={{ ...chipStyle(intervalDaysStr === String(d)), flex: 1, height: 32, padding: 0, fontSize: 'var(--fs-xs)', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {toFa(d)}
              </button>
            ))}
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                type="text"
                inputMode="tel"
                value={toFa(intervalDaysStr)}
                onChange={e => setIntervalDaysStr(toEn(e.target.value.replace(/[^0-9۰-۹]/g, '')))}
                placeholder="دلخواه"
                style={{
                  width: '100%',
                  height: 32,
                  boxSizing: 'border-box',
                  padding: '0 22px 0 4px',
                  fontSize: 'var(--fs-xs)',
                  textAlign: 'center',
                  background: isCustomInterval ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: `1px solid ${isCustomInterval ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)',
                  fontFamily: 'inherit',
                  color: isCustomInterval ? 'var(--accent)' : 'var(--text)',
                }}
              />
              <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: isCustomInterval ? 'var(--accent)' : 'var(--muted)', pointerEvents: 'none' }}>روز</span>
            </div>
          </div>
        </div>

        {/* یادداشت */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 8 }}>یادداشت داخلی (اختیاری)</div>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="توضیح دلخواه" />
        </div>

      </div>
    </Modal>
  );
}
