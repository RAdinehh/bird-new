import { useState, useMemo } from 'react';
import { useTra, remaining, ageDays, agingBucket, AGING_BUCKETS, paidSum, checkTone, CHECK_STATUS_LABEL, WORKFLOW_LABEL, workflowTone, calcDueDate, type Invoice, type Payment, type Deferral } from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showSuccess } from '../../cor/store/dialog';

type BucketKey = '0-15' | '16-30' | '31-60' | '61-90' | '+90';
type QuickFilter = 'all' | 'overdue' | 'soon' | 'checks';

export default function ReceivablesPage() {
  const { invoices, updateInvoice } = useTra();
  const { contacts } = useCtc();
  const [kind, setKind] = useState<'sale' | 'purchase'>('sale');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [expandedBucket, setExpandedBucket] = useState<BucketKey | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [deferModal, setDeferModal] = useState<{ id: string; oldDate: string } | null>(null);
  const [deferDate, setDeferDate] = useState('');
  const [deferReason, setDeferReason] = useState('');

  // فاکتورهای معوق (مانده > 0)
  const openInvoices = useMemo(
    () => invoices.filter(i => i.type === kind && remaining(i) > 0),
    [invoices, kind]
  );

  // ============ محاسبه روز تا سرسید ============
  const daysUntilDue = (inv: Invoice): number | null => {
    if (!inv.dueDate) return null;
    const parts = inv.dueDate.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
    if (parts.length !== 3) return null;
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  // ============ سه سطح هشدار ============
  const dueTone = (days: number | null): 'green' | 'amber' | 'orange' | 'red' => {
    if (days === null) return 'green';
    if (days < 0) return 'red';
    if (days <= 2) return 'orange';
    if (days <= 7) return 'amber';
    return 'green';
  };

  const dueLabel = (days: number | null): string => {
    if (days === null) return 'بدون سرسید';
    if (days < 0) return `${toFa(Math.abs(days))} روز گذشته`;
    if (days === 0) return 'امروز';
    if (days === 1) return 'فردا';
    return `${toFa(days)} روز مانده`;
  };

  // ============ فیلتر بر اساس وضعیت ============
  const filtered = useMemo(() => {
    if (quickFilter === 'overdue') {
      return openInvoices.filter(i => {
        const d = daysUntilDue(i);
        return d !== null && d < 0;
      });
    }
    if (quickFilter === 'soon') {
      return openInvoices.filter(i => {
        const d = daysUntilDue(i);
        return d !== null && d >= 0 && d <= 7;
      });
    }
    return openInvoices;
  }, [openInvoices, quickFilter]);

  // ============ سرسیدهای نزدیک (بالای صفحه) ============
  const upcoming = useMemo(() => {
    return openInvoices
      .filter(i => i.dueDate && !i.remindersMuted)
      .map(i => ({ inv: i, days: daysUntilDue(i) }))
      .filter(x => x.days !== null && x.days <= 7)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
      .slice(0, 5);
  }, [openInvoices]);

  // ============ چک‌های در جریان ============
  const pendingCheckList = useMemo(() => {
    const list: { inv: Invoice; pay: Payment }[] = [];
    openInvoices.forEach(inv => {
      (inv.payments || []).forEach(p => {
        if (p.method === 'check' && (!p.status || p.status === 'pending')) {
          list.push({ inv, pay: p });
        }
      });
    });
    return list.sort((a, b) => (a.pay.dueDate || '').localeCompare(b.pay.dueDate || ''));
  }, [openInvoices]);

  // ============ بکت‌ها ============
  const byBucket = useMemo(() => {
    const map: Record<string, Invoice[]> = {
      '0-15': [], '16-30': [], '31-60': [], '61-90': [], '+90': []
    };
    filtered.forEach(inv => {
      const days = ageDays(inv);
      const b = agingBucket(days);
      if (map[b]) map[b].push(inv);
    });
    return map;
  }, [filtered]);

  const bucketSum = (key: string) =>
    (byBucket[key] || []).reduce((a, inv) => a + remaining(inv), 0);

  const totalOpen = filtered.reduce((a, inv) => a + remaining(inv), 0);
  const overdueCount = openInvoices.filter(i => {
    const d = daysUntilDue(i);
    return d !== null && d < 0;
  }).length;

  const toggleBucket = (key: BucketKey) => {
    setExpandedBucket(expandedBucket === key ? null : key);
    setExpandedInvoice(null);
  };

  // ============ تعویق ============
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
    setDeferDate('');
    setDeferReason('');
  };

  return (
    <PageContainer>
      {/* سوییچ نوع */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setKind('sale')} style={chip(kind === 'sale')}>
          📥 مطالبات (مشتریان)
        </button>
        <button onClick={() => setKind('purchase')} style={chip(kind === 'purchase')}>
          📤 بدهی (فروشندگان)
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

      {/* ⏰ سرسیدهای نزدیک */}
      {upcoming.length > 0 ? (
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 6 }}>
            ⏰ سرسیدهای نزدیک ({toFa(upcoming.length)})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {upcoming.map(({ inv, days }) => {
              const party = contacts.find(c => c.id === inv.partyId);
              const tone = dueTone(days);
              return (
                <div key={inv.id} style={{
                  padding: '9px 12px',
                  background: `var(--${tone}-soft, var(--input-bg))`,
                  border: `1px solid var(--${tone})`,
                  borderRadius: 'var(--r-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: `var(--${tone})` }}>
                      {party?.name || '—'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {dueLabel(days)} · {toFa(inv.dueDate || '')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: `var(--${tone})` }}>
                      {toFa(remaining(inv).toLocaleString('fa-IR'))} ت
                    </div>
                    <button
                      type="button"
                      onClick={() => openDefer(inv)}
                      style={{
                        marginTop: 4, padding: '3px 8px',
                        background: 'transparent', border: `1px solid var(--${tone})`,
                        borderRadius: 'var(--r-sm)', color: `var(--${tone})`,
                        fontSize: 'var(--fs-xs)', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      تعویق
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 🏦 چک‌های در جریان */}
      {pendingCheckList.length > 0 ? (
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 6 }}>
            🏦 چک‌های در جریان ({toFa(pendingCheckList.length)})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {pendingCheckList.map(({ inv, pay }) => {
              const party = contacts.find(c => c.id === inv.partyId);
              return (
                <div key={pay.id} style={{
                  padding: '9px 12px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                      {party?.name || '—'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      چک {pay.checkNo || '—'} · {pay.bank || '—'} · سرسید {toFa(pay.dueDate || '—')}
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--amber)', flexShrink: 0 }}>
                    {toFa(pay.amount.toLocaleString('fa-IR'))} ت
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* فیلتر سریع */}
      {openInvoices.length > 0 ? (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button onClick={() => setQuickFilter('all')} style={filterChip(quickFilter === 'all')}>
            همه ({toFa(openInvoices.length)})
          </button>
          {overdueCount > 0 ? (
            <button onClick={() => setQuickFilter('overdue')} style={filterChip(quickFilter === 'overdue', 'red')}>
              🔴 عقب‌افتاده ({toFa(overdueCount)})
            </button>
          ) : null}
          <button onClick={() => setQuickFilter('soon')} style={filterChip(quickFilter === 'soon', 'amber')}>
            🟡 نزدیک
          </button>
          {pendingCheckList.length > 0 ? (
            <button onClick={() => setQuickFilter('checks')} style={filterChip(quickFilter === 'checks', 'blue')}>
              🏦 چک
            </button>
          ) : null}
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
                        transition: 'transform .25s', flexShrink: 0
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
                        const dUntil = daysUntilDue(inv);
                        const tone = dueTone(dUntil);
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
                              <div style={{
                                fontSize: 'var(--fs-base)', fontWeight: 700,
                                color: `var(--${color})`, fontVariantNumeric: 'tabular-nums', flexShrink: 0
                              }}>
                                {toFa(rem.toLocaleString('fa-IR'))} ت
                              </div>
                            </div>

                            {/* جزئیات بیشتر */}
                            <div style={{
                              display: 'grid',
                              gridTemplateRows: invOpen ? '1fr' : '0fr',
                              transition: 'grid-template-rows 200ms cubic-bezier(.16,1,.3,1)'
                            }}>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{
                                  paddingTop: 8, marginTop: 8,
                                  borderTop: '1px dashed var(--border)',
                                  display: 'flex', flexDirection: 'column', gap: 5
                                }}>
                                  <Line l="جمع فاکتور" v={`${toFa(inv.total.toLocaleString('fa-IR'))} ت`} />
                                  <Line l="پرداخت‌شده" v={`${toFa(paidSum(inv.payments || []).toLocaleString('fa-IR'))} ت`} />
                                  {inv.dueDate ? <Line l="سرسید" v={toFa(inv.dueDate)} /> : null}
                                  {inv.workflowStatus ? (
                                    <Line l="وضعیت" v={WORKFLOW_LABEL[inv.workflowStatus]} />
                                  ) : null}
                                  {inv.isPreorder && inv.deliveryDate ? (
                                    <Line l="📅 تاریخ تحویل" v={toFa(inv.deliveryDate)} />
                                  ) : null}
                                  {inv.deferrals && inv.deferrals.length > 0 ? (
                                    <Line l="تعداد تعویق" v={toFa(inv.deferrals.length)} />
                                  ) : null}

                                  {/* دکمه تعویق */}
                                  <div style={{ marginTop: 6, display: 'flex', gap: 5 }}>
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
      <Modal
        open={!!deferModal}
        onClose={() => setDeferModal(null)}
        title="⏰ تعویق سرسید"
        footer={
          <BtnRow>
            <Btn onClick={() => setDeferModal(null)}>لغو</Btn>
            <Btn variant="primary" onClick={doDefer}>تأیید تعویق</Btn>
          </BtnRow>
        }
      >
        {deferModal ? (
          <>
            <Field label="سرسید جدید" required>
              <DatePicker value={deferDate} onChange={v => setDeferDate(v)} />
            </Field>
            <Field label="دلیل تعویق">
              <Input placeholder="مثلاً: مشکل مالی موقت" value={deferReason} onChange={e => setDeferReason(e.target.value)} />
            </Field>
          </>
        ) : null}
      </Modal>
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

function filterChip(active: boolean, color = 'accent'): React.CSSProperties {
  return {
    padding: '5px 11px', fontSize: 'var(--fs-xs)',
    background: active ? `var(--${color}-soft, var(--accent-soft))` : 'var(--btn-bg)',
    border: `1px solid ${active ? `var(--${color})` : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? `var(--${color})` : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
