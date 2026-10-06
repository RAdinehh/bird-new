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

// نقاط عطف چرخه (روز) برای هر نوع گله
const CYCLE_MILESTONES: Record<string, { day: number; label: string }[]> = {
  layer:    [{ day: 7, label: 'جوجه' }, { day: 90, label: 'نیمچه' }, { day: 120, label: 'پولت' }, { day: 140, label: 'پیش‌تخم‌گذار' }],
  breeder:  [{ day: 7, label: 'جوجه' }, { day: 90, label: 'نیمچه' }, { day: 120, label: 'پولت' }, { day: 140, label: 'پیش‌تخم‌گذار' }],
  broiler:  [{ day: 7, label: 'آغازین' }, { day: 21, label: 'رشد' }],
};

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
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
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
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
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
                    const bird = birds.find(b => b.id === f.birdId);
                    const lc = getLifecycle(f.type, age, f.endOfCycleDay ?? null, bird?.cycleDays ?? null);
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
                        {/* نوار پیشرفت چرخه */}
                        {lc.progress > 0 && (() => {
                          const cycleDays = f.endOfCycleDay || bird?.cycleDays || 0;
                          const milestones = (CYCLE_MILESTONES[f.type] || [])
                            .filter(m => m.day > 0 && m.day < cycleDays);
                          const progressColor = lc.progress >= 95 ? 'var(--danger)' : lc.progress >= 80 ? 'var(--warn)' : 'var(--accent)';
                          const currentStageLabel = lc.label;
                          return (
                            <div style={{ marginTop: 10 }}>
                              {/* ردیف بالا: عنوان + آمار */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)', marginBottom: 6 }}>
                                <span style={{ color: progressColor, fontWeight: 700 }}>
                                  🔄 {currentStageLabel} · {toFa(Math.round(lc.progress))}٪
                                </span>
                                {cycleDays > 0 && (
                                  <span style={{ color: 'var(--muted)' }}>
                                    روز {toFa(age)} از {toFa(cycleDays)}
                                  </span>
                                )}
                              </div>

                              {/* نوار پیشرفت با نقاط عطف */}
                              <div style={{ position: 'relative', paddingTop: 10, paddingBottom: 16 }}>
                                {/* نوار اصلی */}
                                <div style={{
                                  position: 'relative',
                                  height: 10,
                                  background: 'var(--input-bg)',
                                  borderRadius: 5,
                                  border: '1px solid var(--border)',
                                  overflow: 'hidden',
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: Math.min(100, lc.progress) + '%',
                                    background: progressColor,
                                    borderRadius: 5,
                                    transition: 'width .3s',
                                  }} />
                                </div>

                                {/* نقاط عطف */}
                                {milestones.map((m, idx) => {
                                  const pct = (m.day / cycleDays) * 100;
                                  const passed = age >= m.day;
                                  // پله‌ای: برچسب‌های فرد یک خط بالاتر
                                  const labelOffset = idx % 2 === 0 ? 22 : 34;
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        position: 'absolute',
                                        right: `calc(${pct}% - 8px)`,
                                        top: 0,
                                        width: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        pointerEvents: 'none',
                                      }}
                                      title={m.label + ' · روز ' + toFa(m.day)}
                                    >
                                      {/* نقطه روی نوار */}
                                      <div style={{
                                        width: passed ? 8 : 6,
                                        height: passed ? 8 : 6,
                                        borderRadius: '50%',
                                        background: passed ? progressColor : 'var(--card-solid)',
                                        border: '2px solid ' + (passed ? progressColor : 'var(--border)'),
                                        boxShadow: '0 0 0 2px var(--card-solid)',
                                        marginTop: passed ? 11 : 12,
                                        transition: 'all .2s',
                                      }} />
                                      {/* خط اتصال کوتاه */}
                                      <div style={{
                                        width: 1,
                                        height: idx % 2 === 0 ? 4 : 16,
                                        background: 'var(--border)',
                                        opacity: 0.6,
                                      }} />
                                      {/* برچسب */}
                                      <div style={{
                                        position: 'absolute',
                                        top: labelOffset,
                                        fontSize: 9,
                                        fontWeight: passed ? 700 : 500,
                                        color: passed ? progressColor : 'var(--muted)',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center',
                                        transform: 'translateX(50%)',
                                        right: '50%',
                                      }}>{m.label}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
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
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
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