/**
 * ReceivablesPage — مطالبات/بدهی با aging
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { daysUntilDue, dueLabel, computeUpcoming , computeUpcomingDeals } from './helpers';
import DeferModal from './components/DeferModal';
import DeferHistoryModal from './components/DeferHistoryModal';
import ReminderModal from './components/ReminderModal';
import { useTra, remaining, paidSumAllocated, WORKFLOW_LABEL, DEAL_LABEL, computeDealBalance, dealDaysUntilDue, isDealOpen, type Invoice, type Deal, type Deferral } from './store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import EntityLink from '../../shr/components/EntityLink';
import { toFa } from '../../shr/utils/fa';
import { showSuccess } from '../../cor/store/dialog';
import { Line, Row, tab, CAT_LABEL } from './helpers';
import { useFilterSort, FilterBar, getTraReceivablesConfig, getTraDealsConfig } from '../../shr/filter';
import MultiPayModal from './components/MultiPayModal';
import DealPayModal from './components/DealPayModal';
import SummaryBox from './components/SummaryBox';
import UpcomingDueSection from './components/UpcomingDueSection';
import UpcomingDealsSection from './components/UpcomingDealsSection';
import StatementModal from './components/StatementModal';
import AgingBuckets from './components/AgingBuckets';
import ChecksModal from './components/ChecksModal';
import { agingBucketFromDue } from './formulas';
import { agingBucketFromDeal, computeOverpayment , getTodayJalali} from './calc';


export default function ReceivablesPage({ active = true }: { active?: boolean } = {}) {
  const { invoices, deals, updateInvoice, updateDeal, allocations, addReminder } = useTra();
  const navigate = useNavigate();
  const { contacts } = useCtc();
  const [multiPayOpen, setMultiPayOpen] = useState(false);
  const [multiPayPrefill, setMultiPayPrefill] = useState<{ partyId: string; invoiceId: string } | null>(null);
  const [kind, setKind] = useState<'sale' | 'purchase' | 'deal'>('sale');
  const [deferModal, setDeferModal] = useState<{ kind: 'invoice' | 'deal'; id: string; oldDate: string } | null>(null);
  const [deferDate, setDeferDate] = useState('');
  const [deferReason, setDeferReason] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [dealPayTarget, setDealPayTarget] = useState<Deal | null>(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const [reminderInvoiceId, setReminderInvoiceId] = useState<string | null>(null);
  const [reminderDealId, setReminderDealId] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; label: string; deferrals: Deferral[] | undefined } | null>(null);

  const openInvoices = useMemo(
    () => invoices.filter(i => i.type === kind && remaining(i, allocations) > 0 && i.disputeStatus !== 'open'),
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

  // 🆕 B7: config معاملات — برای تب «معاملات»
  const dealConfig = useMemo(() => {
    const partyNames: Record<string, string> = {};
    openDeals.forEach(d => {
      if (d.partyId && !partyNames[d.partyId]) {
        const c = contacts.find(x => x.id === d.partyId);
        if (c) partyNames[d.partyId] = c.name;
      }
    });
    return getTraDealsConfig({ partyNames });
  }, [openDeals, contacts]);
  const { filtered, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total: totalFiltered, count, sortStack, appendSort } = useFilterSort<Invoice>({
    items: openInvoices,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // 🆕 B7: filter/sort موازی برای معاملات
  const dealFS = useFilterSort<Deal>({
    items: openDeals,
    filters: dealConfig.filterDefs,
    sorts: dealConfig.sortDefs,
    persistKey: dealConfig.persistKey,
    initialSort: dealConfig.initialSort,
  });

  const upcoming = useMemo(() => computeUpcoming(openInvoices), [openInvoices]);
  const upcomingDeals = useMemo(() => computeUpcomingDeals(openDeals), [openDeals]);



  // 🆕 Deal aging buckets (Phase B3) — same pattern as invoice

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
  const dealTotalOpen = openDeals.reduce((s, d) => s + computeDealBalance(d).balance, 0);
  // 🆕 «کل معاملات» = Σ myShare (سهم طرف)، نه مانده — استاندارد Odoo/SAP FI-AR
  const dealTotalMyShare = openDeals.reduce((s, d) => s + computeDealBalance(d).myShare, 0);
  // 🆕 Stage 3-4: پرداخت‌های خالص‌شده معاملات (settledAmount)
  const dealSettledAmount = openDeals.reduce((s, d) => {
    const bal = computeDealBalance(d);
    return s + Math.max(0, bal.paidIn - bal.paidOut);
  }, 0);
  // 🆕 Stage 3-4: معاملات نزدیک سرسید (۰-۷ روز)
  const dealDueSoonAmount = openDeals.reduce((s, d) => {
    const days = dealDaysUntilDue(d);
    if (days === null || days < 0 || days > 7) return s;
    return s + Math.abs(computeDealBalance(d).balance);
  }, 0);
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


  const openDefer = (inv: Invoice) => {
    const old = inv.dueDate || inv.date || getTodayJalali();
    setDeferModal({ kind: 'invoice', id: inv.id, oldDate: old });
    setDeferDate(old);
    setDeferReason('');
  };

  const openDealDefer = (d: Deal) => {
    const old = d.dueDate || d.date || getTodayJalali();
    setDeferModal({ kind: 'deal', id: d.id, oldDate: old });
    setDeferDate(old);
    setDeferReason('');
  };

  const doDefer = () => {
    if (!deferModal || !deferDate) return;
    const newDeferral: Deferral = {
      id: crypto.randomUUID(),
      fromDate: deferModal.oldDate,
      toDate: deferDate,
      reason: deferReason,
      createdAt: new Date().toISOString(),
    };
    if (deferModal.kind === 'invoice') {
      const inv = invoices.find(i => i.id === deferModal.id);
      if (!inv) return;
      updateInvoice(inv.id, {
        dueDate: deferDate,
        deferrals: [...(inv.deferrals || []), newDeferral],
        remindersMuted: false,
      });
    } else {
      const d = deals.find(x => x.id === deferModal.id);
      if (!d) return;
      updateDeal(d.id, {
        dueDate: deferDate,
        deferrals: [...(d.deferrals || []), newDeferral],
      });
    }
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
      <SummaryBox kind={kind} totalInvoiced={kind === 'deal' ? dealTotalMyShare : totalInvoiced} totalOpen={effectiveTotal} settledAmount={kind === 'deal' ? dealSettledAmount : settledAmount} dueSoonAmount={kind === 'deal' ? dealDueSoonAmount : dueSoonAmount} openCount={kind === 'deal' ? openDeals.length : openInvoices.length} />

      {/* ⏰ سرسیدهای نزدیک — collapsible */}
      {kind === 'deal' ? (
        <UpcomingDealsSection deals={upcomingDeals} contacts={contacts} showUpcoming={showUpcoming} onToggle={() => setShowUpcoming(!showUpcoming)} onDefer={openDealDefer} />
      ) : (
        <UpcomingDueSection upcoming={upcoming} contacts={contacts} showUpcoming={showUpcoming} onToggle={() => setShowUpcoming(!showUpcoming)} onDefer={openDefer} />
      )}

      {/* FilterBar */}
      {kind === 'deal' ? (
        <FilterBar
          filterDefs={dealConfig.filterDefs}
          sortDefs={dealConfig.sortDefs}
          filterState={dealFS.filters}
          sortState={dealFS.sort}
          setFilter={dealFS.setFilter}
          clearFilter={dealFS.clearFilter}
          setSort={dealFS.setSort}
          toggleSort={dealFS.toggleSort}
          sortStack={dealFS.sortStack}
          appendSort={dealFS.appendSort}
          resetAll={dealFS.resetAll}
          hasActiveFilters={dealFS.hasActiveFilters}
          total={dealFS.total}
          count={dealFS.count}
        />
      ) : (
        <FilterBar
          filterDefs={config.filterDefs}
          sortDefs={config.sortDefs}
          filterState={filters}
          sortState={sort}
          setFilter={setFilter}
          clearFilter={clearFilter}
          setSort={setSort}
          toggleSort={toggleSort}
          sortStack={sortStack}
          appendSort={appendSort}
          resetAll={resetAll}
          hasActiveFilters={hasActiveFilters}
          total={totalFiltered}
          count={count}
        />
      )}

      {/* خالی */}
      {effectiveTotal === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
          title={kind === 'sale' ? 'طلبی وجود ندارد' : kind === 'deal' ? 'معامله باز وجود ندارد' : 'بدهی وجود ندارد'}
          desc={kind === 'deal' ? 'همه‌ی معاملات تسویه شده‌اند.' : 'همه‌ی فاکتورها تسویه شده‌اند.'}
        />
      ) : null}

          {/* Deal buckets (Phase B3) */}
      {kind === 'deal' && effectiveTotal !== 0 ? (
        <>
          <AgingBuckets
            items={dealFS.filtered}
            bucketOf={(d) => agingBucketFromDeal(d)}
            sumOf={(d) => computeDealBalance(d).balance}
            renderSummary={(d) => {
              const bal = computeDealBalance(d);
              const party = contacts.find(c => c.id === d.partyId);
              const days = dealDaysUntilDue(d);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* خط اول: نام + تگ + مبلغ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
                        {party?.name || '—'}
                      </span>
                      <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        {DEAL_LABEL[d.type]}
                      </span>
                    </div>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', flexShrink: 0, color: bal.balance >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                      {toFa(Math.abs(bal.balance).toLocaleString('fa-IR'))} ت
                    </span>
                  </div>
                  {/* خط دوم: موضوع + تاریخ (ستون راست) | شماره فاکتور (ستون چپ) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 'var(--fs-sm)', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.description || '—'}
                      </span>
                      {days !== null && (
                        <span style={{ color: days <= 3 ? 'var(--danger)' : days <= 7 ? 'var(--warn)' : 'var(--muted)', fontWeight: 600, fontSize: 'var(--fs-xs)' }}>
                          {dueLabel(days)}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--dim)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>
                      {d.dealNumber || ''}
                    </span>
                  </div>
                </div>
              );
            }}
            renderDetails={(d) => {
                  const bal = computeDealBalance(d);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* 💰 خلاصه مالی */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <Line l="فروش کل" v={`${toFa(bal.totalSales.toLocaleString('fa-IR'))} تومان`} />
                        <Line l="کمیسیون" v={`${toFa(bal.commission.toLocaleString('fa-IR'))} تومان`} />
                        <Line l="سهم شما" v={`${toFa(bal.myShare.toLocaleString('fa-IR'))} تومان`} />
                      </div>

                      {/* 📥 وضعیت تسویه */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <Line l="دریافت‌شده" v={`${toFa(bal.paidIn.toLocaleString('fa-IR'))} تومان`} />
                        <Line l="باقی‌مانده" v={
                          <span style={{ fontWeight: 800, color: bal.balance >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                            {toFa(Math.abs(bal.balance).toLocaleString('fa-IR'))} تومان
                          </span>
                        } />
                      </div>

                      {/* ⏰ زمان‌بندی */}
                      {(d.dueDate || (d.deferrals && d.deferrals.length > 0)) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {d.dueDate && <Line l="سرسید" v={toFa(d.dueDate)} />}
                          {d.deferrals && d.deferrals.length > 0 && (
                            <Line l="⏰ تعویق‌ها" v={
                              <button type="button" onClick={(e) => { e.stopPropagation(); setHistoryTarget({ id: d.id, label: d.dealNumber || d.id.slice(0,6), deferrals: d.deferrals }); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}>
                                {toFa(d.deferrals.length)} بار (مشاهده تاریخچه)
                              </button>
                            } />
                          )}
                        </div>
                      )}

                      {/* 📨 یادآوری‌ها */}
                      {(d.reminderLog && d.reminderLog.length > 0) || d.nextReminderAt ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                          {d.reminderLog && d.reminderLog.length > 0 && (
                            <Line l="آخرین یادآوری" v={`${toFa(d.reminderLog[d.reminderLog.length - 1].date)}${d.reminderLog[d.reminderLog.length - 1].methodLabel ? ' — ' + d.reminderLog[d.reminderLog.length - 1].methodLabel : ''}`} />
                          )}
                          {d.nextReminderAt && <Line l="یادآوری بعدی" v={toFa(d.nextReminderAt)} />}
                        </div>
                      ) : null}

                      {/* 🎬 دکمه‌ها */}
                      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <Btn size="sm" onClick={(e) => { e.stopPropagation(); setDealPayTarget(d); }}>ثبت پرداخت</Btn>
                        <Btn size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setReminderDealId(d.id); }}>📨 یادآوری</Btn>
                        <Btn size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDealDefer(d); }}>⏰ تعویق</Btn>
                      </div>
                    </div>
                  );
                }}
          />
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
            const subject = inv.items?.[0]?.description || CAT_LABEL[inv.category] || inv.category || '—';
            const verb = inv.type === 'sale' ? 'فروش' : 'خرید';
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* خط اول: نام + تگ + مبلغ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
                      {party?.name || '—'}
                    </span>
                    <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                      {inv.type === 'sale' ? 'خریدار' : 'فروشنده'}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', flexShrink: 0, color: 'var(--text)' }}>
                    {toFa(remaining(inv, allocations).toLocaleString('fa-IR'))} ت
                  </span>
                </div>
                  {/* خط دوم: موضوع + تاریخ (ستون راست) | شماره فاکتور (ستون چپ) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 'var(--fs-sm)', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {verb} {subject}
                      </span>
                      {dUntil !== null && (
                        <span style={{ color: dUntil < 0 ? 'var(--danger)' : dUntil <= 7 ? 'var(--warn)' : 'var(--muted)', fontWeight: 600, fontSize: 'var(--fs-xs)' }}>
                          {dueLabel(dUntil)}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--dim)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>
                      {inv.number || ''}
                    </span>
                  </div>
              </div>
            );
          }}
          renderDetails={(inv) => {
            const checkPending = (inv.payments || []).filter(p => p.method === 'check' && (p.status === 'pending' || p.status === 'in_transit'));
            const relatedDeal = inv.relatedDealId ? deals.find(d => d.id === inv.relatedDealId) : null;
            const isLockedFromSettlement = !!inv.relatedSettlementId;
            const op = computeOverpayment(inv, allocations);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {isLockedFromSettlement && (
                  <div style={{ padding: '6px 8px', background: 'var(--warn-soft)', border: '1px solid var(--warn-border, rgba(234,88,12,.35))', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      از تسویه <span style={{ fontSize: 10, color: 'var(--warn)' }}>🔒</span>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>برای تغییر، تسویه را ویرایش کنید</span>
                  </div>
                )}

                {/* 💰 خلاصه مالی */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <Line l="جمع فاکتور" v={`${toFa(inv.total.toLocaleString('fa-IR'))} تومان`} />
                  {op > 0.5 && <Line l="پیش‌پرداخت" v={`${toFa(op.toLocaleString('fa-IR'))} تومان`} />}
                </div>

                {/* 📥 وضعیت تسویه */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <Line l="پرداخت‌شده" v={`${toFa(paidSumAllocated(inv, allocations).toLocaleString('fa-IR'))} تومان`} />
                  <Line l="باقی‌مانده" v={
                    <span style={{ fontWeight: 800, color: 'var(--warn)' }}>
                      {toFa(remaining(inv, allocations).toLocaleString('fa-IR'))} تومان
                    </span>
                  } />
                </div>

                {/* ⏰ زمان‌بندی و یادآوری */}
                {(inv.dueDate || (inv.deferrals && inv.deferrals.length > 0) || inv.nextReminderAt || (inv.reminderLog && inv.reminderLog.length > 0)) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {inv.dueDate && <Line l="سرسید" v={toFa(inv.dueDate)} />}
                    {inv.deferrals && inv.deferrals.length > 0 && (
                      <Line l="⏰ تعویق‌ها" v={
                        <button type="button" onClick={(e) => { e.stopPropagation(); setHistoryTarget({ id: inv.id, label: inv.number || inv.id.slice(0,6), deferrals: inv.deferrals }); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}>
                          {toFa(inv.deferrals.length)} بار (مشاهده تاریخچه)
                        </button>
                      } />
                    )}
                    {inv.reminderLog && inv.reminderLog.length > 0 && (
                      <Line l="آخرین یادآوری" v={`${toFa(inv.reminderLog[inv.reminderLog.length - 1].date)}${inv.reminderLog[inv.reminderLog.length - 1].methodLabel ? ' — ' + inv.reminderLog[inv.reminderLog.length - 1].methodLabel : ''}`} />
                    )}
                    {inv.nextReminderAt && <Line l="یادآوری بعدی" v={toFa(inv.nextReminderAt)} />}
                  </div>
                )}

                {/* 🔗 اطلاعات مرتبط */}
                {(inv.workflowStatus || relatedDeal || inv.relatedFlockId || checkPending.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {inv.workflowStatus && <Line l="وضعیت" v={WORKFLOW_LABEL[inv.workflowStatus].replace(/^[^؀-ۿA-Za-z0-9]+/u, '')} />}
                    {relatedDeal && <Line l="معامله" v={relatedDeal.dealNumber || relatedDeal.id.slice(0, 6)} />}
                    {inv.relatedFlockId && <Row l="گله" v={<EntityLink type="flock" id={inv.relatedFlockId} label={inv.items?.[0]?.flockName || 'مشاهده'} />} />}
                    {checkPending.length > 0 && <Line l="چک‌ها" v={`${toFa(checkPending.length)} در جریان (${toFa(checkPending.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('fa-IR'))} ت)`} />}
                  </div>
                )}

                {/* 🎬 دکمه‌ها */}
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {!isLockedFromSettlement && (
                    <Btn size="sm" onClick={(e) => { e.stopPropagation(); const tab = kind === 'sale' ? 'sales' : 'purchases'; navigate('/tra?tab=' + tab + '&edit=' + inv.id); }}>✏️ ویرایش</Btn>
                  )}
                  <Btn size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setReminderInvoiceId(inv.id); }}>📨 یادآوری</Btn>
                  <Btn size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDefer(inv); }}>⏰ تعویق</Btn>
                </div>
              </div>
            );
          }}
        />
      ) : null}

      {/* Modal تعویق */}
      <ReminderModal
        open={!!reminderInvoiceId || !!reminderDealId}
        onClose={() => { setReminderInvoiceId(null); setReminderDealId(null); }}
        invoiceId={reminderInvoiceId}
        dealId={reminderDealId}
      />
      <DeferHistoryModal
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        deferrals={historyTarget?.deferrals}
        invoiceNumber={historyTarget?.label || '—'}
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
