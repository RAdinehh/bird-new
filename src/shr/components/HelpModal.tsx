import { useState, useEffect } from 'react';
import { useUI } from '../../cor/store/ui';
import { Btn, Modal } from './ui';

const STEPS = [
  {
    icon: '👋',
    title: 'خوش آمدید',
    desc: 'این نرم‌افزار برای مدیریت کامل مرغداری شما طراحی شده است.\n\nداده‌ها فقط روی گوشی خودتان ذخیره می‌شوند — بدون اینترنت و بدون سرور.',
    accent: 'accent'
  },
  {
    icon: '🐔',
    title: 'شروع کار',
    desc: 'برای شروع:\n\n۱. از منو، «پرنده‌ها» را باز کنید\n۲. یک پرنده بسازید (مثلاً مرغ)\n۳. یک نژاد برایش بسازید (مثلاً لگهورن)\n۴. یک «سالن» بسازید\n۵. یک «گله» بسازید',
    accent: 'info'
  },
  {
    icon: '📋',
    title: 'ثبت روزانه',
    desc: 'هر روز از ماژول «ثبت روزانه» استفاده کنید:\n\n• دما و رطوبت سالن\n• مقدار دان و آب مصرفی\n• تلفات با علت\n• واکسن و دارو\n• یادداشت‌ها',
    accent: 'warn'
  },
  {
    icon: '🥚',
    title: 'جوجه‌کشی و تخم',
    desc: 'اگر جوجه‌کشی می‌کنید:\n\n• «جوجه‌کشی» برای مدیریت دستگاه‌ها، ورودی تخم، کندلینگ و هچ\n• «تخم‌ها» برای ثبت تخم‌گذاری روزانه و فروش تخم',
    accent: 'purple'
  },
  {
    icon: '💰',
    title: 'مالی و معاملات',
    desc: 'همه‌ی خرید و فروش را در «معاملات» ثبت کنید.\n\nدر «گزارش‌ها» می‌توانید نمودارها، سود و زیان و تحلیل‌ها را ببینید.',
    accent: 'accent'
  },
  {
    icon: '🔔',
    title: 'هشدارهای هوشمند',
    desc: 'سیستم خودکار:\n\n• افت تخم‌گذاری\n• تلفات بالا\n• موجودی کم\n• سرسید معوق\n• نزدیک انقضا\n\nرا تشخیص می‌دهد و اعلان می‌کند.',
    accent: 'danger'
  },
  {
    icon: '💾',
    title: 'پشتیبان‌گیری',
    desc: 'از «تنظیمات» → «پشتیبان» می‌توانید:\n\n• فایل پشتیبان کامل بگیرید\n• داده‌ها را بازیابی کنید\n\nحتی می‌توانید فایل را در ایمیل یا تلگرام برای خودتان ذخیره کنید.',
    accent: 'info'
  }
];

export default function HelpModal() {
  const { helpOpen, closeHelp } = useUI();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (helpOpen) setStep(0);
  }, [helpOpen]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <Modal
      open={helpOpen}
      onClose={closeHelp}
      title="راهنمای سریع"
      footer={
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8 }}>
          {isLast ? (
            <Btn variant="primary" onClick={closeHelp}>شروع کار</Btn>
          ) : (
            <Btn variant="primary" onClick={() => setStep(s => s + 1)}>بعدی</Btn>
          )}
          {!isFirst ? (
            <Btn onClick={() => setStep(s => s - 1)}>قبلی</Btn>
          ) : null}
          {!isLast ? (
            <Btn onClick={closeHelp}>رد کردن</Btn>
          ) : null}
        </div>
      }
    >
      {/* نشانگر مراحل */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 10 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: i === step ? 'var(--' + current.accent + ')' : 'var(--border)',
            transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease'
          }} />
        ))}
      </div>

      {/* آیکون و عنوان */}
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div style={{
          width: 72, height: 72, margin: '0 auto',
          borderRadius: 'var(--r-2xl)',
          background: 'var(--' + current.accent + '-soft)',
          border: '2px solid var(--' + current.accent + ')',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36
        }}>{current.icon}</div>

        <div style={{
          fontSize: 'var(--fs-lg)', fontWeight: 700, marginTop: 14,
          color: 'var(--' + current.accent + ')'
        }}>
          {current.title}
        </div>
      </div>

      {/* متن */}
      <div style={{
        fontSize: 'var(--fs-sm)',
        lineHeight: 2,
        color: 'var(--text)',
        textAlign: 'right',
        whiteSpace: 'pre-line',
        padding: '12px 14px',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-md)'
      }}>
        {current.desc}
      </div>

      {/* شماره‌ی مرحله */}
      <div style={{
        textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--muted)'
      }}>
        مرحله {(step + 1).toString().replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])} از {'۷'}
      </div>
    </Modal>
  );
}
