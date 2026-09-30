/**
 * TopAlerts — 3 کارت بالای داشبورد: هشدارهای تجمیعی + سرسیدهای نزدیک + چک‌های در جریان
 */
import { useState } from 'react';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { remaining } from '../tra/store';

interface Props {
  aggregatedAlerts: any[];
  upcomingDues: { inv: any; days: number | null }[];
  pendingChecks: { inv: any; pay: any }[];
  contacts: any[];
  invoices: any[];
  activeFlocks: any[];
  daysUntilDue: (d: string) => number | null;
  nav: (path: string) => void;
}

export default function TopAlerts({
  aggregatedAlerts,
  upcomingDues,
  pendingChecks,
  contacts,
  invoices,
  activeFlocks,
  daysUntilDue,
  nav,
}: Props) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  return (
    <>
            {/* 🚨 هشدارهای تجمیعی */}
            {aggregatedAlerts.length > 0 && (
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--danger-soft)',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 700,
                  color: 'var(--danger)',
                }}>
                  🚨 هشدارهای فوری ({toFa(aggregatedAlerts.length)})
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {aggregatedAlerts.map((a, i) => (
                    <div
                      key={i}
                      onClick={() => nav(a.route)}
                      style={{
                        padding: '6px 10px',
                        background: `var(--${a.tone}-soft)`,
                        borderRadius: 'var(--r-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: 'var(--fs-sm)',
                      }}
                    >
                      <span style={{ color: `var(--${a.tone})`, fontWeight: 600 }}>
                        {a.icon} {a.label}
                      </span>
                      <span style={{ fontWeight: 700, color: `var(--${a.tone})` }}>
                        {toFa(a.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ⏰ سرسیدهای نزدیک */}
            {upcomingDues.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 4 }}>
                  ⏰ سرسیدهای نزدیک ({toFa(upcomingDues.length)})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {upcomingDues.map(({ inv, days }) => {
                    const party = contacts.find((c: any) => c.id === inv.partyId);
                    const tone = (days ?? 0) < 0 ? 'danger' : (days ?? 0) <= 2 ? 'warn' : 'amber';
                    return (
                      <div
                        key={inv.id}
                        onClick={() => nav('/tra?tab=receivables')}
                        style={{
                          padding: '8px 12px',
                          background: `var(--${tone}-soft, var(--input-bg))`,
                          border: `1px solid var(--${tone})`,
                          borderRadius: 'var(--r-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: 'var(--fs-sm)',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: `var(--${tone})` }}>
                          {party?.name || '—'}
                        </span>
                        <span style={{ color: `var(--${tone})`, fontSize: 'var(--fs-xs)' }}>
                          {(days ?? 0) < 0 ? `${toFa(Math.abs(days ?? 0))} روز گذشته` : (days === 0 ? 'امروز' : `${toFa(days ?? 0)} روز مانده`)}
                        </span>
                        <span style={{ fontWeight: 700, color: `var(--${tone})` }}>
                          {toFa(remaining(inv).toLocaleString('fa-IR'))} ت
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🏦 چک‌های در جریان */}
            {pendingChecks.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 4 }}>
                  🏦 چک‌های در جریان ({toFa(pendingChecks.length)})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pendingChecks.map(({ inv, pay }) => {
                    const party = contacts.find((c: any) => c.id === inv.partyId);
                    return (
                      <div
                        key={pay.id}
                        onClick={() => nav('/tra?tab=receivables')}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: 'var(--fs-sm)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{party?.name || '—'}</span>
                        <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>
                          چک {pay.checkNo || '—'} · {pay.bank || '—'}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                          {toFa(pay.amount.toLocaleString('fa-IR'))} ت
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeFlocks.length === 0 && invoices.length === 0 ? (
              <div style={{
                padding: 24, textAlign: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🐔</div>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 8 }}>خوش آمدید</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 300, margin: '0 auto' }}>
                  برای شروع، از منوی بالا اولین پرنده یا سالن خود را بسازید.
                </div>
              </div>
            ) : null}
    </>
  );
}