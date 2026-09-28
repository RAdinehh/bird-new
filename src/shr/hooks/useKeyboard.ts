import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../cor/store/ui';

const NAV_SHORTCUTS: Record<string, string> = {
  '1': '/',
  '2': '/brd',
  '3': '/hal',
  '4': '/flk',
  '5': '/inc',
  '6': '/dlg',
  '7': '/whs',
  '8': '/rep',
  '9': '/set'
};

export function useKeyboard() {
  const nav = useNavigate();
  const { openHelp, openShortcuts, closeHelp, closeShortcuts } = useUI();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      // اگر در ورودی هستیم، میان‌برها غیرفعال
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable;

      // Esc — بستن همه‌چیز
      if (e.key === 'Escape') {
        closeHelp();
        closeShortcuts();
        return;
      }

      // ? یا Shift + / — نمایش لیست میان‌برها
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !inInput) {
        e.preventDefault();
        openShortcuts();
        return;
      }

      // Ctrl + H — راهنما
      if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        openHelp();
        return;
      }

      // Ctrl + عدد — ناوبری
      if (e.ctrlKey && NAV_SHORTCUTS[e.key]) {
        e.preventDefault();
        nav(NAV_SHORTCUTS[e.key]);
        return;
      }

      // Ctrl + F — جستجو در صفحه (focus روی اولین input جستجو)
      if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) {
        const searchInput = document.querySelector('input[placeholder*="جستجو"]') as HTMLInputElement | null;
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nav, openHelp, openShortcuts, closeHelp, closeShortcuts]);
}
