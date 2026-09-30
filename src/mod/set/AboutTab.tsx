import { useSet } from './store';
import { useState } from 'react';
import { Btn, Modal, Tag } from '../../shr/components/ui';
import { showConfirmAsync, showAlert, showSuccess } from '../../cor/store/dialog';
import { toFa } from '../../shr/utils/fa';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', padding: '4px 4px 8px', letterSpacing: '.5px' }}>{title}</div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
      <span style={{ fontSize: 'var(--fs-base)', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const FAQS: { q: string; a: string }[] = [
  { q: 'چطور اولین پرنده را اضافه کنم؟', a: 'از منو → پرنده‌ها و نژادها → پرنده‌ها → دکمه‌ی «+ افزودن پرنده». نام و چرخه زندگی را وارد کنید. بعد از پرنده، یک نژاد برایش بسازید.' },
  { q: 'چطور گله بسازم؟', a: 'ابتدا پرنده و نژاد و سالن بسازید. سپس از منو → گله‌ها → «+ افزودن گله». نام، نوع (تخم‌گذار/گوشتی/مادر)، پرنده، نژاد، سالن و تعداد را وارد کنید.' },
  { q: 'سن تخم‌گذاری چیست؟', a: 'سن طبیعی شروع تخم‌گذاری برای هر پرنده. پیش‌فرض برای مرغ صنعتی ۱۴۰ روز است. برای مرغ بومی ۱۵۰-۱۸۰ روز، برای بوقلمون ۱۸۰-۲۱۰ روز. می‌توانید در فرم گله این عدد را تغییر دهید.' },
  { q: 'چرا فرم تخم‌گذاری غیرفعال است؟', a: 'اگر سن گله کمتر از سن تخم‌گذاری باشد، فرم قفل می‌شود. با رسیدن به سن، خودکار فعال می‌شود. نوار پیشرفت زیر فرم، روزهای مانده را نشان می‌دهد.' },
  { q: 'جوجه‌کشی چطور کار می‌کند؟', a: 'از منو → جوجه‌کشی. اول یک «دستگاه» بسازید. سپس «ورودی تخم» ثبت کنید. تاریخ هچ خودکار محاسبه می‌شود (۲۱ روز برای مرغ). در روزهای ۷، ۱۲، ۱۸ «کندلینگ» ثبت کنید. در پایان «هچ» ثبت کنید.' },
  { q: 'Lock-down چیست؟', a: 'در ۳ روز آخر جوجه‌کشی (روز ۱۸ به بعد)، چرخش دستگاه قطع و رطوبت بالا می‌رود. این حالت را Lock-down می‌گویند.' },
  { q: 'پنجره‌ی هچ چیست؟', a: 'حدود ۲ روز قبل از هچ، جوجه‌ها شروع به خروج از تخم می‌کنند. این ۴۸ ساعت را پنجره‌ی هچ می‌گویند.' },
  { q: 'چطور FCR محاسبه می‌شود؟', a: 'FCR = مقدار دان مصرفی ÷ افزایش وزن (یا وزن تولید). عدد کمتر بهتر است. FCR استاندارد برای مرغ تخم‌گذار ۱٫۸-۲٫۲ است.' },
  { q: 'هشدارهای خودکار چطور کار می‌کنند؟', a: 'سیستم خودکار هر روز چند چیز را بررسی می‌کند: موجودی انبار، تاریخ انقضا، سرسید معوق، تلفات بالا، افت تخم‌گذاری. هشدارها در بخش «هشدارها» و بالای هدر نمایش داده می‌شوند.' },
  { q: 'پشتیبان‌گیری چطور کار می‌کند؟', a: 'تنظیمات → پشتیبان → «دریافت پشتیبان کامل». یک فایل JSON دانلود می‌شود که همه‌ی داده‌ها را دارد. برای بازیابی، همان فایل را انتخاب کنید.' },
  { q: 'داده‌ها کجا ذخیره می‌شوند؟', a: 'روی خود گوشی شما — در localStorage. هیچ داده‌ای به اینترنت فرستاده نمی‌شود. اگر مرورگر را پاک کنید، داده‌ها هم می‌روند. پس همیشه پشتیبان بگیرید.' },
  { q: 'چطور داده‌ها را در گوشی دیگر داشته باشم؟', a: 'پشتیبان JSON بگیرید، فایل را برای خودتان ایمیل یا تلگرام کنید، در گوشی دیگر فایل را باز کنید و بازیابی کنید.' },
  { q: 'رنگ اصلی را چطور عوض کنم؟', a: 'تنظیمات → ظاهر → رنگ اصلی. ۴ رنگ: سبز، آبی، نارنجی، بنفش.' },
  { q: 'اندازه فونت را چطور تغییر دهم؟', a: 'تنظیمات → ظاهر → اندازه فونت. ۴ حالت: کوچک، متوسط، بزرگ، خیلی بزرگ.' },
  { q: 'منوی پایین را چطور تغییر دهم؟', a: 'تنظیمات → ظاهر → منوی پایین. ۵ جای خالی که می‌توانید هر کدام را با یک ماژول دلخواه پر کنید.' },
  { q: 'تم تیره چطور فعال می‌شود؟', a: 'از هدر، دکمه‌ی ماه/خورشید. یا تنظیمات → ظاهر → تم.' },
  { q: 'چطور یک فاکتور چاپ کنم؟', a: 'معاملات → خرید یا فروش → روی فاکتور بزنید → «🖨 چاپ». می‌توانید فایل PDF ذخیره یا چاپ کنید.' },
  { q: 'چطور داده‌ها را در Excel ببینم؟', a: 'گزارش‌ها → مالی → پایین صفحه «📤 خروجی گرفتن». فایل CSV دانلود می‌شود که در Excel باز می‌شود.' },
  { q: 'چطور هشدار را به تعویق بیندازم؟', a: 'هشدارها → روی هشدار بزنید → «⏰ تعویق» → تاریخ انتخاب کنید. تا آن تاریخ پنهان می‌ماند.' },
  { q: 'میان‌برهای کیبورد چیست؟', a: 'Ctrl+H برای راهنما، ? برای لیست میان‌برها، Ctrl+1 تا Ctrl+9 برای پرش بین ماژول‌ها. در کامپیوتر کار می‌کنند.' }
];

const GUIDE_SECTIONS: { title: string; icon: string; items: string[] }[] = [
  {
    title: 'شروع کار',
    icon: '🚀',
    items: [
      'قبل از هر کاری، به تنظیمات بروید و نام مرغداری، آدرس و شماره تماس را وارد کنید',
      'پرنده و نژاد بسازید — مثلاً مرغ (لگهورن، بلاک استار)',
      'سالن بسازید و ابعاد آن را وارد کنید — مساحت و حجم خودکار محاسبه می‌شود',
      'مشتریان، فروشندگان و کارگران را در بخش «مخاطبین» ثبت کنید',
      'گله‌ی خود را با انتخاب پرنده، نژاد، سالن و تعداد بسازید'
    ]
  },
  {
    title: 'کارهای روزانه',
    icon: '📋',
    items: [
      'هر روز دما و رطوبت سالن را در «ثبت روزانه» وارد کنید',
      'مقدار دان و آب مصرفی را بنویسید',
      'تلفات را با علت دقیق ثبت کنید (بیماری، گرمازدگی، شکارچی و...)',
      'واکسن و دارو مصرفی را با دوز و شماره بچ بنویسید',
      'برای هر دارو، دوره‌ی منع مصرف را ثبت کنید'
    ]
  },
  {
    title: 'تخم و جوجه‌کشی',
    icon: '🥚',
    items: [
      'تخم‌گذاری روزانه را در «تخم‌ها» ثبت کنید — می‌توانید درصد بزنید یا تعداد',
      'سیستم خودکار نرخ تخم‌گذاری (Hen-Day) را محاسبه می‌کند',
      'برای جوجه‌کشی، دستگاه بسازید و ظرفیت آن را وارد کنید',
      'ورودی تخم را با نوع معامله (شخصی، شراکتی، اجاره‌ای، امانی) ثبت کنید',
      'در روز ۷، ۱۲ و ۱۸ کندلینگ انجام دهید و نتایج را بنویسید'
    ]
  },
  {
    title: 'مالی و معاملات',
    icon: '💰',
    items: [
      'هر خرید از فروشنده را در «معاملات → خرید» ثبت کنید',
      'هر فروش به مشتری را در «معاملات → فروش» ثبت کنید',
      'پرداخت‌ها را جزئی ثبت کنید (نقدی، کارت، چک)',
      'برای معاملات امانی، شراکتی یا تهاتر از «معاملات خاص» استفاده کنید',
      'در «مطالبات» ببینید چه کسی چقدر بدهکار است (Aging Buckets)'
    ]
  },
  {
    title: 'گزارش و تحلیل',
    icon: '📊',
    items: [
      'در «گزارش‌ها» ۴ تب دارید: مالی، تولید، گله، مقایسه',
      'نمودارها روند فروش، خرید، تخم و سود را نشان می‌دهند',
      'برای خروجی Excel، دکمه‌ی «📤 خروجی گرفتن» پایین صفحه',
      'برای PDF، «📄 گزارش کلی PDF» یا از دکمه‌ی چاپ فاکتور',
      'در هر بخش، روی کارت‌ها بزنید تا اطلاعات کامل باز شود'
    ]
  },
  {
    title: 'پشتیبان‌گیری',
    icon: '💾',
    items: [
      'هر هفته یک فایل پشتیبان کامل بگیرید',
      'تنظیمات → پشتیبان → «دریافت پشتیبان کامل»',
      'فایل را در ایمیل یا تلگرام برای خودتان بفرستید',
      'برای بازیابی، همان فایل را انتخاب کنید',
      'قبل از هر تغییر مهم، پشتیبان بگیرید'
    ]
  }
];

export default function AboutTab() {

  const resetHelpBanners = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('help-banner-'));
      keys.forEach(k => localStorage.removeItem(k));
      showSuccess('همه راهنماها دوباره فعال شدند. اکنون در صفحات مربوطه نمایش داده می‌شوند.');
    } catch (e) {
      // silent
    }
  };

  const reset = useSet(s => s.reset);
  const [openFaq, setOpenFaq] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const counts = {
    birds: JSON.parse(localStorage.getItem('pm-brd') || '{}')?.state?.birds?.length || 0,
    breeds: JSON.parse(localStorage.getItem('pm-brd') || '{}')?.state?.breeds?.length || 0,
    suppliers: JSON.parse(localStorage.getItem('pm-pur') || '{}')?.state?.suppliers?.length || 0,
    purchases: JSON.parse(localStorage.getItem('pm-pur') || '{}')?.state?.purchases?.length || 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-6)',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--r-xl)',
          background: 'linear-gradient(135deg, var(--accent), #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--fs-hero)', color: '#fff', fontWeight: 700
        }}>🐔</div>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>مدیریت مرغداری</div>
        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--muted)' }}>نسخه ۰.۱.۰ — نمونه</div>
        <Tag tone="green">آخرین نسخه</Tag>
      </div>

      <Section title="📊 آمار استفاده">
        <InfoRow label="پرنده‌ها" value={toFa(counts.birds)} />
        <InfoRow label="نژادها" value={toFa(counts.breeds)} />
        <InfoRow label="فروشندگان" value={toFa(counts.suppliers)} />
        <InfoRow label="خریدها" value={toFa(counts.purchases)} />
      </Section>

      <Section title="🎓 راهنما و آموزش">
        <Btn full onClick={() => setOpenFaq(true)}>❓ سؤالات متداول ({toFa(FAQS.length)})</Btn>
        <Btn full onClick={() => setOpenGuide(true)}>📖 راهنمای کاربری</Btn>
        <Btn full onClick={resetHelpBanners}>📖 نمایش مجدد راهنماهای صفحه‌ها</Btn>
        <Btn full onClick={() => { localStorage.removeItem('pm-onboarding-done'); showAlert('آموزش اولیه بازنشانی شد — صفحه را رفرش کنید'); }}>🔄 بازنشانی آموزش اولیه</Btn>
      </Section>

      {/* مودال سوالات متداول */}
      <Modal
        open={openFaq}
        onClose={() => { setOpenFaq(false); setExpandedFaq(null); }}
        title="❓ سؤالات متداول"
        footer={<Btn variant="primary" full onClick={() => { setOpenFaq(false); setExpandedFaq(null); }}>بستن</Btn>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FAQS.map((f, i) => {
            const isOpen = expandedFaq === i;
            return (
              <div key={i} style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                  style={{
                    padding: 'var(--pad-comfy)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>{toFa(i + 1)}.</span>
                  <span style={{
                    flex: 1,
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    color: 'var(--text)'
                  }}>{f.q}</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none"
                    stroke={isOpen ? 'var(--accent)' : 'var(--dim)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform .25s',
                      flexShrink: 0
                    }}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)'
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      padding: '0 14px 14px 40px',
                      fontSize: 'var(--fs-sm)',
                      color: 'var(--muted)',
                      lineHeight: 1.9,
                      borderTop: '1px dashed var(--border)',
                      paddingTop: 10,
                      marginTop: 2
                    }}>
                      {f.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* مودال راهنما */}
      <Modal
        open={openGuide}
        onClose={() => setOpenGuide(false)}
        title="📖 راهنمای کاربری"
        footer={<Btn variant="primary" full onClick={() => setOpenGuide(false)}>بستن</Btn>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GUIDE_SECTIONS.map((sec, i) => (
            <div key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 0 8px',
                borderBottom: '1px dashed var(--border)',
                marginBottom: 8
              }}>
                <span style={{ fontSize: 'var(--fs-lg)' }}>{sec.icon}</span>
                <span style={{
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  color: 'var(--accent)'
                }}>{sec.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sec.items.map((it, j) => (
                  <div key={j} style={{
                    display: 'flex', gap: 8,
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text)',
                    lineHeight: 1.8,
                    padding: '6px 0'
                  }}>
                    <span style={{
                      width: 6, height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                      marginTop: 8
                    }} />
                    <span style={{ flex: 1 }}>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{
            padding: 'var(--pad-comfy)',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--accent)',
            lineHeight: 1.8,
            textAlign: 'center'
          }}>
            💡 نکته: از دکمه‌ی «؟» در هدر یا `Ctrl + H` هر زمان که خواستید، راهنما را ببینید.
          </div>
        </div>
      </Modal>

      <Section title="📞 پشتیبانی و بازخورد">
        <Btn full onClick={() => showAlert('ارسال بازخورد — در گام بعدی')}>✉ ارسال بازخورد</Btn>
        <Btn full onClick={() => showAlert('بررسی بروزرسانی — در گام بعدی')}>🔍 بررسی بروزرسانی</Btn>
      </Section>

      <Section title="📜 قوانین">
        <Btn full onClick={() => showAlert('شرایط استفاده — در گام بعدی')}>شرایط استفاده</Btn>
        <Btn full onClick={() => showAlert('حریم خصوصی — در گام بعدی')}>سیاست حریم خصوصی</Btn>
      </Section>

      <Section title="⚠ منطقه خطر">
        <Btn full variant="danger" onClick={async () => { if (await showConfirmAsync('تأیید', 'بازنشانی تنظیمات به حالت اولیه؟', { danger: true, confirmText: 'بله' })) { reset(); location.reload(); } }}>بازنشانی تنظیمات</Btn>
      </Section>

      <div style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--dim)', padding: '10px 0' }}>
        ساخته‌شده برای مرغداری ایران 🇮🇷
        <br />
        با ❤ برای کسب‌وکار شما
      </div>
    
        
</div>
  );
}
