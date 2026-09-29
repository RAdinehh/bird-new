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
import OnboardingModal from './shr/components/OnboardingModal';

const TITLES: Record<string, string> = {
  '/': 'داشبورد', '/brd': 'پرنده‌ها و نژادها', '/hal': 'سالن‌ها', '/flk': 'گله‌ها',
  '/inc': 'جوجه‌کشی', '/egg': 'تخم‌ها', '/dlg': 'ثبت روزانه', '/whs': 'انبار',
  '/fed': 'جیره‌نویسی', '/rep': 'گزارش‌ها', '/ctc': 'مخاطبین',
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


export default function App() {
  const { theme } = useTheme();
  const settings = useSet();
  const [showOnb, setShowOnb] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('pm-onboarding-v2-done')) setShowOnb(true);
  }, []);

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
    </BrowserRouter>
  );
}
