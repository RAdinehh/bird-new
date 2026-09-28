import { useState, useMemo } from 'react';
import { useTra, remaining, ageDays, agingBucket, AGING_BUCKETS, paidSum, type Invoice } from './store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer, Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

type BucketKey = '0-15' | '16-30' | '31-60' | '61-90' | '+90';

export default function ReceivablesPage() {
  const { invoices } = useTra();
  const { contacts } = useCtc();
  const [kind, setKind] = useState<'sale' | 'purchase'>('sale');
  const [expandedBucket, setExpandedBucket] = useState<BucketKey | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // فاکتورهای معوق (مانده > 0)
  const openInvoices = useMemo(
    () => invoices.filter(i => i.type === kind && remaining(i) > 0),
    [invoices, kind]
  );

  const byBucket = useMemo(() => {
    const map: Record<string, Invoice[]> = {
      '0-15': [], '16-30': [], '31-60': [], '61-90': [], '+90': []
    };
    openInvoices.forEach(inv => {
      const days = ageDays(inv);
      const b = agingBucket(days);
      if (map[b]) map[b].push(inv);
    });
    return map;
  }, [openInvoices]);

  const bucketSum = (key: string) =>
    (byBucket[key] || []).reduce((a, inv) => a + remaining(inv), 0);

  const totalOpen = openInvoices.reduce((a, inv) => a + remaining(inv), 0);

  const toggleBucket = (key: BucketKey) => {
    setExpandedBucket(expandedBucket === key ? null : key);
    setExpandedInvoice(null);
  };

  return (
    <PageContainer>
      {/* سوییچ نوع */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setKind('sale')} style={chip(kind === 'sale')}>
          📥 مطالبات (از مشتریان)
        </button>
        <button onClick={() => setKind('purchase')} style={chip(kind === 'purchase')}>
          📤 بدهی (به فروشندگان)
        </button>
      </div>

      {/* خلاصه */}
      {totalOpen > 0 ? (
        <div style={{
          padding: '14px 16px',
          background: kind === 'sale' ? 'var(--accent-soft)' : 'var(--warn-soft)',
          border: `1px solid ${kind === 'sale' ? 'var(--accent-border)' : 'var(--warn)'}`,
          borderRadius: 'var(--r-lg)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: 'var(--fs-base)', color: kind === 'sale' ? 'var(--accent)' : 'var(--warn)', fontWeight: 700 }}>
            {kind === 'sale' ? 'مجموع طلب' : 'مجموع بدهی'}
          </div>
          <div style={{ fontSize: 'var(--fs-xl)', color: kind === 'sale' ? 'var(--accent)' : 'var(--warn)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {toFa(totalOpen.toLocaleString('fa-IR'))} ت
          </div>
        </div>
      ) : null}

      {/* اگه خالی بود */}
      {totalOpen === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
          title={kind === 'sale' ? 'طلبی وجود ندارد' : 'بدهی وجود ندارد'}
          desc="همه‌ی فاکتورها تسویه شده‌اند."
        />
      ) : null}

      {/* Buckets */}
      {totalOpen > 0 ? (
        <>
          {AGING_BUCKETS.map(({ key, label, color }) => {
            const items = byBucket[key] || [];
            const sum = bucketSum(key);
            const isOpen = expandedBucket === key;
            const isEmpty = items.length === 0;

            return (
              <div key={key} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
                opacity: isEmpty ? 0.45 : 1,
                transition: 'opacity .2s'
              }}>
                {/* هدر Bucket */}
                <div
                  onClick={() => !isEmpty && toggleBucket(key as BucketKey)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: isEmpty ? 'default' : 'pointer'
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: `var(--${color})`,
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {toFa(items.length)} فاکتور
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: `var(--${color})`, fontVariantNumeric: 'tabular-nums' }}>
                    {toFa(sum.toLocaleString('fa-IR'))} ت
                  </div>
                  {!isEmpty ? (
                    <svg
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke={isOpen ? `var(--${color})` : 'var(--dim)'}
                      strokeWidth="2.5" strokeLinecap="round"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform .25s',
                        flexShrink: 0
                      }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  ) : null}
                </div>

                {/* فاکتورهای این Bucket */}
                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
                  willChange: 'grid-template-rows'
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map(inv => {
                        const party = contacts.find(c => c.id === inv.partyId);
                        const rem = remaining(inv);
                        const days = ageDays(inv);
                        const invOpen = expandedInvoice === inv.id;
                        return (
                          <div
                            key={inv.id}
                            onClick={() => setExpandedInvoice(invOpen ? null : inv.id)}
                            style={{
                              padding: '10px 12px',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--r-md)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 'var(--fs-sm)', fontWeight: 600,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                  {party?.name || '—'}
                                </div>
                                <div style={{
                                  fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                  {toFa(inv.date)} · {toFa(days)} روز پیش
                                  {inv.number ? ` · ${inv.number}` : ''}
                                </div>
                              </div>
                              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: `var(--${color})`, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                {toFa(rem.toLocaleString('fa-IR'))} ت
                              </div>
                            </div>

                            {/* جزئیات بیشتر وقتی باز است */}
                            <div style={{
                              display: 'grid',
                              gridTemplateRows: invOpen ? '1fr' : '0fr',
                              transition: 'grid-template-rows 200ms cubic-bezier(.16,1,.3,1)'
                            }}>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ paddingTop: 8, marginTop: 8, borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  <Line l="جمع فاکتور" v={`${toFa(inv.total.toLocaleString('fa-IR'))} ت`} />
                                  <Line l="پرداخت‌شده" v={`${toFa(paidSum(inv.payments || []).toLocaleString('fa-IR'))} ت`} />
                                  {inv.dueDate ? <Line l="سرسید" v={toFa(inv.dueDate)} /> : null}
                                  {inv.payments && inv.payments.length > 0 ? (
                                    <Line l="تعداد پرداخت" v={toFa(inv.payments.length)} />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : null}
    </PageContainer>
  );
}

function Line({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '8px 12px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
