/**
 * ListCards — بخش‌های 5+6+7+8: هشدارها، گله‌ها، جوجه‌کشی فعال، هشدار انبار
 */
import { SectionTitle, MiniEmpty } from './cards';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { getAgeDays, getLifecycle } from '../flk/store';
import { daysToHatch, isLockdown, isHatchWindow } from '../inc/store';
import { healthyCount } from '../egg/store';
import { LEVEL_ICON, LEVEL_LABEL } from '../alt/store';
import type { AlertLevel } from '../alt/store';
import { dateDiffDays } from './utils';

interface Props {
  active: Array<{ level: AlertLevel; [k: string]: any }>;
  counts: Record<string, number>;
  activeFlocks: any[];
  birds: any[];
  productions: any[];
  activeEntries: any[];
  stockAlerts: number;
  nav: (p: string) => void;
}

export default function ListCards({
  active,
  counts,
  activeFlocks,
  birds,
  productions,
  activeEntries,
  stockAlerts,
  nav,
}: Props) {
  const isEmpty = active.length === 0 && activeFlocks.length === 0
                  && activeEntries.length === 0 && stockAlerts === 0;
  if (isEmpty) {
    return (
      <MiniEmpty
        icon="✅"
        title="همه‌چیز مرتبه"
        hint="هیچ هشدار، گله فعال، یا جوجه‌کشی در جریان نیست"
      />
    );
  }

  return (
    <>
            {/* ============ ۵. هشدارها ============ */}
            {active.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
                    🔔 هشدارهای فعال ({toFa(counts.total)})
                  </span>
                  <span onClick={() => nav('/alt')} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
                    مشاهده همه ←
                  </span>
                </div>
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden'
                }}>
                  {active.map((a, i) => (
                    <div
                      key={a.id}
                      onClick={() => nav('/alt')}
                      style={{
                        padding: 'var(--pad-card)',
                        borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>{LEVEL_ICON[a.level]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 'var(--fs-sm)', fontWeight: 600,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {a.title}
                        </div>
                        <div style={{
                          fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {a.message}
                        </div>
                      </div>
                      <Tag tone={a.level === 'critical' ? 'red' : a.level === 'important' ? 'amber' : 'blue'}>
                        {LEVEL_LABEL[a.level]}
                      </Tag>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* ============ ۶. گله‌ها ============ */}
            {activeFlocks.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
                    🐔 گله‌های فعال
                  </span>
                  <span onClick={() => nav('/flk')} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
                    مشاهده همه ←
                  </span>
                </div>
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden'
                }}>
                  {activeFlocks.slice(0, 3).map((f, i) => {
                    const age = getAgeDays(f);
                    const lc = getLifecycle(f.type, age);
                    const bird = birds.find(b => b.id === f.birdId);
                    const flockCount = f.currentCount || f.initialCount || 0;
                    const flockProds = productions.filter(p => p.flockId === f.id && dateDiffDays(p.date) <= 7);
                    const flockHenDay = flockProds.length > 0 && flockCount > 0
                      ? (flockProds.reduce((a, p) => a + healthyCount(p), 0) / (flockCount * flockProds.length)) * 100
                      : 0;

                    return (
                      <div
                        key={f.id}
                        onClick={() => nav('/flk')}
                        style={{
                          padding: 'var(--pad-card)',
                          borderBottom: i < Math.min(activeFlocks.length, 3) - 1 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 'var(--r-md)',
                            background: 'var(--accent-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--fs-md)', flexShrink: 0
                          }}>🐔</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 'var(--fs-sm)', fontWeight: 600,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {f.name}
                            </div>
                            <div style={{
                              fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {bird?.name || '—'} · {toFa(age)} روز · {toFa(flockCount)} پرنده
                              {flockHenDay > 0 ? ' · ' + toFa(flockHenDay.toFixed(0)) + '٪' : ''}
                            </div>
                          </div>
                          <Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : 'blue'}>
                            {lc.label}
                          </Tag>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {/* ============ ۷. جوجه‌کشی فعال ============ */}
            {activeEntries.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
                    🥚 جوجه‌کشی فعال ({toFa(activeEntries.length)})
                  </span>
                  <span onClick={() => nav('/inc')} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
                    مشاهده ←
                  </span>
                </div>
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden'
                }}>
                  {activeEntries.slice(0, 2).map((e, i) => {
                    const days = daysToHatch(e.expectedHatchDate);
                    const locked = isLockdown(e);
                    const window = isHatchWindow(e);
                    const bird = birds.find(b => b.id === e.birdId);

                    return (
                      <div
                        key={e.id}
                        onClick={() => nav('/inc')}
                        style={{
                          padding: 'var(--pad-card)',
                          borderBottom: i < Math.min(activeEntries.length, 2) - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex', alignItems: 'center', gap: 10,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--r-md)',
                          background: window ? 'var(--purple-soft)' : locked ? 'var(--warn-soft)' : 'var(--accent-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'var(--fs-md)', flexShrink: 0
                        }}>🥚</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 'var(--fs-sm)', fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {toFa(e.count || 0)} تخم — {bird?.name || '—'}
                          </div>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                            {window ? '🐣 پنجره هچ' : locked ? '🔒 Lock-down' : toFa(days) + ' روز مانده'}
                          </div>
                        </div>
                        {window ? <Tag tone="purple">هچ</Tag> : locked ? <Tag tone="amber">قفل</Tag> : <Tag tone="blue">{toFa(days)} روز</Tag>}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {/* ============ ۸. هشدار انبار ============ */}
            {stockAlerts > 0 ? (
              <div role="button" tabIndex={0}
                onClick={() => nav('/whs')}
                style={{
                  padding: 'var(--pad-card)',
                  background: 'var(--warn-soft)',
                  border: '1px solid var(--warn)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--warn)', fontWeight: 700 }}>
                  📦 هشدار انبار
                </span>
                <span style={{ fontSize: 'var(--fs-md)', color: 'var(--warn)', fontWeight: 700 }}>
                  {toFa(stockAlerts)} قلم
                </span>
              </div>
            ) : null}
    </>
  );
}