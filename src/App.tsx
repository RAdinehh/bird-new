import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useTheme } from './cor/store/theme';
import { useSet } from './mod/set/store';
import { applyTheme } from './cor/theme/applyTheme';
import Header from './shr/components/Header';
import BottomNav from './shr/components/BottomNav';
import MenuDrawer from './shr/components/MenuDrawer';
import HelpModal from './shr/components/HelpModal';
import ShortcutsModal from './shr/components/ShortcutsModal';
import DialogHost from './shr/components/DialogHost';
import AppRouter from './cor/router/AppRouter';
import { useKeyboard } from './shr/hooks/useKeyboard';
import { Btn } from './shr/components/ui';

const TITLES: Record<string, string> = {
  '/': 'داشبورد', '/brd': 'پرنده‌ها و نژادها', '/hal': 'سالن‌ها', '/flk': 'گله‌ها',
  '/inc': 'جوجه‌کشی', '/egg': 'تخم‌ها', '/dlg': 'ثبت روزانه', '/whs': 'انبار',
  '/fed': 'جیره‌نویسی', '/med': 'دارو و واکسن', '/tmd': 'طب سنتی', '/sal': 'فروش',
  '/dea': 'معاملات خاص', '/cus': 'مخاطبین', '/wrk': 'کارگران', '/rep': 'گزارش‌ها',
  '/alt': 'هشدارها',
  '/cal': 'تقویم',
  '/doc': 'اسناد و فایل‌ها', '/arc': 'آرشیو', '/set': 'تنظیمات', '/tra': 'معاملات'
};

const FIRST_VISIT_KEY = 'pm-onboarding-done';

function Layout() {
  const loc = useLocation();
  const title = TITLES[loc.pathname] ?? 'مدیریت مرغداری';
  useKeyboard();

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 80
    }}>
      <Header title={title} />
      <MenuDrawer />
      <HelpModal />
      <ShortcutsModal />
      <DialogHost />
      <main key={loc.pathname}>
        <AppRouter />
      </main>
      <BottomNav />
    </div>
  );
}

function OnboardingBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(FIRST_VISIT_KEY);
    if (!done) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(FIRST_VISIT_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 90, left: 16, right: 16,
      maxWidth: 448, margin: '0 auto',
      background: 'var(--card-solid)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--r-lg)',
      padding: '14px 16px',
      boxShadow: 'var(--shadow)',
      zIndex: 30,
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>👋</span>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, flex: 1 }}>
          اولین بار است وارد می‌شوید؟
        </span>
      </div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
        برای آشنایی با نرم‌افزار، راهنمای کوتاه را ببینید یا دکمه‌ی «؟» را در هدر بزنید.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="primary" size="sm" onClick={() => { dismiss(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true })); }} style={{ flex: 1 }}>
          دیدن راهنما
        </Btn>
        <Btn size="sm" onClick={dismiss} style={{ flex: 1 }}>رد کردن</Btn>
      </div>
    </div>
  );
}

export default function App() {
  const { theme } = useTheme();
  const settings = useSet();

  // اعمال تم
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // اعمال تنظیمات ظاهر — رنگ اصلی، فونت، انیمیشن، کنتراست
  useEffect(() => {
    applyTheme(
      theme,
      settings.accentColor,
      settings.fontSize,
      settings.animations,
      settings.lowPowerMode,
      settings.highContrast
    );
  }, [
    theme,
    settings.accentColor,
    settings.fontSize,
    settings.animations,
    settings.lowPowerMode,
    settings.highContrast
  ]);

  return (
    <BrowserRouter>
      <Layout />
      <OnboardingBanner />
    </BrowserRouter>
  );
}
