/**
 * ReceivablesPage — مطالبات/بدهی با aging
 */
import { useState, useMemo } from 'react';
import { useTra, remaining, ageDays, agingBucket, AGING_BUCKETS, paidSum, WORKFLOW_LABEL, type Invoice, type Deferral } from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Input, Modal, PageContainer } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa } from '../../shr/utils/fa';
import { showSuccess } from '../../cor/store/dialog';
import { Line, tab, filterChip } from './helpers';

type BucketKey = '0-15' | '16-30' | '31-60' | '61-90' | '+90';
type QuickFilter = 'all' | 'overdue' | 'soon';

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
  const [showUpcoming, setShowUpcoming] = useState(false);

  const openInvoices = useMemo(
    () => invoices.filter(i => i.type === kind && remaining(i) > 0),
    [invoices, kind]
  );

  const daysUntilDue = (inv: Invoice): number | null => {
    if (!inv.dueDate) return null;
    const parts = inv.dueDate.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
    if (parts.length !== 3) return null;
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

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

      {/* خلاصه — یه خط */}
      {totalOpen > 0 ? (
        <div style={{
          padding: 'var(--pad-comfy)',
          background: kind === 'sale' ? 'var(--accent-soft)' : 'var(--warn-soft)',
          border: `1px solid ${kind === 'sale' ? 'var(--accent-border)' : 'var(--warn)'}`,
          borderRadius: 'var(--r-md)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{
              fontSize: 'var(--fs-sm)', fontWeight: 700,
              color: kind === 'sale' ? 'var(--accent)' : 'var(--warn)'
            }}>
              {kind === 'sale' ? 'مجموع طلب' : 'مجموع بدهی'}
            </span>
            <span style={{
              fontSize: 'var(--fs-lg)', fontWeight: 700,
              color: kind === 'sale' ? 'var(--accent)' : 'var(--warn)',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {toFa(totalOpen.toLocaleString('fa-IR'))} ت
            </span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            flexWrap: 'wrap', gap: 4, marginTop: 10
          }}>
            <StatBox icon="📋" label="تعداد" value={toFa(openInvoices.length)} />
            <Dot />
            <StatBox icon="⏰" label="معوق" value={toFa(overdueCount)} tone={overdueCount > 0 ? 'danger' : 'default'} />
            <Dot />
            <StatBox icon="⏳" label="سرسید" value={toFa(soonCount)} tone={soonCount > 0 ? 'warn' : 'default'} />
          </div>
        </div>
      ) : null}

      {/* ⏰ سرسیدهای نزدیک — collapsible */}
      {upcoming.length > 0 ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--amber)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          <div
            onClick={() => setShowUpcoming(!showUpcoming)}
            style={{
              padding: 'var(--pad-normal)',
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
              background: 'var(--warn-soft)',
            }}
          >
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--warn)' }}>
              ⏰ {toFa(upcoming.length)} سرسید نزدیک
            </span>
            <div style={{ flex: 1 }} />
            <svg width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="var(--warn)" strokeWidth="2.5" strokeLinecap="round"
              style={{
                transform: showUpcoming ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s',
              }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateRows: showUpcoming ? '1fr' : '0fr',
            transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {upcoming.map(({ inv, days }) => {
                  const party = contacts.find(c => c.id === inv.partyId);
                  const tone = dueTone(days);
                  return (
                    <div key={inv.id} style={{
                      padding: 'var(--pad-tight)',
                      background: `var(--${tone}-soft, var(--input-bg))`,
                      border: `1px solid var(--${tone})`,
                      borderRadius: 'var(--r-sm)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: `var(--${tone})` }}>
                          {party?.name || '—'}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 1 }}>
                          {dueLabel(days)}
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: `var(--${tone})`, flexShrink: 0 }}>
                        {toFa(remaining(inv).toLocaleString('fa-IR'))} ت
                      </div>
                      <button
                        type="button"
                        onClick={() => openDefer(inv)}
                        style={{
                          padding: '3px 8px',
                          background: 'transparent',
                          border: `1px solid var(--${tone})`,
                          borderRadius: 'var(--r-sm)',
                          color: `var(--${tone})`,
                          fontSize: 'var(--fs-xs)', fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          flexShrink: 0,
                        }}
                      >
                        ⏰
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* فیلتر سریع — فقط اگه لازم بود */}
      {(overdueCount > 0 || soonCount > 0) ? (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button onClick={() => setQuickFilter('all')} style={filterChip(quickFilter === 'all')}>
            همه ({toFa(openInvoices.length)})
          </button>
          {overdueCount > 0 ? (
            <button onClick={() => setQuickFilter('overdue')} style={filterChip(quickFilter === 'overdue', 'danger')}>
              🔴 {toFa(overdueCount)}
            </button>
          ) : null}
          {soonCount > 0 ? (
            <button onClick={() => setQuickFilter('soon')} style={filterChip(quickFilter === 'soon', 'warn')}>
              🟡 {toFa(soonCount)}
            </button>
          ) : null}
        </div>
      ) : null}

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
                <div
                  onClick={() => toggleBucket(key as BucketKey)}
                  style={{
                    padding: 'var(--pad-normal)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 8, height: 36, borderRadius: '50%',
                    background: `var(--${color})`, flexShrink: 0
                  }} />
                  <div style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                    {label}
                    <span style={{ color: 'var(--muted)', fontWeight: 400, marginRight: 6 }}>
                      · {toFa(items.length)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'var(--fs-sm)', fontWeight: 700,
                    color: `var(--${color})`, fontVariantNumeric: 'tabular-nums'
                  }}>
                    {toFa(sum.toLocaleString('fa-IR'))} ت
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
                                  {toFa(days)} روز · {inv.number || ''}
                                  {dUntil !== null ? ` · ${dueLabel(dUntil)}` : ''}
                                </div>
                              </div>
                              <div style={{
                                fontSize: 'var(--fs-sm)', fontWeight: 700,
                                color: `var(--${color})`,
                                fontVariantNumeric: 'tabular-nums',
                                flexShrink: 0
                              }}>
                                {toFa(rem.toLocaleString('fa-IR'))} ت
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
                                  <Line l="جمع فاکتور" v={`${toFa(inv.total.toLocaleString('fa-IR'))} ت`} />
                                  <Line l="پرداخت‌شده" v={`${toFa(paidSum(inv.payments || []).toLocaleString('fa-IR'))} ت`} />
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
      <Modal
        open={!!deferModal}
        onClose={() => setDeferModal(null)}
        title="⏰ تعویق سرسید"
        footer={
          <BtnRow>
            <Btn onClick={() => setDeferModal(null)}>لغو</Btn>
            <Btn variant="primary" onClick={doDefer}>تأیید</Btn>
          </BtnRow>
        }
      >
        {deferModal ? (
          <>
            <Field label="سرسید جدید" required>
              <DatePicker value={deferDate} onChange={v => setDeferDate(v)} />
            </Field>
            <Field label="دلیل تعویق">
              <Input placeholder="..." value={deferReason} onChange={e => setDeferReason(e.target.value)} />
            </Field>
          </>
        ) : null}
      </Modal>
    </PageContainer>
  );
}
