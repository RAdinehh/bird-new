import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './shr/styles/global.css';
import { registerSW } from 'virtual:pwa-register';
import ErrorBoundary from './shr/components/ErrorBoundary';
import { showAlert } from './cor/store/dialog';
import { applyTheme } from './cor/theme/applyTheme';
import { useSet } from './mod/set/store';

// ═══ اعمال تم قبل از React mount (صفر پرش) ═══
try {
  const s: any = useSet.getState();
  if (s && s.theme) {
    document.documentElement.setAttribute('data-theme', s.theme);
    applyTheme(
      s.theme,
      s.accentColor,
      s.fontSize,
      s.animations,
      s.lowPowerMode,
      s.highContrast,
      s.density
    );
  }
} catch (e) {
  /* silent */
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
