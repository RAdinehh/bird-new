/**
 * ReminderModal.tsx — ثبت یادآوری برای فاکتور
 *
 * ۳ روش: تلفنی / حضوری / سایر (با کانال آزاد)
 * پیام قابل ویرایش با لحن صمیمی و محترمانه
 */
import { useState, useEffect, useRef } from 'react';
import { Btn, BtnRow, Field, Grid2, Input, Modal, SectionTitle, Textarea } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { daysUntilDue, daysUntilJalali } from '../helpers';
import { useSet } from '../../set/store';
import { useCtc } from '../../ctc/store';
import { useTra } from '../store';
import { getTodayJalali, addJalaliDays } from '../calc';
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
  invoiceId: string | null;
}

export default function ReminderModal({ open, onClose, invoiceId }: Props) {
  const invoice = useTra(s => invoiceId ? s.invoices.find(i => i.id === invoiceId) ?? null : null);
  const addReminder = useTra(s => s.addReminder);
  const allocations = useTra(s => s.allocations);
  const contacts = useCtc(s => s.contacts);
  const settingsState = useSet();

  const [channel, setChannel] = useState('واتس‌اپ');
  const [note, setNote] = useState('');
  const [intervalDaysStr, setIntervalDaysStr] = useState('');
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

      // 🆕 Pre-fill from existing nextReminderAt
      if (invoice.nextReminderAt) {
        setPromisedDate(invoice.nextReminderAt);
        const days = daysUntilJalali(invoice.nextReminderAt);
        if (days !== null && days >= 0) {
          setIntervalDaysStr(String(days));
        } else {
          setIntervalDaysStr('');
        }
      } else {
        setPromisedDate('');
        setIntervalDaysStr('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id, invoice?.lastRemindedAt, invoice?.nextReminderAt]);

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

  const handleDateChange = (newDate: string) => {
    setPromisedDate(newDate);
    if (!newDate) { setIntervalDaysStr(''); return; }
    const days = daysUntilJalali(newDate);
    if (days !== null && days >= 0) setIntervalDaysStr(String(days));
    else setIntervalDaysStr('');
  };

  const handleDaysChange = (rawVal: string) => {
    const cleaned = toEn(rawVal.replace(/[^0-9۰-۹]/g, ''));
    setIntervalDaysStr(cleaned);
    if (cleaned && parseInt(cleaned) > 0) {
      setPromisedDate(addJalaliDays(getTodayJalali(), parseInt(cleaned)));
    } else {
      setPromisedDate('');
    }
  };

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت یادآوری"
      size="md"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ثبت یادآوری</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      {/* Context box */}
      <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 800 }}>{salutation} {party?.name || '—'}</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>📦 {itemName} • <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{amountFa} تومان</strong></div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>📅 {daysPhrase}</div>
      </div>

      {/* کانال */}
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--muted)', marginBottom: 8, marginTop: 4 }}>کانال</div>
      <div style={{ display: 'flex', gap: 4, width: '100%', marginTop: 8 }}>
        {CHANNEL_PRESETS.map(c => (
          <button key={c} type="button" onClick={() => setChannel(c)} style={{ ...chipStyle(channel === c), flex: 1, padding: '6px 2px', fontSize: 'var(--fs-sm)', minWidth: 0 }}>
            {c}
          </button>
        ))}
        <button type="button" onClick={() => setChannel('')} style={{ ...chipStyle(isCustomChannel), flex: 1, padding: '6px 2px', fontSize: 'var(--fs-sm)', minWidth: 0 }}>
          سایر
        </button>
      </div>
      {isCustomChannel && (
        <Input value={channel} onChange={e => setChannel(e.target.value)} placeholder="نام کانال..." style={{ marginTop: 8 }} />
      )}

      {/* پیام */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--muted)' }}>پیام</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={handleShare} title="ارسال" style={{ width: 24, height: 24, borderRadius: 'var(--r-sm)', background: 'var(--btn-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>📤</button>
          <button type="button" onClick={handleCopy} title="کپی" style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--btn-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>📋</button>
        </div>
      </div>
      <div style={{ marginTop: 0 }}>
        <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={isMessageExpanded ? 8 : 4} maxHeight={isMessageExpanded ? 240 : 120} />
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
          <button type="button" onClick={() => setIsMessageExpanded(v => !v)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 'var(--fs-xs)', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, padding: 0 }}>
            {isMessageExpanded ? 'بستن' : 'باز کردن'}
          </button>
        </div>
      </div>

      {/* زمان‌بندی */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--muted)' }}>یادآوری بعدی</span>
          {(promisedDate || intervalDaysStr) && (
            <button
              type="button"
              onClick={() => { setPromisedDate(''); setIntervalDaysStr(''); }}
              title="پاک کردن یادآوری"
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--muted)', cursor: 'pointer',
                fontSize: 'var(--fs-xs)', padding: '2px 4px', fontFamily: 'inherit',
                fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2,
              }}
            >پاک کردن</button>
          )}
        </div>
        <Grid2>
          <DatePicker value={promisedDate} onChange={handleDateChange} />
          <Input
            value={toFa(intervalDaysStr)}
            onChange={e => handleDaysChange(e.target.value)}
            placeholder="دستی"
            unit="روز"
            inputMode="tel"
            style={{ textAlign: 'center' }}
          />
        </Grid2>
        {invoice?.lastRemindedAt && (() => {
          const d = daysUntilJalali(invoice.lastRemindedAt);
          const ago = d === null ? null : Math.abs(d);
          const agoLabel = ago === null ? '' : ago === 0 ? 'امروز' : `${toFa(ago)} روز پیش`;
          return (
            <div style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
            }}>
              <span>آخرین ثبت:</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(invoice.lastRemindedAt)}</span>
              {agoLabel && <span>— {agoLabel}</span>}
            </div>
          );
        })()}
      </div>


      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--border)', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--muted)' }}>یادداشت داخلی (اختیاری)</span>
      </div>
      <div>
        <Input value={note} onChange={e => setNote(e.target.value)} placeholder="توضیح دلخواه" />
      </div>
    </Modal>
  );
}
