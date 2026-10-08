import { useSet } from './store';
import { safeStorage } from '../../shr/utils/storage';
import { StatCard, LinkRow } from './components/AboutCards';
import FaqModal from './components/FaqModal';
import GuideModal from './components/GuideModal';
import { FAQS } from './data-about';
import { useState } from 'react';
import { Btn, Modal, Tag } from '../../shr/components/ui';
import { showConfirmAsync, showAlert, showSuccess } from '../../cor/store/dialog';
import { toFa } from '../../shr/utils/fa';
import { Section, SubSection } from './helpers';

export default function AboutTab() {
  const resetHelpBanners = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('help-banner-'));
      keys.forEach(k => localStorage.removeItem(k));
      showSuccess('همه راهنماها دوباره فعال شدند. اکنون در صفحات مربوطه نمایش داده می‌شوند.');
    } catch {
      /* silent */
    }
  };

  const reset = useSet(s => s.reset);
  const [openFaq, setOpenFaq] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
      
  const counts = {
    birds: (safeStorage.getJSON('pm-brd', {}) as { state?: { birds?: unknown[] } })?.state?.birds?.length || 0,
    breeds: (safeStorage.getJSON('pm-brd', {}) as { state?: { breeds?: unknown[] } })?.state?.breeds?.length || 0,
    suppliers: (safeStorage.getJSON('pm-pur', {}) as { state?: { suppliers?: unknown[] } })?.state?.suppliers?.length || 0,
    purchases: (safeStorage.getJSON('pm-pur', {}) as { state?: { purchases?: unknown[] } })?.state?.purchases?.length || 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

      {/* ═══ ۱. درباره برنامه ═══ */}
      <Section title="🐔 درباره‌ی برنامه">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '4px 0',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, black))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: '#fff', fontWeight: 700,
            flexShrink: 0,
          }} aria-hidden="true">🐔</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>
              مدیریت مرغداری
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
              نسخه ۰.۹.۱ · PWA آفلاین
            </div>
          </div>
          <Tag tone="green">آخرین</Tag>
        </div>
      </Section>

      {/* ═══ ۲. آمار شما (بصری) ═══ */}
      <Section title="📊 آمار شما">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          <StatCard icon="🐔" value={counts.birds} label="پرنده" tone="accent" />
          <StatCard icon="🏷️" value={counts.breeds} label="نژاد" tone="info" />
          <StatCard icon="👥" value={counts.suppliers} label="فروشنده" tone="purple" />
          <StatCard icon="🛒" value={counts.purchases} label="خرید" tone="warn" />
        </div>
      </Section>

      {/* ═══ ۳. راهنما و آموزش ═══ */}
      <Section title="🎓 راهنما و آموزش">
        <LinkRow icon="❓" label={`سؤالات متداول (${toFa(FAQS.length)})`} onClick={() => setOpenFaq(true)} />
        <LinkRow icon="📖" label="راهنمای کاربری" onClick={() => setOpenGuide(true)} />
        <LinkRow icon="💡" label="نمایش مجدد راهنماهای صفحه‌ها" onClick={resetHelpBanners} />
        <LinkRow
          icon="🔄"
          label="بازنشانی آموزش اولیه"
          onClick={() => {
            safeStorage.remove('pm-onboarding-done');
            showAlert('آموزش اولیه بازنشانی شد — صفحه را رفرش کنید');
          }}
        />
      </Section>


      {/* ═══ ۴. ارتباط و اطلاعات ═══ */}
      <Section title="📞 ارتباط و اطلاعات">
        <LinkRow icon="✉️" label="ارسال بازخورد" onClick={() => showAlert('ارسال بازخورد — در گام بعدی')} />
        <LinkRow icon="🔍" label="بررسی بروزرسانی" onClick={() => showAlert('بررسی بروزرسانی — در گام بعدی')} />
        <LinkRow icon="📜" label="شرایط استفاده" onClick={() => showAlert('شرایط استفاده — در گام بعدی')} />
        <LinkRow icon="🔒" label="سیاست حریم خصوصی" onClick={() => showAlert('حریم خصوصی — در گام بعدی')} />
      </Section>

      {/* ═══ ۵. عملیات حساس ═══ */}
      <Section title="⚠️ عملیات حساس">
        <SubSection label="بازنشانی" icon="🚨" />
        <Btn
          full
          variant="danger"
          onClick={async () => {
            if (await showConfirmAsync('تأیید', 'بازنشانی تنظیمات به حالت اولیه؟', { danger: true, confirmText: 'بله' })) {
              reset();
              location.reload();
            }
          }}
        >
          🗑 بازنشانی تنظیمات به پیش‌فرض
        </Btn>
      </Section>

      {/* فوتر */}
      <div style={{
        textAlign: 'center',
        fontSize: 'var(--fs-xs)',
        color: 'var(--dim)',
        padding: '10px 0',
      }}>
        ساخته‌شده برای مرغداری ایران 🇮🇷
        <br />
        با ❤ برای کسب‌وکار شما
      </div>

    </div>
  );
}
