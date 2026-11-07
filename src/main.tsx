import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './shr/styles/global.css';
import { registerSW } from 'virtual:pwa-register';
import ErrorBoundary from './shr/components/ErrorBoundary';
import { showAlert } from './cor/store/dialog';
import { applyTheme } from './cor/theme/applyTheme';
import { useSet } from './mod/set/store';
import { registerFlkHandlers } from './mod/flk/handlers';
import { useDlg } from './mod/dlg/store';
import { useFlk } from './mod/flk/store';
import { safeStorage } from './shr/utils/storage';
import { runFeedMigrationIfNeeded } from './mod/flk/migrations-feed-trigger';
import { registerWhsHandlers, registerEggWhsHandlers } from './mod/whs/handlers';

// ═══ اعمال تم قبل از React mount (صفر پرش) ═══
try {
  const s: any = useSet.getState();
  if (s && s.theme) {
    document.documentElement.setAttribute('data-theme', s.theme);
    applyTheme(
      s.theme,
      s.accentColor,
      s.fontSizePercent || 100,
      s.animations,
      s.lowPowerMode,
      s.highContrast,
      s.density
    );
  }
} catch (e) {
  /* silent */
}

// ثبت handlerهای Event Bus
registerFlkHandlers();
registerWhsHandlers();
registerEggWhsHandlers();

// ═══ Migration یک‌باره Feed (فاز ۹b) ═══
try {
  const result = runFeedMigrationIfNeeded({
    getLogs: () => useDlg.getState().logs,
    getExistingEvents: () => useFlk.getState().consumptionEvents,
    addEvent: (ev) => useFlk.getState().addConsumptionEvent(ev),
    getFlag: (k) => safeStorage.get(k),
    setFlag: (k, v) => safeStorage.set(k, v),
  });
  if (result.ran && result.migrated > 0) {
    console.info(`[feed-migration] ${result.migrated} رویداد از logs قدیمی migrate شد`);
  } else if (result.reason === 'error') {
    console.error('[feed-migration] migration failed');
  }
} catch (e) {
  try { console.error('[feed-migration] outer error:', e); } catch { /* double-catch */ }
}

// Override window.alert
window.alert = (msg: any) => {
  showAlert(String(msg));
};

// PWA
registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {}
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
