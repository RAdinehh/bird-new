/**
 * FlockList — لیست گله‌های فعال Dashboard
 */
import { Tag } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { getAgeDays, getLifecycle } from '../../flk/store';
import { healthyCount } from '../../egg/store';
import { dateDiffDays } from '../utils';

const CYCLE_MILESTONES: Record<string, { day: number; label: string }[]> = {
  layer:    [{ day: 7, label: 'جوجه' }, { day: 90, label: 'نیمچه' }, { day: 120, label: 'پولت' }, { day: 140, label: 'پیش‌تخم‌گذار' }],
  breeder:  [{ day: 7, label: 'جوجه' }, { day: 90, label: 'نیمچه' }, { day: 120, label: 'پولت' }, { day: 140, label: 'پیش‌تخم‌گذار' }],
  broiler:  [{ day: 7, label: 'آغازین' }, { day: 21, label: 'رشد' }],
};

interface Props {
  activeFlocks: any[];
  birds: any[];
  productions: any[];
  nav: (p: string) => void;
}

export default function FlockList({ activeFlocks, birds, productions, nav }: Props) {
  if (activeFlocks.length === 0) return null;
  return (
    <>
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
                              fontSize: 'var(--fs-base)', fontWeight: 700,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {f.name}
                            </div>
                            <div style={{
                              fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 3,
                              display: 'flex', alignItems: 'center', gap: 8,
                              whiteSpace: 'nowrap', overflow: 'hidden'
                            }}>
                              <span>{bird?.name || '—'}</span>
                              <span style={{ color: 'var(--border)' }}>|</span>
                              <span>{toFa(age)} روز</span>
                              <span style={{ color: 'var(--border)' }}>|</span>
                              <span>🐔 {toFa(flockCount)}</span>
                              {flockHenDay > 0 && (<>
                                <span style={{ color: 'var(--border)' }}>|</span>
                                <span>{toFa(flockHenDay.toFixed(0))}٪</span>
                              </>)}
                            </div>
                          </div>
                          <Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : 'blue'}>
                            {lc.label}
                          </Tag>
                        </div>
                        {/* نوار پیشرفت چرخه */}
                        {lc.progress > 0 && (() => {
                          const cycleDays = f.endOfCycleDay || bird?.cycleDays || 0;
                          if (!cycleDays) return null;
                          
                          const stageMilestones = (CYCLE_MILESTONES[f.type] || []).filter(m => m.day > 0 && m.day < cycleDays);
                          const progressColor = lc.progress >= 95 ? 'var(--danger)' : lc.progress >= 80 ? 'var(--warn)' : 'var(--accent)';
                          const markerPct = Math.min(100, Math.max(0, lc.progress));
                          const visibleMilestones: Array<{ mk: typeof stageMilestones[0]; pct: number }> = [];
                          { let ld = -1;
                            for (const mk of stageMilestones) {
                              if (ld < 0 || (mk.day - ld) >= cycleDays * 0.1) {
                                visibleMilestones.push({ mk, pct: (mk.day / cycleDays) * 100 });
                                ld = mk.day;
                              }
                            }
                          }
                          
                          return (
                            <div style={{ marginTop: 10 }}>
                              {/* اعداد دو سر — بالای نوار */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, marginBottom: 12, paddingRight: 2, paddingLeft: 2 }}>
                                <span>۱</span>
                                <span>{toFa(cycleDays)} روز</span>
                              </div>

                              {/* نوار + بج متحرک */}
                              <div style={{ position: 'relative', paddingTop: 26, paddingBottom: 18 }}>
                                {/* نوار اصلی */}
                                <div style={{
                                  position: 'relative',
                                  height: 14,
                                  background: 'var(--input-bg)',
                                  borderRadius: 5,
                                  border: '1px solid var(--border)',
                                  overflow: 'hidden',
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: markerPct + '%',
                                    background: progressColor,
                                    borderRadius: 5,
                                    transition: 'width .3s',
                                  }} />
                                </div>

                                {/* دات‌های نقاط عطف — روی نوار */}
                                {visibleMilestones.map(({ mk, pct }, idx) => {
                                  const passed = age >= mk.day;
                                  return (
                                    <div
                                      key={idx}
                                      title={mk.label + ' • روز ' + toFa(mk.day)}
                                      style={{
                                        position: 'absolute',
                                        top: 29,
                                        right: `calc(${pct}% - 3px)`,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: passed ? progressColor : 'var(--input-bg)',
                                        border: '2px solid ' + (passed ? progressColor : 'var(--border)'),
                                        zIndex: 1,
                                      }}
                                    />
                                  );
                                })}

                                {/* نقطه متحرک (نقطه فعلی) */}
                                <div style={{
                                  position: 'absolute',
                                  top: 26,
                                  right: `calc(${markerPct}% - 6px)`,
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: progressColor,
                                  border: '2.5px solid var(--card-solid)',
                                  boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                                  zIndex: 2,
                                  transition: 'right .3s',
                                }} />

                                {/* بج سن — بالای نوار */}
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  right: `calc(${markerPct}% - 20px)`,
                                  width: 40,
                                  height: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: progressColor,
                                  color: 'var(--avatar-text, #fff)',
                                  borderRadius: 5,
                                  fontSize: 'var(--fs-xs)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                                  zIndex: 3,
                                  transition: 'right .3s',
                                }}>{toFa(age)}</div>

                                {/* خط اتصال بج به نقطه */}
                                <div style={{
                                  position: 'absolute',
                                  top: 20,
                                  right: `calc(${markerPct}% - 1px)`,
                                  width: 2,
                                  height: 6,
                                  background: progressColor,
                                  opacity: 0.6,
                                  zIndex: 2,
                                  transition: 'right .3s',
                                }} />

                                {/* درصد پایین-راست نوار */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 2,
                                  fontSize: 'var(--fs-xs)',
                                  color: progressColor,
                                  fontWeight: 700,
                                }}>{toFa(Math.round(lc.progress))}٪</div>
                              </div>

                              {/* Legend مراحل */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 6 }}>
                                {stageMilestones.map((mk, idx) => {
                                  const passed = age >= mk.day;
                                  return (
                                    <div key={idx} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: '13px',
                                      color: passed ? 'var(--accent)' : 'var(--muted)',
                                      fontWeight: passed ? 700 : 500,
                                    }}>
                                      <span>{mk.label}</span>
                                      <span style={{ opacity: 0.6 }}>{toFa(mk.day)}</span>
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
    </>
  );
}
