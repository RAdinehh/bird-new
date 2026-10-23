/**
 * ReceivablesPage — مطالبات/بدهی با aging
 */
import { useState, useMemo } from 'react';
import { daysUntilDue, dueTone, dueLabel } from './helpers';
import DeferModal from './components/DeferModal';
import { useTra, remaining, ageDays, agingBucket, AGING_BUCKETS, paidSumAllocated, WORKFLOW_LABEL, type Invoice, type Deferral } from './store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { showSuccess } from '../../cor/store/dialog';
import { Line, tab } from './helpers';
import { useFilterSort, FilterBar, getTraReceivablesConfig } from '../../shr/filter';
import MultiPayModal from './components/MultiPayModal';
import SummaryBox from './components/SummaryBox';
import UpcomingDueSection from './components/UpcomingDueSection';

type BucketKey = '0-15' | '16-30' | '31-60' | '61-90' | '+90';

export default function ReceivablesPage({ active = true }: { active?: boolean } = {}) {
  const { invoices, updateInvoice, allocations } = useTra();
  const { contacts } = useCtc();
  const [multiPayOpen, setMultiPayOpen] = useState(false);
  const [kind, setKind] = useState<'sale' | 'purchase'>('sale');
  const [expandedBucket, setExpandedBucket] = useState<BucketKey | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [deferModal, setDeferModal] = useState<{ id: string; oldDate: string } | null>(null);
  const [deferDate, setDeferDate] = useState('');
  const [deferReason, setDeferReason] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);

  const openInvoices = useMemo(
    () => invoices.filter(i => i.type === kind && remaining(i, allocations) > 0),
    [invoices, kind]
  );




  // فیلتر/مرتب
  const config = useMemo(() => {
    const partyNames: Record<string, string> = {};
    openInvoices.forEach(i => {
      if (i.partyId && !partyNames[i.partyId]) {
        const c = contacts.find(x => x.id === i.partyId);
        if (c) partyNames[i.partyId] = c.name;
      }
    });
    return getTraReceivablesConfig({ partyNames });
  }, [openInvoices, contacts]);
  const { filtered, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total: totalFiltered, count } = useFilterSort<Invoice>({
    items: openInvoices,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const upcoming = useMemo(() => {
    return openInvoices
      .filter(i => i.dueDate && !i.remindersMuted)
      .map(i => ({ inv: i, days: daysUntilDue(i) }))
      .filter(x => x.days !== null && x.days <= 7)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  }, [openInvoices]);

  const byBucket = useMemo(() => {
    const map: Record<string, Invoice[]> = {
      '0-15': [], '16-30': [], '31-60': [], '61-90': [], '+90': []
    };
    filtered.forEach(inv => {
      // Aging of receivables = روزهای overdue از dueDate، نه سن فاکتور
      const dUntil = daysUntilDue(inv);
      const days = dUntil !== null && dUntil < 0 ? -dUntil : 0;
      const b = agingBucket(days);
      if (map[b]) map[b].push(inv);
    });
    return map;
  }, [filtered]);

  const bucketSum = (key: string) =>
    (byBucket[key] || []).reduce((a, inv) => a + remaining(inv, allocations), 0);

  const totalOpen = filtered.reduce((a, inv) => a + remaining(inv, allocations), 0);
  const overdueCount = openInvoices.filter(i => {
    const d = daysUntilDue(i);
    return d !== null && d < 0;
  }).length;
  const soonCount = openInvoices.filter(i => {
    const d = daysUntilDue(i);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const toggleBucket = (key: BucketKey) => {
    setExpandedBucket(expandedBucket === key ? null : key);
    setExpandedInvoice(null);
  };

  const openDefer = (inv: Invoice) => {
    setDeferModal({ id: inv.id, oldDate: inv.dueDate || inv.date });
    setDeferDate(inv.dueDate || inv.date);
    setDeferReason('');
  };

  const doDefer = () => {
    if (!deferModal || !deferDate) return;
    const inv = invoices.find(i => i.id === deferModal.id);
    if (!inv) return;
    const newDeferral: Deferral = {
      id: crypto.randomUUID(),
      fromDate: deferModal.oldDate,
      toDate: deferDate,
      reason: deferReason,
      createdAt: new Date().toISOString(),
    };
    updateInvoice(inv.id, {
      dueDate: deferDate,
      deferrals: [...(inv.deferrals || []), newDeferral],
      remindersMuted: false,
    });
    showSuccess('سرسید به تعویق افتاد');
    setDeferModal(null);
  };

  return (
    <PageContainer>
      {/* سوییچ نوع — فشرده */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <button onClick={() => setKind('sale')} style={tab(kind === 'sale')}>
          📥 مطالبات
        </button>
        <button onClick={() => setKind('purchase')} style={tab(kind === 'purchase')}>
          📤 بدهی
        </button>
      </div>

      {/* 🆕 دکمه پرداخت گروهی */}
      <Btn
        size="sm"
        variant="primary"
        onClick={() => setMultiPayOpen(true)}
        style={{ marginBottom: 8, width: '100%' }}
      >
        💳 {kind === 'sale' ? 'دریافت گروهی' : 'پرداخت گروهی'}
      </Btn>

      {/* خلاصه — یه خط */}
      <SummaryBox kind={kind} totalOpen={totalOpen} openCount={openInvoices.length} overdueCount={overdueCount} soonCount={soonCount} />

      {/* ⏰ سرسیدهای نزدیک — collapsible */}
      <UpcomingDueSection upcoming={upcoming} contacts={contacts} showUpcoming={showUpcoming} onToggle={() => setShowUpcoming(!showUpcoming)} onDefer={openDefer} />

      {/* FilterBar */}
      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={totalFiltered}
        count={count}
      />

      {/* خالی */}
      {totalOpen === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
          title={kind === 'sale' ? 'طلبی وجود ندارد' : 'بدهی وجود ندارد'}
          desc="همه‌ی فاکتورها تسویه شده‌اند."
        />
      ) : null}

      {/* Buckets — فقط اگه پر باشن */}
      {totalOpen > 0 ? (
        <>
          {AGING_BUCKETS.map(({ key, label, color }) => {
            const items = byBucket[key] || [];
            if (items.length === 0) return null; // ← خالی‌ها پنهان
            const sum = bucketSum(key);
            const isOpen = expandedBucket === key;

            return (
              <div key={key} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
              }}>
                <div role="button" tabIndex={0}
                  onClick={() => toggleBucket(key as BucketKey)}
                  style={{
                    padding: 'var(--pad-normal)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: `var(--${color})`, flexShrink: 0
                  }} />
                  <div style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                    {label}
                    <span style={{ color: 'var(--muted)', fontWeight: 400, marginRight: 6 }}>
                      • {toFa(items.length)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'var(--fs-sm)', fontWeight: 700,
                    color: `var(--${color})`, fontVariantNumeric: 'tabular-nums'
                  }}>
                    {toFa(sum.toLocaleString('fa-IR'))} تومان
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke={isOpen ? `var(--${color})` : 'var(--dim)'}
                    strokeWidth="2.5" strokeLinecap="round"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s',
                    }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {items.map(inv => {
                        const party = contacts.find(c => c.id === inv.partyId);
                        const rem = remaining(inv, allocations);
                        const days = ageDays(inv);
                        const invOpen = expandedInvoice === inv.id;
                        const dUntil = daysUntilDue(inv);
                        return (
                          <div
                            key={inv.id}
                            onClick={() => setExpandedInvoice(invOpen ? null : inv.id)}
                            style={{
                              padding: 'var(--pad-normal)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--r-sm)',
                              cursor: 'pointer',
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
                                  fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 1,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                  {toFa(days)} روز • {inv.number || ''}
                                  {dUntil !== null ? ` • ${dueLabel(dUntil)}` : ''}
                                </div>
                              </div>
                              <div style={{
                                fontSize: 'var(--fs-sm)', fontWeight: 700,
                                color: `var(--${color})`,
                                fontVariantNumeric: 'tabular-nums',
                                flexShrink: 0
                              }}>
                                {toFa(rem.toLocaleString('fa-IR'))} تومان
                              </div>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateRows: invOpen ? '1fr' : '0fr',
                              transition: 'grid-template-rows 200ms cubic-bezier(.16,1,.3,1)',
                            }}>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{
                                  paddingTop: 6, marginTop: 6,
                                  borderTop: '1px dashed var(--border)',
                                  display: 'flex', flexDirection: 'column', gap: 3
                                }}>
                                  <Line l="جمع فاکتور" v={`${toFa(inv.total.toLocaleString('fa-IR'))} تومان`} />
                                  <Line l="پرداخت‌شده" v={`${toFa(paidSumAllocated(inv, allocations).toLocaleString('fa-IR'))} تومان`} />
                                  {inv.dueDate ? <Line l="سرسید" v={toFa(inv.dueDate)} /> : null}
                                  {inv.workflowStatus ? (
                                    <Line l="وضعیت" v={WORKFLOW_LABEL[inv.workflowStatus]} />
                                  ) : null}
                                  {inv.deferrals && inv.deferrals.length > 0 ? (
                                    <Line l="تعویق‌ها" v={toFa(inv.deferrals.length)} />
                                  ) : null}

                                  <div style={{ marginTop: 4 }}>
                                    <Btn size="sm" onClick={(e) => { e.stopPropagation(); openDefer(inv); }}>
                                      ⏰ تعویق
                                    </Btn>
                                  </div>
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

      {/* Modal تعویق */}
      <DeferModal
        deferModal={deferModal}
        onClose={() => setDeferModal(null)}
        deferDate={deferDate}
        setDeferDate={setDeferDate}
        deferReason={deferReason}
        setDeferReason={setDeferReason}
        onConfirm={doDefer}
      />
          <MultiPayModal
        open={multiPayOpen}
        onClose={() => setMultiPayOpen(false)}
        kind={kind}
      />
    </PageContainer>
  );
}
