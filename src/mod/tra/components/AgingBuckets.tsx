/**
 * AgingBuckets.tsx — کامپوننت ژنریک Aging Buckets
 * استفاده در: مطالبات / بدهی / معاملات
 * استاندارد: Stripe/Odoo — بدون رنگ اضافه، سلسله‌مراتب ۲ سطحی
 */
import { useState, useMemo, type ReactNode } from 'react';
import { AGING_BUCKETS, type AgingBucket } from '../calc';
import { toFa } from '../../../shr/utils/fa';

type BucketKey = AgingBucket;

interface BucketAction<T> {
  label: string;
  icon?: string;
  primary?: boolean;
  onClick: (items: T[]) => void;
}

interface Props<T extends { id: string }> {
  items: T[];
  bucketOf: (item: T) => BucketKey;
  sumOf: (item: T) => number;
  renderSummary: (item: T) => ReactNode;
  renderDetails?: (item: T) => ReactNode;
  groupActions?: BucketAction<T>[];
  emptyText?: string;
}

export default function AgingBuckets<T extends { id: string }>({
  items, bucketOf, sumOf, renderSummary, renderDetails, groupActions, emptyText,
}: Props<T>) {
  const [openBucket, setOpenBucket] = useState<BucketKey | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const byBucket = useMemo(() => {
    const map: Record<BucketKey, T[]> = { 'current': [], '1-30': [], '31-60': [], '61-90': [], '91-180': [], '181-365': [], '+365': [] };
    items.forEach(it => { map[bucketOf(it)].push(it); });
    return map;
  }, [items, bucketOf]);

  const nonEmpty = AGING_BUCKETS.filter(b => byBucket[b.key as BucketKey].length > 0);

  if (nonEmpty.length === 0) {
    return emptyText ? (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
        {emptyText}
      </div>
    ) : null;
  }

  return (
    <>
      {nonEmpty.map(({ key, label }) => {
        const bucketItems = byBucket[key as BucketKey];
        const isOpen = openBucket === key;
        const total = bucketItems.reduce((s, it) => s + sumOf(it), 0);

        return (
          <div
            key={key}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => { setOpenBucket(isOpen ? null : key as BucketKey); setOpenItem(null); }}
              style={{
                width: '100%',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px',
                background: 'transparent', border: 'none',
                borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--text)' }}>{label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--muted)',
                  padding: '1px 7px', borderRadius: 10, border: '1px solid var(--border)',
                }}>
                  {toFa(bucketItems.length)} مورد
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-md)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {toFa(total.toLocaleString('fa-IR'))} ت
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round"
                  style={{ marginRight: 8, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <>
                {groupActions && groupActions.length > 0 && (
                  <div style={{
                    display: 'flex', gap: 6, padding: '8px 12px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {groupActions.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => action.onClick(bucketItems)}
                        style={{
                          flex: 1, minHeight: 34, padding: '8px 8px',
                          borderRadius: 'var(--r-sm)',
                          fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          ...(action.primary
                            ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                            : { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }),
                        }}
                      >
                        {action.icon && <span>{action.icon}</span>}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bucketItems.map(item => {
                    const isItemOpen = openItem === item.id;
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--card-solid, #fff)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-sm)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          onClick={() => setOpenItem(isItemOpen ? null : item.id)}
                          style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                        >
                          {renderSummary(item)}
                        </div>
                        {isItemOpen && renderDetails && (
                          <div style={{
                            background: 'var(--input-bg)',
                            padding: '12px',
                            display: 'flex', flexDirection: 'column', gap: 12,
                          }}>
                            {renderDetails(item)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
