import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './shr/styles/global.css';
import { registerSW } from 'virtual:pwa-register';
import ErrorBoundary from './shr/components/ErrorBoundary';
import { showAlert } from './cor/store/dialog';

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
