import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// ─── Lazy loading برای هر ماژول ───
const Dashboard = lazy(() => import('../../mod/dsh/Dashboard'));
const Settings = lazy(() => import('../../mod/set'));
const Brd = lazy(() => import('../../mod/brd'));
const Hal = lazy(() => import('../../mod/hal'));
const Flk = lazy(() => import('../../mod/flk'));
const Inc = lazy(() => import('../../mod/inc'));
const Egg = lazy(() => import('../../mod/egg'));
const Dlg = lazy(() => import('../../mod/dlg'));
const Whs = lazy(() => import('../../mod/whs'));
const Fed = lazy(() => import('../../mod/fed'));
const Cus = lazy(() => import('../../mod/ctc'));
const Rep = lazy(() => import('../../mod/rep'));
const Alt = lazy(() => import('../../mod/alt'));
const Cal = lazy(() => import('../../mod/cal'));
const Doc = lazy(() => import('../../mod/doc'));
const Arc = lazy(() => import('../../mod/arc'));
const Tra = lazy(() => import('../../mod/tra'));

function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--muted)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 600,
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div>در حال بارگذاری…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/set" element={<Settings />} />
        <Route path="/brd" element={<Brd />} />
        <Route path="/hal" element={<Hal />} />
        <Route path="/flk" element={<Flk />} />
        <Route path="/inc" element={<Inc />} />
        <Route path="/egg" element={<Egg />} />
        <Route path="/dlg" element={<Dlg />} />
        <Route path="/whs" element={<Whs />} />
        <Route path="/fed" element={<Fed />} />
        <Route path="/med" element={<Navigate to="/whs?tab=medicines" replace />} />
        <Route path="/tmd" element={<Navigate to="/whs/items" replace />} />
        <Route path="/sal" element={<Navigate to="/set?tab=about" replace />} />
        <Route path="/dea" element={<Navigate to="/tra?tab=deals" replace />} />
        <Route path="/tra" element={<Tra />} />
        <Route path="/ctc" element={<Cus />} />
        <Route path="/cus" element={<Navigate to="/ctc" replace />} />
        <Route path="/wrk" element={<Navigate to="/ctc?tab=worker" replace />} />
        <Route path="/rep" element={<Rep />} />
        <Route path="/alt" element={<Alt />} />
        <Route path="/cal" element={<Cal />} />
        <Route path="/doc" element={<Doc />} />
        <Route path="/arc" element={<Arc />} />
      </Routes>
    </Suspense>
  );
}
