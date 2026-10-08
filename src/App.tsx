import { useEffect, useState } from 'react';
import { safeStorage } from './shr/utils/storage';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useSet } from './mod/set/store';
import { applyTheme } from './cor/theme/applyTheme';
import Header from './shr/components/Header';
import BottomNav from './shr/components/BottomNav';
import MenuDrawer from './shr/components/MenuDrawer';
import HelpModal from './shr/components/HelpModal';
import ShortcutsModal from './shr/components/ShortcutsModal';
import DialogHost from './shr/components/DialogHost';
import ToastHost from './shr/components/ToastHost';
import AppRouter from './cor/router/AppRouter';
import { useKeyboard } from './shr/hooks/useKeyboard';
import { useAutoBackup } from './shr/hooks/useAutoBackup';
import OnboardingModal from './shr/components/OnboardingModal';
import LockScreen from './shr/components/LockScreen';
import { useAutoLock } from './shr/hooks/useAutoLock';
import DebugPanel from './cor/events/DebugPanel';
import FloatingAdd from './cor/ui/FloatingAdd';

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
  useAutoBackup();

  // اسکرول به بالا موقع ناوبری (بجای remount کردن main)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100svh', paddingBottom: 80, boxSizing: 'border-box'
    }}>
      <Header title={title} />
      <MenuDrawer />
      <HelpModal />
      <ShortcutsModal />
      <FloatingAdd />
      <ToastHost />
      <DialogHost />
      <main>
        <AppRouter />
      </main>
      <BottomNav />
      <DebugPanel />
    </div>
  );
}


export default function App() {
  const settings = useSet();
  const theme = settings.theme;  // single source of truth
  const [showOnb, setShowOnb] = useState(false);
  const { locked, unlock } = useAutoLock();

  useEffect(() => {
    if (!safeStorage.get('pm-onboarding-v2-done')) setShowOnb(true);
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
      settings.fontSizePercent || 100,
      settings.animations,
      settings.lowPowerMode,
      settings.highContrast,
      settings.density
    );
  }, [
    theme,
    settings.accentColor,
    settings.fontSizePercent,
    settings.animations,
    settings.lowPowerMode,
    settings.highContrast,
    settings.density
  ]);

  // قفل خودکار
  if (locked) return <LockScreen onUnlock={unlock} />;

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
