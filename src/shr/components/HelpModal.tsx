import { useState, useEffect } from 'react';
import { useUI } from '../../cor/store/ui';
const readStorage = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const writeStorage = (k: string, v: string): void => {
  try {
    window.localStorage.setItem(k, v);
  } catch {}
};
const removeStorage = (k: string): void => {
  try {
    window.localStorage.removeItem(k);
  } catch {}
};
import { Btn, Modal } from './ui';

const DONT_SHOW_KEY = 'pm-help-dont-show';

const STEPS = [
  {
    icon: '👋',
    title: 'خوش آمدید',
    desc: 'به برنامه مدیریت پرورش پرندگان خوش آمدید.\n\nاین نرم‌افزار برای مدیریت گله‌ها، سالن‌ها، ثبت روزانه، جوجه‌کشی، جیره‌نویسی، انبار، معاملات و گزارش‌ها طراحی شده است تا همه امور پرورش را یک‌جا و دقیق پیش ببرید.',
    accent: 'accent'
  },
  {
    icon: '🐦',
    title: 'ترتیب شروع کار و پیش‌نیازها',
    desc: 'برای اینکه در ثبت اطلاعات دچار خطا یا دوباره‌کاری نشوید، این ترتیب را رعایت کنید:\n\n۱. از منو وارد «پرنده‌ها و نژادها» شوید و نوع پرنده (مانند مرغ، بوقلمون، کبک، بلدرچین و...) و نژاد آن را تعریف کنید\n۲. در «سالن‌ها»، سالن‌ها و بخش‌های پرورش را بسازید\n۳. در «مخاطبین»، فروشنده، مشتری یا کارگر را با نقش مشخص ثبت کنید\n۴. در «معاملات» فاکتور خرید ثبت کنید یا در «گله‌ها» گله جدید را بسازید',
    accent: 'info'
  },
  {
    icon: '📋',
    title: 'ثبت روزانه',
    desc: 'هر روز از بخش «ثبت روزانه» برای پایش دقیق گله‌ها استفاده کنید:\n\n• ثبت دما و رطوبت محیط پرورش\n• ثبت مقدار دان و آب مصرفی\n• ثبت تلفات همراه با علت آن\n• ثبت واکسن، دارو و داروگیاهی\n• ثبت وزن‌کشی و یادداشت‌های روزانه',
    accent: 'warn'
  },
  {
    icon: '🌾',
    title: 'جیره‌نویسی و تغذیه',
    desc: 'در بخش «جیره‌نویسی» برنامه تغذیه را متناسب با نوع پرنده، سن و دوره رشد یا تولید تنظیم کنید:\n\n• تعریف جیره برای دوره‌های مختلف پرورش\n• ترکیب دان، کنسانتره، مکمل‌ها و افزودنی‌های مجاز\n• مقایسه مصرف واقعی با برنامه تغذیه برای کاهش هزینه‌ها',
    accent: 'accent'
  },
  {
    icon: '📦',
    title: 'انبار و مدیریت موجودی',
    desc: 'در بخش «انبار» موجودی اقلام را به صورت دقیق و منظم پیگیری کنید:\n\n• تفکیک اقلام انبار مانند دان، دارو و داروگیاهی، واکسن و تجهیزات\n• ثبت ورود و خروج اقلام و بررسی موجودی باقیمانده\n• توجه به تاریخ انقضا و حداقل موجودی برای جلوگیری از کمبود ناگهانی',
    accent: 'info'
  },
  {
    icon: '🌿',
    title: 'بهداشت، دارو و داروگیاهی',
    desc: 'در بخش سلامت و پیشگیری گله می‌توانید هم از روش‌های دارویی و واکسیناسیون و هم از داروگیاهی بهره ببرید:\n\n• ثبت برنامه‌های واکسیناسیون و دوره‌های درمان\n• استفاده از داروگیاهی و عصاره‌های گیاهی برای تقویت بنیه، بهبود گوارش یا کاهش تنش‌های محیطی\n• بررسی وضعیت سلامت و تلفات پس از هر اقدام در سوابق و گزارش‌ها',
    accent: 'warn'
  },
  {
    icon: '🥚',
    title: 'جوجه‌کشی و تولید تخم',
    desc: 'متناسب با نوع فعالیت خود از این بخش‌ها استفاده کنید:\n\n• «جوجه‌کشی» برای مدیریت دستگاه‌ها، ورود تخم، کندلینگ، انتقال به ستر یا هچر و ثبت نتیجه هچ\n• «تخم‌ها» برای ثبت تولید روزانه، درجه‌بندی یا شکستگی و فروش تخم',
    accent: 'purple'
  },
  {
    icon: '💰',
    title: 'مالی و معاملات',
    desc: 'همه خریدها (مانند دان، پرنده، دارو، داروگیاهی و تجهیزات) و فروش‌ها را در «معاملات» ثبت کنید.\n\nدر «گزارش‌ها» روند رشد، میزان مصرف، سود و زیان و مقایسه گله‌ها را به صورت شفاف ببینید.',
    accent: 'accent'
  },
  {
    icon: '🔔',
    title: 'هشدارهای هوشمند',
    desc: 'بخش هشدارها موارد حساس را به صورت خودکار بررسی و اعلام می‌کند:\n\n• افت تولید یا کاهش عملکرد گله\n• افزایش غیرعادی تلفات\n• کاهش موجودی انبار یا دان\n• سررسیدهای مالی نزدیک یا معوق\n• نزدیک شدن به تاریخ انقضای اقلام',
    accent: 'danger'
  },
  {
    icon: '💾',
    title: 'پشتیبان‌گیری و امنیت',
    desc: 'از مسیر «تنظیمات» ← «پشتیبان» می‌توانید:\n\n• فایل پشتیبان کامل از اطلاعات تهیه کنید\n• در صورت نیاز اطلاعات را بازیابی کنید\n\nبهتر است به صورت منظم یک نسخه پشتیبان در محل امن، ایمیل یا پیام‌رسان شخصی خود نگه دارید.',
    accent: 'info'
  }
];

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toFaStep = (n: number) => String(n).replace(/[0-9]/g, d => FA_DIGITS[+d]);

export default function HelpModal() {
  const { helpOpen, closeHelp } = useUI();
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (helpOpen) {
      setStep(0);
      setDontShowAgain(readStorage(DONT_SHOW_KEY) === '1');
    }
  }, [helpOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      writeStorage(DONT_SHOW_KEY, '1');
    } else {
      removeStorage(DONT_SHOW_KEY);
    }
    closeHelp();
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <Modal
      open={helpOpen}
      onClose={handleClose}
      title="راهنمای سریع"
      footer={
        <div
          className="help-modal-footer"
          onMouseDown={(e) => e.preventDefault()}
          onFocus={(e) => {
            const el = e.target as HTMLElement | null;
            if (el && el.tagName === 'BUTTON') {
              el.blur();
            }
          }}
          style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, width: '100%' }}
        >
          <style>{`
            .help-modal-footer button,
            .help-modal-footer button:focus,
            .help-modal-footer button:focus-visible,
            .help-modal-footer button:active {
              outline: none !important;
              box-shadow: none !important;
            }
            .help-modal-footer button {
              flex: 1 1 0 !important;
              min-width: 0 !important;
            }
          `}</style>
          {isLast ? (
            <Btn variant="primary" onClick={handleClose}>شروع کار</Btn>
          ) : (
            <Btn variant="primary" onClick={() => setStep(s => s + 1)}>بعدی</Btn>
          )}
          {!isFirst ? (
            <Btn onClick={() => setStep(s => s - 1)}>قبلی</Btn>
          ) : null}
          {!isLast ? (
            <Btn onClick={handleClose}>رد کردن</Btn>
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
        fontSize: '13px',
        lineHeight: 2.05,
        color: 'var(--text)',
        textAlign: 'right',
        whiteSpace: 'pre-line',
        padding: '14px 16px',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-md)'
      }}>
        {current.desc}
      </div>

      {/* شماره‌ی مرحله */}
      <div style={{
        textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--muted)'
      }}>
        مرحله {toFaStep(step + 1)} از {toFaStep(STEPS.length)}
      </div>

      {/* تیک عدم نمایش مجدد - پایین و سمت راست بدون کادر */}
      <div dir="rtl" style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
            fontSize: "var(--fs-sm)",
            color: "var(--text)",
          }}
        >
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer", margin: 0 }}
          />
          <span>دیگر نمایش داده نشود</span>
        </label>
      </div>
    </Modal>
  );
}
