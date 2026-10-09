/**
 * Skeleton.tsx — نمایشگر بارگذاری (Loading Skeleton)
 *
 * طبق MODULE-AUDIT فاز Senior Review — «Loading & Async»
 *
 * استفاده:
 *   <Skeleton rows={3} />
 *   <Skeleton.Card />
 *   <Skeleton.Kpi />
 *
 * ویژگی:
 *   - انیمیشن shimmer ملایم
 *   - احترام به prefers-reduced-motion
 *   - استفاده از توکن‌های رنگی
 */

import { useEffect, useState } from 'react';
import { useSet } from '../../mod/set/store';

function useNoAnim(): boolean {
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduced(mq.matches);
      const h = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener('change', h);
      return () => mq.removeEventListener('change', h);
    } catch { /* silent */ }
  }, []);
  return !!(lowPower || reduced);
}

const SHIMMER_CSS = `
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

function Bar({ w, h = 14 }: { w: string | number; h?: number }) {
  const noAnim = useNoAnim();
  return (
    <div
      aria-hidden="true"
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: noAnim
          ? 'var(--input-bg)'
          : 'linear-gradient(90deg, var(--input-bg) 0%, var(--border) 50%, var(--input-bg) 100%)',
        backgroundSize: noAnim ? 'auto' : '200% 100%',
        animation: noAnim ? 'none' : 'skeleton-shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

interface SkeletonProps {
  rows?: number;
  card?: boolean;
}

export default function Skeleton({ rows = 3, card = true }: SkeletonProps) {
  const content = (
    <div
      role="status"
      aria-label="در حال بارگذاری"
      style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: card ? 14 : 0 }}
    >
      <style>{SHIMMER_CSS}</style>
      <Bar w="60%" h={16} />
      {Array.from({ length: rows }).map((_, i) => (
        <Bar key={i} w={i === rows - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
  if (!card) return content;
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      marginBottom: 8,
    }}>
      {content}
    </div>
  );
}

Skeleton.Card = function CardSkeleton() { return <Skeleton rows={2} card />; };
Skeleton.Row = function RowSkeleton() { return <Skeleton rows={1} card={false} />; };
Skeleton.Kpi = function KpiSkeleton() {
  const noAnim = useNoAnim();
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <style>{SHIMMER_CSS}</style>
      <div aria-hidden="true" style={{
        width: 48, height: 48, borderRadius: '50%',
        background: noAnim ? 'var(--input-bg)'
          : 'linear-gradient(90deg, var(--input-bg) 0%, var(--border) 50%, var(--input-bg) 100%)',
        backgroundSize: noAnim ? 'auto' : '200% 100%',
        animation: noAnim ? 'none' : 'skeleton-shimmer 1.4s ease-in-out infinite',
      }} />
      <Bar w="70%" h={12} />
    </div>
  );
};
