/**
 * TodayCard — بخش «امروز در یک نگاه»: Benchmark گله + 9 KpiCard
 */
import BenchmarkCard from './BenchmarkCard';
import { KpiCard, SectionTitle, MiniEmpty } from './cards';
import { toFa } from '../../shr/utils/fa';

interface Props {
  benchmarkData: any;
  activeFlocks: any[];
  selectedFlockId: string;
  setSelectedFlockId: (v: string) => void;
  eggsToday: number;
  deathsToday: number;
  feedToday: number;
  tempToday: number;
  feedPerBirdGrams: number;
  waterPerBirdMl: number;
  nav: (path: string) => void;
  brokenToday: number;
  waterToday: number;
  humidToday: number;
}

export default function TodayCard({
  benchmarkData,
  activeFlocks,
  selectedFlockId,
  setSelectedFlockId,
  eggsToday,
  deathsToday,
  feedToday,
  tempToday,
  feedPerBirdGrams,
  waterPerBirdMl,
  nav,
  brokenToday,
  waterToday,
  humidToday,
}: Props) {
  const deathTone: 'accent' | 'warn' | 'danger' = deathsToday === 0 ? 'accent' : deathsToday <= 3 ? 'warn' : 'danger';
  if (activeFlocks.length === 0) {
    return (
      <>
        <SectionTitle>📅 امروز در یک نگاه</SectionTitle>
        <MiniEmpty
          icon="🐔"
          title="هنوز گله‌ای ثبت نشده"
          hint="برای شروع، از بخش گله‌ها اولین گله خود را اضافه کنید"
        />
      </>
    );
  }

  return (
    <>
                {benchmarkData && activeFlocks.length > 0 && (
                  <div style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '10px 12px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      gap: 8,
                    }}>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                        🎯 Benchmark گله
                      </div>
                      {activeFlocks.length > 1 && (
                        <select
                          value={selectedFlockId}
                          onChange={e => setSelectedFlockId(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            fontSize: 'var(--fs-xs)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--r-sm)',
                            color: 'var(--text)',
                            fontFamily: 'inherit',
                            maxWidth: 140,
                          }}
                        >
                          {activeFlocks.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {benchmarkData.hasData ? (
                      <>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 4,
                          marginBottom: 6,
                        }}>
                          <div style={{
                            padding: '6px 10px',
                            background: 'var(--input-bg)',
                            borderRadius: 'var(--r-sm)',
                          }}>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                              FCR فعلی
                            </div>
                            <div style={{
                              fontSize: 'var(--fs-md)',
                              fontWeight: 700,
                              color: benchmarkData.fcrDiff <= 0 ? 'var(--accent)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn)' : 'var(--danger)',
                              fontVariantNumeric: 'tabular-nums',
                            }}>
                              {toFa(benchmarkData.fcrActual)}
                            </div>
                          </div>
                          <div style={{
                            padding: '6px 10px',
                            background: 'var(--input-bg)',
                            borderRadius: 'var(--r-sm)',
                          }}>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                              FCR استاندارد
                            </div>
                            <div style={{
                              fontSize: 'var(--fs-md)',
                              fontWeight: 700,
                              color: 'var(--text)',
                              fontVariantNumeric: 'tabular-nums',
                            }}>
                              {toFa(benchmarkData.fcrStandard)}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          padding: '6px 10px',
                          background: benchmarkData.fcrDiff <= 0 ? 'var(--accent-soft)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn-soft)' : 'var(--danger-soft)',
                          border: `1px solid ${benchmarkData.fcrDiff <= 0 ? 'var(--accent-border)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn)' : 'var(--danger)'}`,
                          borderRadius: 'var(--r-sm)',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 700,
                          color: benchmarkData.fcrDiff <= 0 ? 'var(--accent)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn)' : 'var(--danger)',
                          textAlign: 'center',
                        }}>
                          {benchmarkData.fcrDiff <= 0
                            ? `✅ بهتر از استاندارد (${toFa(Math.abs(benchmarkData.fcrDiff))}٪)`
                            : `⚠️ ${toFa(benchmarkData.fcrDiff)}٪ بالاتر از استاندارد`}
                        </div>

                        {benchmarkData.henDay > 0 && (
                          <div style={{
                            marginTop: 6,
                            padding: '6px 10px',
                            background: 'var(--input-bg)',
                            borderRadius: 'var(--r-sm)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 'var(--fs-xs)',
                          }}>
                            <span style={{ color: 'var(--muted)' }}>Hen-Day این گله</span>
                            <span style={{
                              fontWeight: 700,
                              color: benchmarkData.henDay >= 80 ? 'var(--accent)' : benchmarkData.henDay >= 60 ? 'var(--warn)' : 'var(--danger)',
                            }}>
                              {toFa(benchmarkData.henDay)}٪
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{
                        padding: '10px 12px',
                        background: 'var(--input-bg)',
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--muted)',
                        textAlign: 'center',
                      }}>
                        ⚠️ داده کافی برای Benchmark وجود ندارد
                        <div style={{ marginTop: 4 }}>
                          (نیاز به: ثبت روزانه + تخم‌گذاری + FCR نژاد)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <SectionTitle>📅 امروز در یک نگاه</SectionTitle>
                <BenchmarkCard />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <KpiCard
                    icon="🥚"
                    label="تخم امروز"
                    value={eggsToday}
                    unit="عدد"
                    color="accent"
                    onClick={() => nav('/egg')}
                  />
                  <KpiCard
                    icon="💀"
                    label="تلفات امروز"
                    value={deathsToday}
                    unit="پرنده"
                    color={deathTone}
                    onClick={() => nav('/dlg')}
                  />
                  <KpiCard
                    icon="🌾"
                    label="دان امروز"
                    value={feedToday}
                    unit="kg"
                    color="warn"
                    onClick={() => nav('/dlg')}
                  />
                  <KpiCard
                    icon="🌡"
                    label="دمای سالن"
                    value={tempToday}
                    unit={tempToday > 0 ? '°C' : 'ثبت نشده'}
                    color={tempToday > 26 || (tempToday > 0 && tempToday < 18) ? 'warn' : 'info'}
                    noFormat
                    onClick={() => nav('/dlg')}
                  />
                  <KpiCard
                    icon="🌾"
                    label="دان/پرنده"
                    value={feedPerBirdGrams}
                    unit="گرم در روز"
                    color={feedPerBirdGrams > 0 && feedPerBirdGrams <= 150 ? 'accent' : 'warn'}
                    noFormat
                    onClick={() => nav('/dlg')}
                  />
                  <KpiCard
                    icon="💧"
                    label="آب/پرنده"
                    value={waterPerBirdMl}
                    unit="میلی‌لیتر در روز"
                    color={waterPerBirdMl > 0 && waterPerBirdMl <= 300 ? 'info' : 'warn'}
                    noFormat
                    onClick={() => nav('/dlg')}
                  />
                            <KpiCard
              icon="🥚"
              label="تخم شکسته"
              value={brokenToday}
              unit="عدد"
              color={brokenToday > 0 ? 'warn' : 'info'}
              onClick={() => nav('/egg')}
            />
            <KpiCard
              icon="💧"
              label="آب مصرفی"
              value={waterToday}
              unit="لیتر"
              color="info"
              onClick={() => nav('/dlg')}
            />
            <KpiCard
              icon="💦"
              label="رطوبت سالن"
              value={humidToday}
              unit={humidToday > 0 ? '٪' : 'ثبت نشده'}
              color={humidToday > 70 ? 'warn' : 'info'}
              noFormat
              onClick={() => nav('/dlg')}
            />
          </div>
    </>
  );
}