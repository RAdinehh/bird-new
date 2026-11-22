/**
 * TopAlerts — 3 کارت بالای داشبورد: هشدارهای تجمیعی + سرسیدهای نزدیک + چک‌های در جریان
 */
import { useFormat } from '../../shr/units/useFormat';

import { useState } from 'react';
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
  const fmt = useFormat();
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
                  padding: 'var(--pad-inner)',
                  background: 'var(--danger-soft)',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 700,
                  color: 'var(--danger)',
                }}>
                  🚨 هشدارهای فوری ({fmt.count(aggregatedAlerts.length)})
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {aggregatedAlerts.map((a, i) => (
                    <div
                      key={i}
                      onClick={() => nav(a.route)}
                      style={{
                        padding: 'var(--pad-inner)',
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
                        {fmt.count(a.count)}
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
                  ⏰ سرسیدهای نزدیک ({fmt.count(upcomingDues.length)})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {upcomingDues.map(({ inv, days }) => {
                    const party = contacts.find((c) => c.id === inv.partyId);
                    const tone = (days ?? 0) < 0 ? 'danger' : (days ?? 0) <= 2 ? 'warn' : 'amber';
                    return (
                      <div
                        key={inv.id}
                        onClick={() => nav('/tra?tab=receivables')}
                        style={{
                          padding: 'var(--pad-inner)',
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
                          {(days ?? 0) < 0 ? `${fmt.day(Math.abs(days ?? 0))} روز گذشته` : (days === 0 ? 'امروز' : `${fmt.day(days ?? 0)} روز مانده`)}
                        </span>
                        <span style={{ fontWeight: 700, color: `var(--${tone})` }}>
                          {fmt.money(remaining(inv))}
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
                  🏦 چک‌های در جریان ({fmt.count(pendingChecks.length)})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pendingChecks.map(({ inv, pay }) => {
                    const party = contacts.find((c) => c.id === inv.partyId);
                    return (
                      <div
                        key={pay.id}
                        onClick={() => nav('/tra?tab=receivables')}
                        style={{
                          padding: 'var(--pad-inner)',
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
                          چک {pay.checkNo || '—'} • {pay.bank || '—'}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                          {fmt.money(pay.amount)}
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
                <div style={{ fontSize: 'var(--fs-hero)', marginBottom: 12 }}>🐔</div>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 8 }}>خوش آمدید</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 300, margin: '0 auto' }}>
                  برای شروع، ابتدا پرنده و نژاد را تعریف کنید، سپس سالن و گله را بسازید و از انبار و ثبت روزانه استفاده کنید.
                </div>
              </div>
            ) : null}
    </>
  );
}