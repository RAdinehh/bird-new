/**
 * ReceivablesPage — مطالبات/بدهی با aging
 */
import { useState, useMemo } from 'react';
import { daysUntilDue, dueTone, dueLabel, computeUpcoming } from './helpers';
import DeferModal from './components/DeferModal';
import ReminderModal from './components/ReminderModal';
import { useTra, remaining, ageDays, agingBucket, AGING_BUCKETS, paidSumAllocated, WORKFLOW_LABEL, computeDealBalance, dealDaysUntilDue, isDealOpen, type Invoice, type Deal, type Deferral } from './store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { showSuccess, showConfirmAsync } from '../../cor/store/dialog';
import { toastMsg } from '../../cor/store/toast';
import { Line, tab } from './helpers';
import { useFilterSort, FilterBar, getTraReceivablesConfig } from '../../shr/filter';
import MultiPayModal from './components/MultiPayModal';
import DealPayModal from './components/DealPayModal';
import SummaryBox from './components/SummaryBox';
import UpcomingDueSection from './components/UpcomingDueSection';
import StatementModal from './components/StatementModal';
import AgingBuckets from './components/AgingBuckets';
import ChecksModal from './components/ChecksModal';
import { agingBucketFromDue } from './formulas';
import { agingBucketFromDeal } from './calc';

type BucketKey = '0-15' | '16-30' | '31-60' | '61-90' | '+90';

export default function ReceivablesPage({ active = true }: { active?: boolean } = {}) {
  const { invoices, deals, updateInvoice, allocations, addReminder } = useTra();
  const { contacts } = useCtc();
  const [multiPayOpen, setMultiPayOpen] = useState(false);
  const [multiPayPrefill, setMultiPayPrefill] = useState<{ partyId: string; invoiceId: string } | null>(null);
  const [kind, setKind] = useState<'sale' | 'purchase' | 'deal'>('sale');
  const [expandedBucket, setExpandedBucket] = useState<BucketKey | null>(null);
  const [deferModal, setDeferModal] = useState<{ id: string; oldDate: string } | null>(null);
  const [deferDate, setDeferDate] = useState('');
  const [deferReason, setDeferReason] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [dealPayTarget, setDealPayTarget] = useState<Deal | null>(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<Invoice | null>(null);

  const openInvoices = useMemo(
    () => invoices.filter(i => i.type === kind && remaining(i, allocations) > 0),
    [invoices, kind]
  );

  const openDeals = useMemo(
    () => deals.filter(d => isDealOpen(d, invoices)),
    [deals, invoices]
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
          resetAll, hasActiveFilters, total: totalFiltered, count, sortStack, appendSort } = useFilterSort<Invoice>({
    items: openInvoices,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const upcoming = useMemo(() => computeUpcoming(openInvoices), [openInvoices]);

  const byBucket = useMemo(() => {
    const map: Record<string, Invoice[]> = {
      '0-15': [], '16-30': [], '31-60': [], '61-90': [], '+90': []
    };
    filtered.forEach(inv => {
      // SINGLE SOURCE OF TRUTH — formulas.ts
      const b = agingBucketFromDue(inv);
      if (map[b]) map[b].push(inv);
    });
    return map;
  }, [filtered]);

  const bucketSum = (key: string) =>
    (byBucket[key] || []).reduce((a, inv) => a + remaining(inv, allocations), 0);

  // 🆕 Deal aging buckets (Phase B3) — same pattern as invoice
  const byDealBucket = useMemo(() => {
    const map: Record<string, Deal[]> = { '0-15': [], '16-30': [], '31-60': [], '61-90': [], '+90': [] };
    openDeals.forEach(d => {
      const b = agingBucketFromDeal(d);
      if (map[b]) map[b].push(d);
    });
    return map;
  }, [openDeals]);

  const totalOpen = filtered.reduce((a, inv) => a + remaining(inv, allocations), 0);
  const totalInvoiced = filtered.reduce((a, inv) => a + (inv.total || 0), 0);
  const settledAmount = Math.max(0, totalInvoiced - totalOpen);
  const dueSoonAmount = upcoming.reduce((a, u) => a + remaining(u.inv, allocations), 0);
  const overdueCount = openInvoices.filter(i => {
    const d = daysUntilDue(i);
    return d !== null && d < 0;
  }).length;
  const soonCount = openInvoices.filter(i => {
    const d = daysUntilDue(i);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  // Deal computations (Phase 1)
  const dealTotalOpen = openDeals.reduce((s, d) => s + Math.abs(computeDealBalance(d).balance), 0);
  const dealOverdueCount = openDeals.filter(d => {
    const days = dealDaysUntilDue(d);
    return days !== null && days < 0;
  }).length;
  const dealSoonCount = openDeals.filter(d => {
    const days = dealDaysUntilDue(d);
    return days !== null && days >= 0 && days <= 7;
  }).length;
  const effectiveTotal = kind === 'deal' ? dealTotalOpen : totalOpen;
  const effectiveOverdueCount = kind === 'deal' ? dealOverdueCount : overdueCount;
  const effectiveSoonCount = kind === 'deal' ? dealSoonCount : soonCount;

  const toggleBucket = (key: BucketKey) => {
    setExpandedBucket(expandedBucket === key ? null : key);
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
        <button onClick={() => setKind('deal')} style={tab(kind === 'deal')}>
          🤝 معاملات
        </button>
      </div>

                {/* Actions — به سبک tab */}
                <div style={{ display: 'grid', gridTemplateColumns: kind === 'deal' ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                  {kind !== 'deal' && (
                    <button
                      type="button"
                      onClick={() => { setMultiPayPrefill(null); setMultiPayOpen(true); }}
                      style={tab(multiPayOpen)}
                    >
                      {kind === 'sale' ? 'دریافت گروهی' : 'پرداخت گروهی'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatementOpen(true)}
                    style={tab(statementOpen)}
                  >
                    صورت‌حساب
                  </button>
                  <button
                    type="button"
                    onClick={() => setChecksOpen(true)}
                    style={tab(checksOpen)}
                  >
                    چک‌ها
                  </button>
                </div>

      {/* خلاصه — یه خط */}
      <SummaryBox kind={kind} totalInvoiced={kind === 'deal' ? dealTotalOpen : totalInvoiced} totalOpen={effectiveTotal} settledAmount={settledAmount} dueSoonAmount={dueSoonAmount} openCount={kind === 'deal' ? openDeals.length : openInvoices.length} />

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
        toggleSort={toggleSort} sortStack={sortStack} appendSort={appendSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={totalFiltered}
        count={count}
      />

      {/* خالی */}
      {effectiveTotal === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
          title={kind === 'sale' ? 'طلبی وجود ندارد' : kind === 'deal' ? 'معامله باز وجود ندارد' : 'بدهی وجود ندارد'}
          desc={kind === 'deal' ? 'همه‌ی معاملات تسویه شده‌اند.' : 'همه‌ی فاکتورها تسویه شده‌اند.'}
        />
      ) : null}

          {/* Deal buckets (Phase B3) */}
          {kind === 'deal' && effectiveTotal > 0 ? (
            <>
              {AGING_BUCKETS.map(({ key, label, color }) => {
                const items = byDealBucket[key] || [];
                if (items.length === 0) return null;
                const sum = items.reduce((a, d) => a + Math.abs(computeDealBalance(d).balance), 0);
                const isOpen = expandedBucket === key;
                return (
                  <div key={key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 8 }}>
                    <div role="button" tabIndex={0} onClick={() => toggleBucket(key as BucketKey)} style={{ padding: 'var(--pad-normal)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${color})`, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                        {label}
                        <span style={{ color: 'var(--muted)', fontWeight: 400, marginRight: 6 }}> • {toFa(items.length)}</span>
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: `var(--${color})`, fontVariantNumeric: 'tabular-nums' }}>
                        {toFa(sum.toLocaleString('fa-IR'))} ت
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOpen ? `var(--${color})` : 'var(--dim)'} strokeWidth="2.5" strokeLinecap="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {items.map(d => {
                            const bal = computeDealBalance(d);
                            const party = contacts.find(c => c.id === d.partyId);
                            const days = dealDaysUntilDue(d);
                            return (
                              <div key={d.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {party?.name || '—'}
                                    </div>
                                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {d.description || d.type}
                                      {days !== null ? ` • ${dueLabel(days)}` : ''}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: bal.balance >= 0 ? 'var(--accent)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
                                      {toFa(Math.abs(bal.balance).toLocaleString('fa-IR'))} ت
                                    </div>
                                    <Btn size="sm" variant="outline" onClick={() => setDealPayTarget(d)} style={{ fontSize: 11, padding: '2px 8px', minHeight: 24, height: 24 }}>💳 ثبت</Btn>
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


      {/* Buckets — فقط اگه پر باشن */}
      {kind !== 'deal' && effectiveTotal > 0 ? (
        <AgingBuckets
          items={filtered}
          bucketOf={(inv) => agingBucketFromDue(inv)}
          sumOf={(inv) => remaining(inv, allocations)}
          renderSummary={(inv) => {
            const party = contacts.find(c => c.id === inv.partyId);
            const dUntil = daysUntilDue(inv);
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party?.name || '—'}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: 'var(--muted)', border: '1px solid var(--border)' }}>{inv.type === 'sale' ? 'خریدار' : 'فروشنده'}</span>
                  </div>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{toFa(remaining(inv, allocations).toLocaleString('fa-IR'))} ت</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)' }}>
                  {dUntil !== null ? <span style={{ color: dUntil <= 3 ? 'var(--danger)' : dUntil <= 7 ? 'var(--warn)' : 'var(--muted)', fontWeight: 600 }}>⏰ {dueLabel(dUntil)}</span> : <span style={{ color: 'var(--muted)' }}>—</span>}
                  <span style={{ color: 'var(--dim)', fontFamily: 'monospace', direction: 'ltr', fontSize: 10 }}>{inv.number || ''}</span>
                </div>
              </>
            );
          }}
          renderDetails={(inv) => (
            <>
              <Line l="جمع فاکتور" v={`${toFa(inv.total.toLocaleString('fa-IR'))} تومان`} />
              <Line l="پرداخت‌شده" v={`${toFa(paidSumAllocated(inv, allocations).toLocaleString('fa-IR'))} تومان`} />
              {inv.dueDate ? <Line l="سرسید" v={toFa(inv.dueDate)} /> : null}
              {inv.workflowStatus ? <Line l="وضعیت" v={WORKFLOW_LABEL[inv.workflowStatus]} /> : null}
              {inv.deferrals && inv.deferrals.length > 0 ? <Line l="تعویق‌ها" v={toFa(inv.deferrals.length)} /> : null}
              {inv.reminderLog && inv.reminderLog.length > 0 ? (
                <Line l="آخرین یادآوری" v={`${toFa(inv.reminderLog[inv.reminderLog.length - 1].date)}${inv.reminderLog[inv.reminderLog.length - 1].methodLabel ? ' — ' + inv.reminderLog[inv.reminderLog.length - 1].methodLabel : ''}`} />
              ) : null}
              <div style={{ marginTop: 4 }}>
                <Btn size="sm" onClick={(e) => { e.stopPropagation(); openDefer(inv); }}>⏰ تعویق</Btn>
              </div>
            </>
          )}
          groupActions={[
            {
              label: 'پرداخت گروهی',
              icon: '💳',
              primary: true,
              onClick: (items) => {
                if (items.length === 0) return;
                setMultiPayPrefill({ partyId: items[0].partyId, invoiceId: items.length === 1 ? items[0].id : '' });
                setMultiPayOpen(true);
              },
            },
            {
              label: 'یادآوری گروهی',
              icon: '📨',
              onClick: async (items) => {
                if (items.length === 0) return;
                const ok = await showConfirmAsync(
                  'یادآوری گروهی',
                  `برای ${toFa(items.length)} فاکتور یادآوری ۷ روزه ثبت شود؟`,
                  { confirmText: 'بله، ثبت کن' },
                );
                if (!ok) return;
                items.forEach(inv => addReminder(inv.id, { method: 'other', note: '', intervalDays: 7 }));
                toastMsg.success(`${toFa(items.length)} یادآوری ثبت شد`);
              },
            },
            {
              label: 'تعویق گروهی',
              icon: '⏰',
              onClick: (items) => {
                if (items.length === 1) { openDefer(items[0]); return; }
                toastMsg.warn('برای تعویق گروهی، هر فاکتور را جدا باز کنید');
              },
            },
          ]}
        />
      ) : null}

      {/* Modal تعویق */}
      <ReminderModal
        open={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        invoice={reminderTarget}
      />
      <DeferModal
        deferModal={deferModal}
        onClose={() => setDeferModal(null)}
        deferDate={deferDate}
        setDeferDate={setDeferDate}
        deferReason={deferReason}
        setDeferReason={setDeferReason}
        onConfirm={doDefer}
      />
      <DealPayModal
        open={!!dealPayTarget}
        onClose={() => setDealPayTarget(null)}
        deal={dealPayTarget}
      />
          {kind !== 'deal' && (
            <MultiPayModal
              open={multiPayOpen}
              onClose={() => { setMultiPayOpen(false); setMultiPayPrefill(null); }}
              kind={kind}
              prefillPartyId={multiPayPrefill?.partyId}
              prefillInvoiceId={multiPayPrefill?.invoiceId}
            />
          )}
      <StatementModal
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        kind={kind}
      />
      <ChecksModal
        open={checksOpen}
        onClose={() => setChecksOpen(false)}
      />
    </PageContainer>
  );
}
